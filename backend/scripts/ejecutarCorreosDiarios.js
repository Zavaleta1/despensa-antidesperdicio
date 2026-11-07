
require("dotenv").config();

const { pool } = require("../config/database");

const {
  ejecutarRevisionCorreos,
} = require("../services/expirationEmailService");

// ==========================================
// EJECUCIÓN DIARIA DE CORREOS
// ==========================================

async function ejecutarCorreosDiarios() {
  console.log(
    "\n📧 DESPENSA ANTIDESPERDICIO"
  );

  console.log(
    "================================"
  );

  console.log(
    "Iniciando revisión diaria..."
  );

  console.log(
    "Fecha:",
    new Date().toLocaleString("es-MX")
  );

  // Evitar envíos accidentales durante
  // las pruebas de configuración.
  if (
    process.env.ENABLE_DAILY_EMAILS !== "YES"
  ) {
    console.log(
      "\n🔒 Envío diario deshabilitado."
    );

    console.log(
      "Configura ENABLE_DAILY_EMAILS=YES " +
      "para activar los envíos."
    );

    return;
  }

  const resumen = await ejecutarRevisionCorreos();

  console.log(
    "\n================================"
  );

  console.log(
    "RESULTADO DE LA REVISIÓN"
  );

  console.log(
    "================================"
  );

  console.log(
    "Usuarios revisados:",
    resumen.usuarios
  );

  console.log(
    "Correos enviados:",
    resumen.enviados
  );

  console.log(
    "Productos notificados:",
    resumen.productosNotificados
  );

  console.log(
    "Errores:",
    resumen.errores
  );

  if (resumen.errores > 0) {
    process.exitCode = 1;
  }
}

// ==========================================
// INICIAR Y CERRAR CONEXIONES
// ==========================================

async function main() {
  try {
    await ejecutarCorreosDiarios();
  } catch (error) {
    console.error(
      "\n❌ Error en la revisión diaria:",
      error
    );

    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
