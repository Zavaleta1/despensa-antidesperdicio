const { pool } = require("../config/database");

const {
  agregarSemaforo,
} = require("../utils/expiration");


// ==========================================
// NIVELES QUE GENERAN NOTIFICACIONES
// ==========================================

const NIVELES_NOTIFICABLES = [
  "caducado",
  "critico",
  "proximo",
  "atencion",
];


// ==========================================
// OBTENER PREFERENCIA CORRESPONDIENTE
// ==========================================

function obtenerCampoPreferencia(nivel) {
  switch (nivel) {
    case "caducado":
      return "notify_expired";

    case "critico":
      return "notify_critical";

    case "proximo":
      return "notify_upcoming";

    case "atencion":
      return "notify_attention";

    case "vigente":
      return "notify_current";

    default:
      return null;
  }
}


// ==========================================
// CREAR TEXTO DE LA NOTIFICACIÓN
// ==========================================

function crearContenidoNotificacion(producto) {
  const dias = producto.days_remaining;
  const nombre = producto.name;

  switch (producto.expiration_level) {
    // ======================================
    // CADUCADO
    // ======================================

    case "caducado": {
      const diasCaducado =
        Math.abs(dias);

      return {
        notification_type:
          "expiration",

        title:
          `${nombre} ha caducado`,

        message:
          diasCaducado === 1
            ? `${nombre} caducó hace 1 día. Revisa el producto antes de consumirlo.`
            : `${nombre} caducó hace ${diasCaducado} días. Revisa el producto antes de consumirlo.`,
      };
    }


    // ======================================
    // CRÍTICO
    // ======================================

    case "critico":
      if (dias === 0) {
        return {
          notification_type:
            "expiration",

          title:
            `${nombre} caduca hoy`,

          message:
            `Te recomendamos aprovechar ${nombre} hoy para evitar desperdicio.`,
        };
      }

      if (dias === 1) {
        return {
          notification_type:
            "expiration",

          title:
            `${nombre} caduca mañana`,

          message:
            `Queda 1 día para la fecha de caducidad de ${nombre}.`,
        };
      }

      return {
        notification_type:
          "expiration",

        title:
          `${nombre} necesita tu atención`,

        message:
          `Quedan ${dias} días para la fecha de caducidad de ${nombre}.`,
      };


    // ======================================
    // PRÓXIMO
    // ======================================

    case "proximo":
      return {
        notification_type:
          "expiration",

        title:
          `${nombre} está próximo a caducar`,

        message:
          `Quedan ${dias} días para la fecha de caducidad de ${nombre}.`,
      };


    // ======================================
    // ATENCIÓN
    // ======================================

    case "atencion":
      return {
        notification_type:
          "expiration",

        title:
          `Planea utilizar ${nombre}`,

        message:
          `Quedan ${dias} días para la fecha de caducidad de ${nombre}.`,
      };


    // ======================================
    // VIGENTE
    // ======================================

    case "vigente":
      return {
        notification_type:
          "expiration",

        title:
          `${nombre} continúa vigente`,

        message:
          `Quedan ${dias} días para la fecha de caducidad de ${nombre}.`,
      };


    default:
      return null;
  }
}


// ==========================================
// OBTENER / CREAR PREFERENCIAS
// ==========================================

async function obtenerPreferencias(userId) {
  let result = await pool.query(
    `
      SELECT
        id,
        user_id,
        in_app_enabled,
        email_enabled,
        notify_expired,
        notify_critical,
        notify_upcoming,
        notify_attention,
        notify_current

      FROM public."NotificationPreferences"

      WHERE user_id = $1
    `,
    [userId]
  );


  // ========================================
  // YA EXISTEN
  // ========================================

  if (result.rows.length > 0) {
    return result.rows[0];
  }


  // ========================================
  // CREAR PREFERENCIAS POR DEFECTO
  // ========================================

  result = await pool.query(
    `
      INSERT INTO public."NotificationPreferences"
      (
        user_id
      )

      VALUES
      (
        $1
      )

      RETURNING *
    `,
    [userId]
  );

  return result.rows[0];
}


// ==========================================
// COMPROBAR SI EL NIVEL ESTÁ HABILITADO
// ==========================================

function debeNotificar(
  preferencias,
  nivel
) {
  if (!preferencias.in_app_enabled) {
    return false;
  }

  const campo =
    obtenerCampoPreferencia(nivel);

  if (!campo) {
    return false;
  }

  return Boolean(
    preferencias[campo]
  );
}


// ==========================================
// GENERAR NOTIFICACIONES DEL USUARIO
// ==========================================

