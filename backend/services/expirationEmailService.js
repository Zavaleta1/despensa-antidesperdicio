
const { pool } = require("../config/database");

const {
  agregarSemaforo,
} = require("../utils/expiration");

const {
  enviarCorreoVencimientoProductos,
} = require("./emailService");

// ==========================================
// CONFIGURACIÓN
// ==========================================

const NIVELES = {
  caducado: "notify_expired",
  critico: "notify_critical",
  proximo: "notify_upcoming",
  atencion: "notify_attention",
  vigente: "notify_current",
};

const MAX_PRODUCTOS_CORREO = 50;

const CLAVE_BLOQUEO_GENERACION = 9706;
const CLAVE_BLOQUEO_ENVIO = 9709;

const ZONA_HORARIA_CORREOS =
  process.env.DAILY_EMAIL_TIMEZONE ||
  "America/Mexico_City";

// ==========================================
// OBTENER FECHA LOCAL DEL ENVÍO
// ==========================================

function obtenerFechaDiaria() {
  const partes = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: ZONA_HORARIA_CORREOS,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(new Date());

  const valores = Object.fromEntries(
    partes.map((parte) => [
      parte.type,
      parte.value,
    ])
  );

  return (
    `${valores.year}-` +
    `${valores.month}-` +
    `${valores.day}`
  );
}

// ==========================================
// VALIDAR PREFERENCIAS
// ==========================================

function nivelHabilitado(preferencias, nivel) {
  const campo = NIVELES[nivel];

  return Boolean(
    preferencias &&
    preferencias.email_enabled &&
    campo &&
    preferencias[campo]
  );
}

// ==========================================
// OBTENER PREFERENCIAS
// ==========================================

async function obtenerPreferencias(userId) {
  const resultado = await pool.query(
    `
      SELECT *
      FROM public."NotificationPreferences"
      WHERE user_id = $1
    `,
    [userId]
  );

  return resultado.rows[0] || null;
}

// ==========================================
// CONSULTAR ENVÍO DIARIO
// ==========================================

async function obtenerEnvioDiario(userId, fecha) {
  const resultado = await pool.query(
    `
      SELECT
        id,
        status,
        started_at,
        completed_at,
        email_count,
        product_count
      FROM public."DailyEmailDispatches"
      WHERE user_id = $1
        AND dispatch_date = $2::date
      LIMIT 1
    `,
    [userId, fecha]
  );

  return resultado.rows[0] || null;
}

// ==========================================
// GENERAR AVISOS PENDIENTES
// ==========================================

