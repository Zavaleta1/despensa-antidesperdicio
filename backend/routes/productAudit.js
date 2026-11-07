
const express = require("express");

const { pool } = require("../config/database");

const authMiddleware = require(
  "../middleware/authMiddleware"
);

const router = express.Router();

// ==========================================
// PROTEGER LAS RUTAS
// ==========================================

router.use(authMiddleware);

// ==========================================
// OBTENER HISTORIAL DE AUDITORÍA
// GET /api/products/audit/history
// ==========================================

router.get("/history", async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          id,
          product_id,
          product_name,
          action_type,
          previous_data,
          new_data,
          created_at
        FROM public."ProductAuditLog"
        WHERE user_id = $1
        ORDER BY created_at DESC, id DESC
      `,
      [req.user.id]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error(
      "Error al obtener historial de auditoría:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudo obtener el historial de auditoría",
    });
  }
});

module.exports = router;
