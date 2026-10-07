const express = require("express");

const authMiddleware =
  require("../middleware/authMiddleware");

const {
  obtenerNotificacionesUsuario,
  marcarNotificacionLeida,
  marcarTodasLeidas,
} = require("../services/notificationService");


const router = express.Router();


// ==========================================
// OBTENER NOTIFICACIONES
// ==========================================

router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const notificaciones =
        await obtenerNotificacionesUsuario(
          req.user.id
        );

      res.json(notificaciones);

    } catch (error) {
      console.error(
        "❌ Error al obtener notificaciones:",
        error
      );

      res.status(500).json({
        message:
          "Error al obtener notificaciones",

        error: error.message,
      });
    }
  }
);


// ==========================================
// MARCAR UNA COMO LEÍDA
// ==========================================

router.put(
  "/:id/read",
  authMiddleware,
  async (req, res) => {
    try {
      const notificationId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          notificationId
        ) ||
        notificationId <= 0
      ) {
        return res.status(400).json({
          message:
            "ID de notificación inválido",
        });
      }


      const notificacion =
        await marcarNotificacionLeida(
          req.user.id,
          notificationId
        );


      if (!notificacion) {
        return res.status(404).json({
          message:
            "Notificación no encontrada",
        });
      }


      res.json({
        message:
          "Notificación marcada como leída",

        notificacion,
      });

    } catch (error) {
      console.error(
        "❌ Error al actualizar notificación:",
        error
      );

      res.status(500).json({
        message:
          "Error al actualizar notificación",

        error: error.message,
      });
    }
  }
);


// ==========================================
// MARCAR TODAS COMO LEÍDAS
// ==========================================

router.put(
  "/read-all",
  authMiddleware,
  async (req, res) => {
    try {
      const actualizadas =
        await marcarTodasLeidas(
          req.user.id
        );


      res.json({
        message:
          "Notificaciones marcadas como leídas",

        actualizadas,
      });

    } catch (error) {
      console.error(
        "❌ Error al actualizar notificaciones:",
        error
      );

      res.status(500).json({
        message:
          "Error al actualizar notificaciones",

        error: error.message,
      });
    }
  }
);


module.exports = router;