async function generarAvisosCorreoUsuario(
  userId,
  preferencias
) {
  if (!preferencias?.email_enabled) {
    return 0;
  }

  const resultado = await pool.query(
    `
      SELECT
        id,
        user_id,
        name,
        expiration_date,
        status
      FROM public."Products"
      WHERE user_id = $1
    `,
    [userId]
  );

  const productos = resultado.rows
    .map(agregarSemaforo)
    .filter((producto) =>
      nivelHabilitado(
        preferencias,
        producto.expiration_level
      )
    );

  if (!productos.length) {
    return 0;
  }

  const client = await pool.connect();
  let creados = 0;

  try {
    await client.query("BEGIN");

    await client.query(
      `
        SELECT pg_advisory_xact_lock($1, $2)
      `,
      [CLAVE_BLOQUEO_GENERACION, userId]
    );

    for (const producto of productos) {
      const nivel = producto.expiration_level;

      const existente = await client.query(
        `
          SELECT id
          FROM public."Notifications"
          WHERE user_id = $1
            AND product_id = $2
            AND notification_type = 'expiration'
            AND expiration_level = $3
          LIMIT 1
        `,
        [userId, producto.id, nivel]
      );

      if (existente.rows.length) {
        continue;
      }

      const titulo =
        `${producto.name}: aviso de caducidad`;

      const mensaje =
        `${producto.name} tiene estado ` +
        `${producto.expiration_status}. ` +
        `Días restantes: ` +
        `${producto.days_remaining}.`;

      await client.query(
        `
          INSERT INTO public."Notifications"
          (
            user_id,
            product_id,
            notification_type,
            expiration_level,
            title,
            message
          )
          VALUES
          (
            $1, $2, 'expiration',
            $3, $4, $5
          )
        `,
        [
          userId,
          producto.id,
          nivel,
          titulo,
          mensaje,
        ]
      );

      creados++;
    }

    await client.query("COMMIT");

    return creados;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ==========================================
// RESERVAR ENVÍO DIARIO
// ==========================================

// Solo se permite crear una reserva nueva.
// Los registros processing y failed
// NO se reintentan automáticamente porque
// podrían representar un envío incierto.

async function reservarEnvioDiario(
  userId,
  fecha
) {
  const resultado = await pool.query(
    `
      INSERT INTO public."DailyEmailDispatches"
      (
        user_id,
        dispatch_date,
        status,
        started_at,
        email_count,
        product_count
      )
      VALUES
      (
        $1,
        $2::date,
        'processing',
        NOW(),
        0,
        0
      )
      ON CONFLICT (user_id, dispatch_date)
      DO NOTHING
      RETURNING id
    `,
    [userId, fecha]
  );

  return resultado.rows[0] || null;
}

// ==========================================
// MARCAR ENVÍO DIARIO COMO COMPLETADO
// ==========================================

async function completarEnvioDiario(
  client,
  dispatchId,
  cantidadProductos
) {
  await client.query(
    `
      UPDATE public."DailyEmailDispatches"
      SET
        status = 'sent',
        completed_at = NOW(),
        email_count = 1,
        product_count = $2
      WHERE id = $1
        AND status = 'processing'
    `,
    [dispatchId, cantidadProductos]
  );
}

// ==========================================
// MARCAR ENVÍO DIARIO COMO FALLIDO
// ==========================================

async function marcarEnvioDiarioFallido(
  dispatchId
) {
  await pool.query(
    `
      UPDATE public."DailyEmailDispatches"
      SET
        status = 'failed',
        completed_at = NOW()
      WHERE id = $1
        AND status = 'processing'
    `,
    [dispatchId]
  );
}

// ==========================================
// ELIMINAR RESERVA SIN ENVÍO
// ==========================================

// Solo se usa si todavía NO se ha
// iniciado el intento SMTP.

async function eliminarReservaSinEnvio(
  dispatchId
) {
  await pool.query(
    `
      DELETE FROM public."DailyEmailDispatches"
      WHERE id = $1
        AND status = 'processing'
        AND email_count = 0
    `,
    [dispatchId]
  );
}

// ==========================================
// OBTENER AVISOS PENDIENTES
// ==========================================

async function obtenerAvisosPendientes(
  userId,
  preferencias
) {
  const resultado = await pool.query(
    `
      SELECT
        n.id AS notification_id,
        n.expiration_level,
        p.id AS product_id,
        p.name,
        p.expiration_date,
        p.status
      FROM public."Notifications" AS n
      JOIN public."Products" AS p
        ON p.id = n.product_id
       AND p.user_id = n.user_id
      WHERE n.user_id = $1
        AND n.notification_type = 'expiration'
        AND n.email_sent = FALSE
        AND n.email_processing_at IS NULL
      ORDER BY n.id
    `,
    [userId]
  );

  const productos = [];
  const notificaciones = [];
  const productosIncluidos = new Set();

  for (const registro of resultado.rows) {
    const producto = agregarSemaforo(registro);

    if (
      producto.expiration_level !==
      registro.expiration_level
    ) {
      continue;
    }

    if (
      !nivelHabilitado(
        preferencias,
        producto.expiration_level
      )
    ) {
      continue;
    }

    // No incluir el mismo producto dos veces
    // dentro del mismo correo.
    if (
      productosIncluidos.has(
        registro.product_id
      )
    ) {
      continue;
    }

    productosIncluidos.add(
      registro.product_id
    );

    productos.push({
      nombre: producto.name,
      fechaCaducidad:
        producto.expiration_date,
      estado: producto.expiration_level,
    });

    notificaciones.push({
      id: registro.notification_id,
      product_id: registro.product_id,
      expiration_level:
        registro.expiration_level,
    });

    if (
      productos.length >=
      MAX_PRODUCTOS_CORREO
    ) {
      break;
    }
  }

  return {
    productos,
    notificaciones,
  };
}

// ==========================================
// MARCAR NOTIFICACIONES ENVIADAS
// ==========================================

async function marcarNotificacionesEnviadas(
  client,
  notificaciones
) {
  const ids = notificaciones.map(
    (notificacion) => notificacion.id
  );

  if (!ids.length) {
    return 0;
  }

  const resultado = await client.query(
    `
      UPDATE public."Notifications"
      SET
        email_sent = TRUE,
        email_sent_at = NOW(),
        email_processing_at = NULL
      WHERE id = ANY($1::integer[])
        AND email_sent = FALSE
        AND email_processing_at IS NULL
      RETURNING id
    `,
    [ids]
  );

  return resultado.rowCount;
}

// ==========================================
// REGISTRAR ENVÍO COMPLETO
// ==========================================

// Las notificaciones y el registro diario
// se actualizan en una misma transacción.

async function registrarEnvioCompleto(
  dispatchId,
  notificaciones
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const actualizadas =
      await marcarNotificacionesEnviadas(
        client,
        notificaciones
      );

    if (
      actualizadas !==
      notificaciones.length
    ) {
      throw new Error(
        "No se pudieron actualizar todas " +
        "las notificaciones enviadas."
      );
    }

    await completarEnvioDiario(
      client,
      dispatchId,
      notificaciones.length
    );

    await client.query("COMMIT");

    return actualizadas;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ==========================================
// PROCESAR CORREOS DE UN USUARIO
// ==========================================

async function procesarCorreosUsuario(usuario) {
  const resumen = {
    enviados: 0,
    errores: 0,
    productosNotificados: 0,
  };

  const client = await pool.connect();

  let bloqueoAdquirido = false;
  let reservaDiaria = null;
  let intentoSmtpIniciado = false;

  try {
    // ======================================
    // BLOQUEO POR USUARIO
    // ======================================

    const bloqueo = await client.query(
      `
        SELECT pg_try_advisory_lock(
          $1, $2
        ) AS adquirido
      `,
      [
        CLAVE_BLOQUEO_ENVIO,
        usuario.id,
      ]
    );

    bloqueoAdquirido =
      bloqueo.rows[0].adquirido;

    if (!bloqueoAdquirido) {
      console.log(
        `⏳ Usuario ${usuario.id}: ` +
        "ya existe una revisión en curso."
      );

      return resumen;
    }

    // ======================================
    // VALIDAR PREFERENCIAS
    // ======================================

    let preferencias =
      await obtenerPreferencias(usuario.id);

    if (!preferencias?.email_enabled) {
      return resumen;
    }

    // ======================================
    // COMPROBAR ENVÍO DIARIO
    // ======================================

    const fecha = obtenerFechaDiaria();

    const envioExistente =
      await obtenerEnvioDiario(
        usuario.id,
        fecha
      );

    if (envioExistente) {
      console.log(
        `📭 Usuario ${usuario.id}: ` +
        `ya existe un registro diario ` +
        `(${envioExistente.status}).`
      );

      return resumen;
    }

    // ======================================
    // GENERAR AVISOS
    // ======================================

    await generarAvisosCorreoUsuario(
      usuario.id,
      preferencias
    );

    // ======================================
    // CONSULTAR PRODUCTOS
    // ======================================

    let datos =
      await obtenerAvisosPendientes(
        usuario.id,
        preferencias
      );

    if (!datos.productos.length) {
      console.log(
        `📭 Usuario ${usuario.id}: ` +
        "sin avisos pendientes."
      );

      return resumen;
    }

    // ======================================
    // RESERVAR EL DÍA
    // ======================================

    reservaDiaria =
      await reservarEnvioDiario(
        usuario.id,
        fecha
      );

    if (!reservaDiaria) {
      console.log(
        `📭 Usuario ${usuario.id}: ` +
        "otro proceso reservó el día."
      );

      return resumen;
    }

    // ======================================
    // REVALIDAR PREFERENCIAS
    // ======================================

    preferencias =
      await obtenerPreferencias(usuario.id);

    if (!preferencias?.email_enabled) {
      await eliminarReservaSinEnvio(
        reservaDiaria.id
      );

      reservaDiaria = null;

      return resumen;
    }

    datos = await obtenerAvisosPendientes(
      usuario.id,
      preferencias
    );

    if (!datos.productos.length) {
      await eliminarReservaSinEnvio(
        reservaDiaria.id
      );

      reservaDiaria = null;

      return resumen;
    }

    // ======================================
    // ENVIAR RESUMEN AGRUPADO
    // ======================================

    console.log(
      `📧 Preparando resumen de ` +
      `${datos.productos.length} productos ` +
      `para usuario ${usuario.id}`
    );

    // Desde este punto, un error podría
    // ocurrir después de que SMTP acepte
    // el correo. No reintentar automáticamente.
    intentoSmtpIniciado = true;

    await enviarCorreoVencimientoProductos({
      email: usuario.email,
      nombreUsuario: usuario.name,
      productos: datos.productos,
    });

    // ======================================
    // REGISTRAR RESULTADO
    // ======================================

    const actualizadas =
      await registrarEnvioCompleto(
        reservaDiaria.id,
        datos.notificaciones
      );

    resumen.enviados = 1;
    resumen.productosNotificados =
      actualizadas;

    console.log(
      `✅ Resumen enviado a usuario ` +
      `${usuario.id}: ` +
      `${actualizadas} productos.`
    );

    return resumen;
  } catch (error) {
    resumen.errores++;

    console.error(
      `❌ Error procesando usuario ` +
      `${usuario.id}:`,
      error
    );

    if (reservaDiaria) {
      try {
        if (intentoSmtpIniciado) {
          await marcarEnvioDiarioFallido(
            reservaDiaria.id
          );

          console.warn(
            "⚠️ Envío incierto. " +
            "Revisar antes de reintentar."
          );
        } else {
          await eliminarReservaSinEnvio(
            reservaDiaria.id
          );
        }
      } catch (errorRegistro) {
        console.error(
          "Error actualizando envío diario:",
          errorRegistro
        );
      }
    }

    return resumen;
  } finally {
    // ======================================
    // LIBERAR BLOQUEO
    // ======================================

    if (bloqueoAdquirido) {
      try {
        await client.query(
          `
            SELECT pg_advisory_unlock(
              $1, $2
            )
          `,
          [
            CLAVE_BLOQUEO_ENVIO,
            usuario.id,
          ]
        );
      } catch (error) {
        console.error(
          "Error liberando bloqueo:",
          error
        );
      }
    }

    client.release();
  }
}

// ==========================================
// REVISAR TODOS LOS USUARIOS
// ==========================================

async function ejecutarRevisionCorreos() {
  console.log(
    "📧 Iniciando revisión de vencimientos..."
  );

  const usuariosResult = await pool.query(
    `
      SELECT
        u.id,
        u.name,
        u.email
      FROM public."Users" AS u
      JOIN public."NotificationPreferences" AS pref
        ON pref.user_id = u.id
      WHERE pref.email_enabled = TRUE
      ORDER BY u.id
    `
  );

  const resumen = {
    usuarios: usuariosResult.rows.length,
    enviados: 0,
    productosNotificados: 0,
    errores: 0,
  };

  for (const usuario of usuariosResult.rows) {
    try {
      const resultado =
        await procesarCorreosUsuario(usuario);

      resumen.enviados +=
        resultado.enviados;

      resumen.productosNotificados +=
        resultado.productosNotificados;

      resumen.errores +=
        resultado.errores;
    } catch (error) {
      resumen.errores++;

      console.error(
        `❌ Error procesando usuario ` +
        `${usuario.id}:`,
        error
      );
    }
  }

  console.log(
    "📧 Revisión finalizada:",
    resumen
  );

  return resumen;
}

// ==========================================
// EXPORTACIONES
// ==========================================

module.exports = {
  generarAvisosCorreoUsuario,
  procesarCorreosUsuario,
  ejecutarRevisionCorreos,
  obtenerFechaDiaria,
  obtenerEnvioDiario,
};
