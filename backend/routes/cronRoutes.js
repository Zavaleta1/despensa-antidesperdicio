
const express = require("express");

const router = express.Router();

const {
  ejecutarRevisionCorreos,
} = require("../services/expirationEmailService");

// ==========================================
// REVISIÓN DIARIA DE CORREOS
// ==========================================

router.get("/correos-diarios", async (req, res) => {
  try {
    const cronSecret = process.env.CRON_SECRET;

    // No permitir acceso si no existe
    // una clave configurada.
    if (!cronSecret) {
      console.error(
        "CRON_SECRET no está configurado"
      );

      return res.status(503).json({
        message: "Servicio no configurado",
      });
    }

    const authorization =
      req.headers.authorization;

    if (
      authorization !==
      `Bearer ${cronSecret}`
    ) {
      return res.status(401).json({
        message: "No autorizado",
      });
    }

    // Mantener desactivados los envíos
    // hasta completar la configuración.
    if (
      process.env.ENABLE_DAILY_EMAILS !== "YES"
    ) {
      return res.status(503).json({
        message: "Envíos diarios deshabilitados",
      });
    }

    const resumen =
      await ejecutarRevisionCorreos();

    return res.status(200).json({
      message: "Revisión diaria completada",
      resumen,
    });
  } catch (error) {
    console.error(
      "Error ejecutando cron de correos:",
      error
    );

    return res.status(500).json({
      message: "Error ejecutando revisión diaria",
    });
  }
});

module.exports = router;
