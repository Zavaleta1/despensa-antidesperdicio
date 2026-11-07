
require("dotenv").config();

const {
  verificarConexionCorreo,
  enviarCorreoVencimientoProductos,
} = require("../services/emailService");

// ==========================================
// PRUEBA DE DISEÑO DEL CORREO
// ==========================================

async function probarDisenoCorreo() {
  try {
    console.log(
      "\n📧 DESPENSA ANTIDESPERDICIO"
    );

    console.log(
      "================================"
    );

    console.log(
      "\n1. Verificando conexión SMTP..."
    );

    await verificarConexionCorreo();

    console.log(
      "✅ Conexión SMTP correcta"
    );

    // ======================================
    // DESTINATARIO
    // ======================================

    const email =
      process.env.TEST_EMAIL_RECIPIENT;

    if (!email) {
      throw new Error(
        "Configura TEST_EMAIL_RECIPIENT"
      );
    }

    // ======================================
    // PRODUCTOS FICTICIOS
    // ======================================

    const productos = [
      {
        nombre: "Leche entera",
        fechaCaducidad: "2026-11-09",
        estado: "critico",
      },
      {
        nombre: "Yogur natural",
        fechaCaducidad: "2026-11-12",
        estado: "proximo",
      },
      {
        nombre: "Pan integral",
        fechaCaducidad: "2026-11-05",
        estado: "caducado",
      },
      {
        nombre: "Queso fresco",
        fechaCaducidad: "2026-11-18",
        estado: "atencion",
      },
    ];

    // ======================================
    // CONFIRMAR ENVÍO
    // ======================================

    if (
      process.env.CONFIRM_SEND_TEST_EMAIL !==
      "YES"
    ) {
      console.log(
        "\n⚠️ Modo de verificación."
      );

      console.log(
        "No se enviaron correos."
      );

      console.log(
        "Establece CONFIRM_SEND_TEST_EMAIL=YES para enviarlo."
      );

      return;
    }

    // ======================================
    // ENVIAR CORREO
    // ======================================

    console.log(
      "\n2. Enviando correo de prueba..."
    );

    const resultado =
      await enviarCorreoVencimientoProductos({
        email,
        nombreUsuario: "Usuario de prueba",
        productos,
      });

    console.log(
      "\n✅ Correo aceptado por SMTP"
    );

    console.log(
      "ID del mensaje:",
      resultado.messageId
    );

    console.log(
      "\nRevisa tu bandeja de entrada."
    );
  } catch (error) {
    console.error(
      "\n❌ Error:",
      error.message
    );

    process.exitCode = 1;
  }
}

probarDisenoCorreo();
