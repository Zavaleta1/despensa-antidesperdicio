
require("dotenv").config();

const { pool } = require("../config/database");

const {
  verificarConexionCorreo,
} = require("../services/emailService");

const {
  procesarCorreosUsuario,
} = require("../services/expirationEmailService");

// ==========================================
// PRUEBA DE NOTIFICACIONES POR CORREO
// ==========================================

async function probarCorreosVencimiento() {
  try {
    console.log(
      "\n📧 DESPENSA ANTIDESPERDICIO"
    );

    console.log(
      "================================"
    );

    // ======================================
    // 1. VERIFICAR CONEXIÓN SMTP
    // ======================================

    console.log(
      "\n1. Verificando conexión de correo..."
    );

    await verificarConexionCorreo();

    console.log(
      "✅ Conexión SMTP correcta"
    );

    // ======================================
    // 2. IDENTIFICAR USUARIO DE PRUEBA
    // ======================================

    const userId = Number(
      process.env.TEST_NOTIFICATION_USER_ID
    );

    if (
      !Number.isSafeInteger(userId) ||
      userId <= 0
    ) {
      throw new Error(
        "Configura TEST_NOTIFICATION_USER_ID con el ID de tu usuario de prueba"
      );
    }

    const resultadoUsuario = await pool.query(
      `
        SELECT
          u.id,
          u.name,
          u.email
        FROM public."Users" AS u
        WHERE u.id = $1
      `,
      [userId]
    );

    if (resultadoUsuario.rows.length === 0) {
      throw new Error(
        "No se encontró el usuario de prueba"
      );
    }

    const usuario = resultadoUsuario.rows[0];

    console.log(
      "\n2. Usuario de prueba encontrado"
    );

    console.log(
      `ID: ${usuario.id}`
    );

    // ======================================
    // 3. COMPROBAR PREFERENCIAS
    // ======================================

    const resultadoPreferencias =
      await pool.query(
        `
          SELECT
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

    const preferencias =
      resultadoPreferencias.rows[0];

    if (!preferencias?.email_enabled) {
      throw new Error(
        "El usuario no tiene activadas las notificaciones por correo"
      );
    }

    console.log(
      "\n3. Notificaciones por correo activadas"
    );

    // ======================================
    // 4. CONFIRMACIÓN EXPLÍCITA
    // ======================================

    if (
      process.env.CONFIRM_SEND_TEST_EMAIL !==
      "YES"
    ) {
      console.log(
        "\n⚠️ No se enviaron correos."
      );

      console.log(
        "Para ejecutar la prueba real, establece CONFIRM_SEND_TEST_EMAIL=YES."
      );

      return;
    }

    // ======================================
    // 5. PROCESAR NOTIFICACIONES
    // ======================================

    console.log(
      "\n4. Procesando avisos pendientes..."
    );

    const resumen =
      await procesarCorreosUsuario(usuario);

    console.log(
      "\n================================"
    );

    console.log(
      "RESULTADO DE LA PRUEBA"
    );

    console.log(
      "================================"
    );

    console.log(
      `📨 Correos enviados: ${resumen.enviados}`
    );

    console.log(
      `❌ Errores: ${resumen.errores}`
    );

    if (resumen.enviados === 0) {
      console.log(
        "\nNo se encontraron avisos pendientes elegibles."
      );
    } else {
      console.log(
        "\n✅ Proceso de envío ejecutado."
      );
    }
  } catch (error) {
    console.error(
      "\n❌ Error en la prueba:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

probarCorreosVencimiento();
