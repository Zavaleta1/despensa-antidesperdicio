
const nodemailer = require("nodemailer");

// ==========================================
// CONFIGURACIÓN DEL SERVICIO DE CORREO
// ==========================================

const obtenerConfiguracionCorreo = () => {
  const proveedor = (
    process.env.MAIL_PROVIDER || "smtp"
  ).trim().toLowerCase();

  const usuario = process.env.MAIL_USER;
  const password = process.env.MAIL_PASSWORD;

  if (!usuario || !password) {
    throw new Error(
      "Faltan MAIL_USER o MAIL_PASSWORD en la configuración"
    );
  }

  // ========================================
  // GMAIL
  // ========================================

  if (proveedor === "gmail") {
    return {
      service: "gmail",
      auth: {
        user: usuario,
        pass: password,
      },
    };
  }

  // ========================================
  // SMTP EMPRESARIAL U OTRO PROVEEDOR
  // ========================================

  if (proveedor === "smtp") {
    const host = process.env.MAIL_HOST;
    const puerto = Number(
      process.env.MAIL_PORT || 587
    );

    if (
      !host ||
      !Number.isInteger(puerto) ||
      puerto < 1 ||
      puerto > 65535
    ) {
      throw new Error(
        "Configuración SMTP inválida"
      );
    }

    return {
      host,
      port: puerto,
      secure:
        process.env.MAIL_SECURE === "true" ||
        puerto === 465,
      auth: {
        user: usuario,
        pass: password,
      },
      requireTLS: puerto === 587,
    };
  }

  throw new Error(
    `Proveedor de correo no soportado: ${proveedor}`
  );
};

// ==========================================
// CREAR TRANSPORTE
// ==========================================

const crearTransportador = () => {
  return nodemailer.createTransport(
    obtenerConfiguracionCorreo()
  );
};

// ==========================================
// VERIFICAR CONEXIÓN SMTP
// ==========================================

const verificarConexionCorreo = async () => {
  const transportador = crearTransportador();

  await transportador.verify();

  return true;
};

// ==========================================
// ENVIAR CORREO GENERAL
// ==========================================

const enviarCorreo = async ({
  to,
  subject,
  text,
  html,
}) => {
  if (!to || !subject || !text) {
    throw new Error(
      "Destinatario, asunto y contenido son obligatorios"
    );
  }

  const transportador = crearTransportador();

  const remitente =
    process.env.MAIL_FROM ||
    process.env.MAIL_USER;

  return transportador.sendMail({
    from: remitente,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  });
};

// ==========================================
// RECUPERACIÓN DE CONTRASEÑA
// ==========================================

const enviarCorreoRecuperacion = async ({
  email,
  enlaceRecuperacion,
}) => {
  if (!email || !enlaceRecuperacion) {
    throw new Error(
      "Faltan datos para enviar la recuperación"
    );
  }

  const url = new URL(enlaceRecuperacion);

  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      url.hostname === "localhost"
    )
  ) {
    throw new Error(
      "La URL de recuperación debe utilizar HTTPS"
    );
  }

  const texto = `
Hola:

Recibimos una solicitud para restablecer la contraseña
de tu cuenta de Despensa Antidesperdicio.

Utiliza el siguiente enlace:

${enlaceRecuperacion}

Este enlace caduca en 30 minutos y solo puede
utilizarse una vez.

Si no solicitaste este cambio, ignora este correo.

Despensa Antidesperdicio
Syndmarq - Soluciones Digitales
  `.trim();

  return enviarCorreo({
    to: email,
    subject:
      "Recuperación de contraseña - Despensa Antidesperdicio",
    text: texto,
  });
};

// ==========================================
// UTILIDADES PARA CORREOS DE VENCIMIENTO
// ==========================================

const escaparHtml = (valor) => {
  return String(valor ?? "").replace(
    /[&<>"']/g,
    (caracter) => {
      const equivalencias = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };

      return equivalencias[caracter];
    }
  );
};

