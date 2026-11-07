
const express = require("express");

const { pool } = require("../config/database");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

// ==========================================
// POST /api/products/:id/movements
// REGISTRAR CONSUMO O DESPERDICIO
// ==========================================

router.post("/:id/movements", async (req, res) => {
  const productId = Number(req.params.id);
  const { movement_type, quantity } = req.body || {};

  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return res.status(400).json({
      message: "ID de producto inválido",
    });
  }

  if (!["consumed", "wasted"].includes(movement_type)) {
    return res.status(400).json({
      message: "El movimiento debe ser consumed o wasted",
    });
  }

  if (
    quantity === null ||
    quantity === undefined ||
    quantity === "" ||
    typeof quantity === "boolean" ||
    !Number.isFinite(Number(quantity)) ||
    Number(quantity) <= 0
  ) {
    return res.status(400).json({
      message: "La cantidad debe ser mayor que cero",
    });
  }

  const cantidad = Number(quantity);
  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // Bloquear el producto para evitar descuentos simultáneos.
    const result = await client.query(
      `
        SELECT id, user_id, name, quantity, unit
        FROM public."Products"
        WHERE id = $1 AND user_id = $2
        FOR UPDATE
      `,
      [productId, req.user.id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Producto no encontrado",
      });
    }

    const producto = result.rows[0];

    if (Number(producto.quantity) < cantidad) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "No hay suficiente cantidad disponible",
      });
    }

    const actualizacion = await client.query(
      `
        UPDATE public."Products"
        SET quantity = quantity - $1,
            updated_at = NOW()
        WHERE id = $2 AND user_id = $3
        RETURNING *
      `,
      [cantidad, productId, req.user.id]
    );

    const movimiento = await client.query(
      `
        INSERT INTO public."ProductMovements"
          (
            product_id,
            user_id,
            movement_type,
            quantity,
            unit,
            product_name
          )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [
        productId,
        req.user.id,
        movement_type,
        cantidad,
        producto.unit,
        producto.name,
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Movimiento registrado correctamente",
      producto: actualizacion.rows[0],
      movimiento: movimiento.rows[0],
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Error al revertir:", rollbackError);
      }
    }

    console.error("Error al registrar movimiento:", error);

    return res.status(500).json({
      message: "No se pudo registrar el movimiento",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// ==========================================
// GET /api/products/movements/history
// OBTENER HISTORIAL COMPLETO DEL USUARIO
// ==========================================

router.get("/movements/history", async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT *
        FROM public."ProductMovements"
        WHERE user_id = $1
        ORDER BY created_at DESC, id DESC
      `,
      [req.user.id]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Error al consultar movimientos:", error);

    return res.status(500).json({
      message: "No se pudo obtener el historial",
    });
  }
});

module.exports = router;