async function generarNotificacionesUsuario(
  userId
) {
  const preferencias =
    await obtenerPreferencias(userId);


  // ========================================
  // OBTENER PRODUCTOS
  // ========================================

  const productosResult =
    await pool.query(
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


  let creadas = 0;


  // ========================================
  // REVISAR PRODUCTOS
  // ========================================

  for (
    const productoOriginal
    of productosResult.rows
  ) {
    const producto =
      agregarSemaforo(
        productoOriginal
      );


    // ======================================
    // NO NOTIFICABLES
    // ======================================

    if (
      producto.expiration_level ===
        "agotado" ||
      producto.expiration_level ===
        "sin-fecha"
    ) {
      continue;
    }


    const nivel =
      producto.expiration_level;


    if (
      !NIVELES_NOTIFICABLES.includes(
        nivel
      ) &&
      nivel !== "vigente"
    ) {
      continue;
    }


    // ======================================
    // REVISAR PREFERENCIAS
    // ======================================

    if (
      !debeNotificar(
        preferencias,
        nivel
      )
    ) {
      continue;
    }


    // ======================================
    // CREAR CONTENIDO
    // ======================================

    const contenido =
      crearContenidoNotificacion(
        producto
      );

    if (!contenido) {
      continue;
    }


    // ======================================
    // EVITAR DUPLICADOS
    // ======================================

    /*
      Solo debe existir una notificación
      del mismo nivel para el mismo producto.

      Si el producto cambia:

      atención -> próximo
      próximo -> crítico
      crítico -> caducado

      entonces sí se genera una nueva.
    */

    const existente =
      await pool.query(
        `
          SELECT id

          FROM public."Notifications"

          WHERE
            user_id = $1
            AND product_id = $2
            AND expiration_level = $3
            AND notification_type =
                'expiration'

          LIMIT 1
        `,
        [
          userId,
          producto.id,
          nivel,
        ]
      );


    if (
      existente.rows.length > 0
    ) {
      continue;
    }


    // ======================================
    // INSERTAR NOTIFICACIÓN
    // ======================================

    await pool.query(
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
          $1,
          $2,
          $3,
          $4,
          $5,
          $6
        )
      `,
      [
        userId,
        producto.id,
        contenido.notification_type,
        nivel,
        contenido.title,
        contenido.message,
      ]
    );

    creadas++;
  }


  return {
    creadas,
  };
}


// ==========================================
// OBTENER NOTIFICACIONES
// ==========================================

async function obtenerNotificacionesUsuario(
  userId
) {
  // ========================================
  // OBTENER PREFERENCIAS
  // ========================================

  const preferencias =
    await obtenerPreferencias(userId);


  // ========================================
  // NOTIFICACIONES DESACTIVADAS EN APP
  // ========================================

  /*
    Si el usuario desactivó completamente
    las notificaciones dentro de la app,
    no devolvemos ninguna.

    Las notificaciones históricas permanecen
    en PostgreSQL. Simplemente no se muestran.
  */

  if (!preferencias.in_app_enabled) {
    return [];
  }


  // ========================================
  // GENERAR NUEVAS NOTIFICACIONES
  // ========================================

  await generarNotificacionesUsuario(
    userId
  );


  // ========================================
  // OBTENER NOTIFICACIONES HABILITADAS
  // ========================================

  const result = await pool.query(
    `
      SELECT
        n.id,
        n.user_id,
        n.product_id,

        p.name AS product_name,

        n.notification_type,
        n.expiration_level,

        n.title,
        n.message,

        n.is_read,

        n.email_sent,
        n.email_sent_at,

        n.created_at

      FROM public."Notifications" AS n

      LEFT JOIN public."Products" AS p
        ON n.product_id = p.id

      WHERE
        n.user_id = $1

        AND
        (
          n.notification_type <> 'expiration'

          OR
          (
            n.notification_type = 'expiration'

            AND
            (
              (
                n.expiration_level =
                  'caducado'
                AND $2::boolean = TRUE
              )

              OR

              (
                n.expiration_level =
                  'critico'
                AND $3::boolean = TRUE
              )

              OR

              (
                n.expiration_level =
                  'proximo'
                AND $4::boolean = TRUE
              )

              OR

              (
                n.expiration_level =
                  'atencion'
                AND $5::boolean = TRUE
              )

              OR

              (
                n.expiration_level =
                  'vigente'
                AND $6::boolean = TRUE
              )
            )
          )
        )

      ORDER BY
        n.created_at DESC,
        n.id DESC
    `,
    [
      userId,
      Boolean(
        preferencias.notify_expired
      ),
      Boolean(
        preferencias.notify_critical
      ),
      Boolean(
        preferencias.notify_upcoming
      ),
      Boolean(
        preferencias.notify_attention
      ),
      Boolean(
        preferencias.notify_current
      ),
    ]
  );


  return result.rows;
}


// ==========================================
// MARCAR UNA NOTIFICACIÓN COMO LEÍDA
// ==========================================

async function marcarNotificacionLeida(
  userId,
  notificationId
) {
  const result =
    await pool.query(
      `
        UPDATE public."Notifications"

        SET
          is_read = TRUE

        WHERE
          id = $1
          AND user_id = $2

        RETURNING *
      `,
      [
        notificationId,
        userId,
      ]
    );


  return (
    result.rows[0] || null
  );
}


// ==========================================
// MARCAR TODAS COMO LEÍDAS
// ==========================================

async function marcarTodasLeidas(
  userId
) {
  const result =
    await pool.query(
      `
        UPDATE public."Notifications"

        SET
          is_read = TRUE

        WHERE
          user_id = $1
          AND is_read = FALSE

        RETURNING id
      `,
      [userId]
    );


  return result.rowCount;
}


// ==========================================
// EXPORTACIONES
// ==========================================

module.exports = {
  generarNotificacionesUsuario,
  obtenerNotificacionesUsuario,
  marcarNotificacionLeida,
  marcarTodasLeidas,
};