const normalizarEstado = (estado) => {
  const valor = String(estado || "")
    .trim()
    .toLowerCase();

  const estados = {
    expired: "Vencido",
    vencido: "Vencido",
    critical: "Crítico",
    critico: "Crítico",
    crítico: "Crítico",
    upcoming: "Próximo a vencer",
    proximo: "Próximo a vencer",
    attention: "Atención",
    atencion: "Atención",
    current: "Vigente",
    vigente: "Vigente",
    caducado: "Vencido",
  };

  return estados[valor] || "Atención";
};

const obtenerColorEstado = (estado) => {
  const colores = {
    Vencido: "#b91c1c",
    Crítico: "#dc2626",
    "Próximo a vencer": "#d97706",
    Atención: "#ca8a04",
    Vigente: "#15803d",
  };

  return colores[estado] || "#475569";
};

const formatearFechaProducto = (fecha) => {
  if (!fecha) {
    return "Sin fecha";
  }

  // Las fechas de caducidad son fechas civiles.
  // No se convierten a otra zona horaria.
  if (
    typeof fecha === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(fecha)
  ) {
    const [anio, mes, dia] = fecha.split("-");

    return `${dia}/${mes}/${anio}`;
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(valor);
};

// ==========================================
// ENVIAR NOTIFICACIÓN DE PRODUCTOS
// ==========================================

const enviarCorreoVencimientoProductos = async ({
  email,
  nombreUsuario,
  productos,
}) => {
  // ========================================
  // VALIDACIONES
  // ========================================

  if (
    typeof email !== "string" ||
    !email.trim()
  ) {
    throw new Error(
      "El correo del destinatario es obligatorio"
    );
  }

  if (
    !Array.isArray(productos) ||
    productos.length === 0
  ) {
    throw new Error(
      "Debe existir al menos un producto para notificar"
    );
  }

  // ========================================
  // NORMALIZAR PRODUCTOS
  // ========================================

  const productosNormalizados = productos.map(
    (producto) => {
      const nombre = String(
        producto.nombre ??
        producto.name ??
        "Producto sin nombre"
      );

      const fecha = formatearFechaProducto(
        producto.fechaCaducidad ??
        producto.expiration_date
      );

      const estado = normalizarEstado(
        producto.estado ??
        producto.status
        
      );

      return {
        nombre,
        fecha,
        estado,
        color: obtenerColorEstado(estado),
      };
    }
  );

  const nombre = String(
    nombreUsuario || "usuario"
  ).trim();

  // ========================================
  // ASUNTO
  // ========================================

  const cantidad = productosNormalizados.length;

  const asunto =
    `Aviso de vencimiento: ${cantidad} ` +
    (cantidad === 1
      ? "producto requiere"
      : "productos requieren") +
    " atención - Despensa Antidesperdicio";

  // ========================================
  // CONTENIDO EN TEXTO
  // ========================================

  const listadoTexto = productosNormalizados
    .map(
      (producto, indice) =>
        `${indice + 1}. ${producto.nombre}\n` +
        `   Estado: ${producto.estado}\n` +
        `   Caducidad: ${producto.fecha}`
    )
    .join("\n\n");

  const texto = `
Hola, ${nombre}:

Tu despensa tiene ${cantidad} ${
    cantidad === 1
      ? "producto que requiere"
      : "productos que requieren"
  } atención.

PRODUCTOS:

${listadoTexto}

Revisa estos alimentos en Despensa Antidesperdicio
para planificar su consumo y evitar desperdicios.

Este es un mensaje automático.

Despensa Antidesperdicio
Syndmarq - Soluciones Digitales
  `.trim();

  // ========================================
  // CONTENIDO HTML
  // ========================================

  
  // ========================================
  // TARJETAS ADAPTABLES DE PRODUCTOS
  // ========================================

  const tarjetasHtml = productosNormalizados
    .map(
      (producto) => `
        <div style="
          border:1px solid #e5e7eb;
          border-radius:12px;
          padding:16px;
          margin-bottom:12px;
          background:#ffffff;
        ">
          <div style="
            font-size:17px;
            font-weight:bold;
            color:#1f2937;
            margin-bottom:12px;
            overflow-wrap:anywhere;
          ">
            ${escaparHtml(producto.nombre)}
          </div>

          <div style="margin-bottom:12px;">
            <span style="
              display:inline-block;
              padding:6px 10px;
              border-radius:8px;
              background:#f3f4f6;
              color:${producto.color};
              font-size:13px;
              font-weight:bold;
            ">
              ${escaparHtml(producto.estado)}
            </span>
          </div>

          <div style="
            border-top:1px solid #e5e7eb;
            padding-top:12px;
            font-size:14px;
            line-height:1.6;
          ">
            <div style="
              color:#6b7280;
              margin-bottom:3px;
            ">
              Fecha de caducidad
            </div>

            <div style="
              font-size:16px;
              font-weight:bold;
              color:#1f2937;
            ">
              ${escaparHtml(producto.fecha)}
            </div>
          </div>
        </div>
      `
    )
    .join("");

  // ========================================
  // HTML DEL CORREO
  // ========================================

  const html = `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        >
        <title>Aviso de vencimiento</title>
      </head>

      <body style="
        margin:0;
        padding:0;
        background:#f3f6f4;
        font-family:Arial,Helvetica,sans-serif;
        color:#1f2937;
      ">
        <div style="
          width:100%;
          padding:16px 0;
          background:#f3f6f4;
        ">
          <div style="
            width:calc(100% - 24px);
            max-width:600px;
            margin:0 auto;
            background:#ffffff;
            border-radius:14px;
            overflow:hidden;
          ">

            <div style="
              background:#166534;
              padding:22px 18px;
              color:#ffffff;
            ">
              <h1 style="
                margin:0;
                font-size:22px;
                line-height:1.3;
              ">
                Despensa Antidesperdicio
              </h1>

              <p style="
                margin:8px 0 0;
                font-size:14px;
                color:#dcfce7;
              ">
                Aviso de vencimiento de alimentos
              </p>
            </div>

            <div style="padding:20px 16px;">

              <p style="
                font-size:16px;
                line-height:1.5;
                margin-top:0;
              ">
                Hola,
                <strong>
                  ${escaparHtml(nombre)}
                </strong>:
              </p>

              <p style="
                font-size:15px;
                line-height:1.6;
              ">
                Tienes
                <strong>${cantidad}</strong>
                ${
                  cantidad === 1
                    ? "producto que requiere"
                    : "productos que requieren"
                }
                tu atención.
              </p>

              <div style="margin-top:20px;">
                ${tarjetasHtml}
              </div>

              <p style="
                margin:22px 0 0;
                font-size:14px;
                line-height:1.7;
                color:#475569;
              ">
                Revisa estos alimentos en tu
                despensa para planificar su
                consumo y reducir el desperdicio.
              </p>

            </div>

            <div style="
              background:#f9fafb;
              padding:18px 16px;
              text-align:center;
              font-size:12px;
              line-height:1.6;
              color:#6b7280;
            ">
              Este es un mensaje automático.

              <div style="margin-top:8px;">
                Despensa Antidesperdicio
              </div>

              <div>
                Syndmarq - Soluciones Digitales
              </div>
            </div>

          </div>
        </div>
      </body>
    </html>
  `;

  // ========================================
  // ENVIAR MENSAJE
  // ========================================

  return enviarCorreo({
    to: email.trim(),
    subject: asunto,
    text: texto,
    html,
  });
};

// ==========================================
// EXPORTACIONES
// ==========================================

module.exports = {
  crearTransportador,
  verificarConexionCorreo,
  enviarCorreo,
  enviarCorreoRecuperacion,
  enviarCorreoVencimientoProductos,
};
