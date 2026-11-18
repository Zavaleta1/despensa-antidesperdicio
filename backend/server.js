
require("dotenv").config();

const {
  agregarSemaforoAProductos,
} = require("./utils/expiration");

const express = require("express");
const cors = require("cors");

const { pool } = require("./config/database");

const authRoutes = require("./routes/auth");
const productAuditRoutes = require("./routes/productAudit");
const notificationRoutes = require("./routes/notifications");
const cronRoutes = require("./routes/cronRoutes");

const notificationPreferencesRoutes = require(
  "./routes/notificationPreferences"
);

const authMiddleware = require(
  "./middleware/authMiddleware"
);

const profileRoutes = require(
  "./routes/profileRoutes"
);

const productMovementsRoutes = require(
  "./routes/productMovements"
);

const app = express();

const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARES
// ==========================================

app.use(cors());

app.use(express.json());

// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================

app.use("/api/auth", authRoutes);

// ==========================================
// RUTAS DE NOTIFICACIONES
// ==========================================

app.use("/api/notifications", notificationRoutes);

// ==========================================
// CRON JOBS - CORREOS AUTOMÁTICOS
// ==========================================

app.use("/api/cron", cronRoutes);

// ==========================================
// RUTAS DE PREFERENCIAS
// ==========================================

app.use(
  "/api/notification-preferences",
  notificationPreferencesRoutes
);

// ==========================================
// RUTAS DE PERFIL
// ==========================================

app.use("/api/profile", profileRoutes);

// ==========================================
// RUTAS DE CONSUMO Y DESPERDICIO
// ==========================================

app.use(
  "/api/products",
  productMovementsRoutes
);
// ==========================================
// HISTORIAL DE AUDITORÍA
// ==========================================

app.use("/api/products/audit", productAuditRoutes);

// ==========================================
// RUTA PRINCIPAL
// ==========================================

app.get("/", (req, res) => {
  res.json({
    message:
      "API Despensa Antidesperdicio funcionando",
  });
});

// ==========================================
// OBTENER PRODUCTOS
// ==========================================

app.get(
  "/api/products",
  authMiddleware,
  async (req, res) => {
    try {
      const result = await pool.query(
        `
          SELECT
            p.id,
            p.user_id,
            p.category_id,
            p.name,
            p.quantity,
            p.unit,
            p.expiration_date,
            p.location,
            p.notes,
            p.status,
            p.created_at,
            p.updated_at,
            c.name AS category_name,
            c.icon AS category_icon
          FROM public."Products" AS p
          LEFT JOIN public."Categories" AS c
            ON p.category_id = c.id
          WHERE p.user_id = $1
          ORDER BY p.expiration_date ASC
        `,
        [req.user.id]
      );

      const productosConSemaforo =
        agregarSemaforoAProductos(result.rows);

      return res.json(productosConSemaforo);
    } catch (error) {
      console.error(
        "❌ Error al obtener productos:",
        error
      );

      return res.status(500).json({
        message: "Error al obtener productos",
        error: error.message,
      });
    }
  }
);

// ==========================================
// OBTENER CATEGORÍAS
// ==========================================

app.get("/api/categories", async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          id,
          name,
          icon
        FROM public."Categories"
        ORDER BY name
      `
    );

    return res.json(result.rows);
  } catch (error) {
    console.error(
      "❌ Error al obtener categorías:",
      error
    );

    return res.status(500).json({
      message: "Error al obtener categorías",
      error: error.message,
    });
  }
});

// ==========================================
// AGREGAR PRODUCTO
// ==========================================

app.post(
  "/api/products",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        category_id,
        name,
        quantity,
        unit,
        expiration_date,
        location,
        notes,
        status,
      } = req.body || {};

      const user_id = req.user.id;

      // ======================================
      // VALIDACIONES
      // ======================================

      if (!category_id) {
        return res.status(400).json({
          message: "La categoría es obligatoria",
        });
      }

      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          message:
            "El nombre del producto es obligatorio",
        });
      }

      if (
        quantity === undefined ||
        quantity === null ||
        quantity === ""
      ) {
        return res.status(400).json({
          message: "La cantidad es obligatoria",
        });
      }

      const cantidad = Number(quantity);

      if (
        typeof quantity === "boolean" ||
        !Number.isFinite(cantidad) ||
        cantidad <= 0
      ) {
        return res.status(400).json({
          message:
            "La cantidad debe ser mayor que 0",
        });
      }

      if (
        typeof unit !== "string" ||
        !unit.trim()
      ) {
        return res.status(400).json({
          message: "La unidad es obligatoria",
        });
      }

      if (!expiration_date) {
        return res.status(400).json({
          message:
            "La fecha de caducidad es obligatoria",
        });
      }

      if (
        typeof location !== "string" ||
        !location.trim()
      ) {
        return res.status(400).json({
          message: "La ubicación es obligatoria",
        });
      }

      // ======================================
      // INSERTAR PRODUCTO
      // ======================================

      const result = await pool.query(
        `
          INSERT INTO public."Products"
          (
            user_id,
            category_id,
            name,
            quantity,
            unit,
            expiration_date,
            location,
            notes,
            status,
            created_at,
            updated_at
          )
          VALUES
          (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9,
            NOW(), NOW()
          )
          RETURNING *
        `,
        [
          user_id,
          category_id,
          name.trim(),
          cantidad,
          unit.trim(),
          expiration_date,
          location.trim(),
          typeof notes === "string" && notes.trim()
            ? notes.trim()
            : null,
          status || "Disponible",
        ]
      );

      const producto = result.rows[0];

      console.log(
        "✅ Producto agregado:",
        producto
      );

      return res.status(201).json({
        message:
          "Producto agregado correctamente",
        producto,
      });
    } catch (error) {
      console.error(
        "❌ Error al agregar producto:",
        error
      );

      return res.status(500).json({
        message: "Error al agregar producto",
        error: error.message,
      });
    }
  }
);

// ==========================================
// EDITAR PRODUCTO
// REGISTRAR EDICIÓN EN AUDITORÍA
// ==========================================

app.put(
  "/api/products/:id",
  authMiddleware,
  async (req, res) => {
    const productId = Number(req.params.id);
    const userId = req.user.id;

    const {
      category_id,
      name,
      quantity,
      unit,
      expiration_date,
      location,
      notes,
      status,
    } = req.body || {};

    // ======================================
    // VALIDAR ID
    // ======================================

    if (
      !Number.isSafeInteger(productId) ||
      productId <= 0
    ) {
      return res.status(400).json({
        message: "ID de producto inválido",
      });
    }

    // ======================================
    // VALIDAR CAMPOS
    // ======================================

    if (
      !category_id ||
      typeof name !== "string" ||
      !name.trim() ||
      quantity === undefined ||
      quantity === null ||
      quantity === "" ||
      typeof unit !== "string" ||
      !unit.trim() ||
      !expiration_date ||
      typeof location !== "string" ||
      !location.trim()
    ) {
      return res.status(400).json({
        message: "Faltan campos obligatorios",
      });
    }

    const cantidad = Number(quantity);

    if (
      typeof quantity === "boolean" ||
      !Number.isFinite(cantidad) ||
      cantidad <= 0
    ) {
      return res.status(400).json({
        message:
          "La cantidad debe ser mayor que 0",
      });
    }

    let client;

    try {
      // ======================================
      // INICIAR TRANSACCIÓN
      // ======================================

      client = await pool.connect();

      await client.query("BEGIN");

      // ======================================
      // OBTENER DATOS ANTERIORES
      // ======================================

      const consultaAnterior =
        await client.query(
          `
            SELECT *
            FROM public."Products"
            WHERE id = $1
              AND user_id = $2
            FOR UPDATE
          `,
          [productId, userId]
        );

      if (
        consultaAnterior.rows.length === 0
      ) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message: "Producto no encontrado",
        });
      }

      const productoAnterior =
        consultaAnterior.rows[0];

      // ======================================
      // ACTUALIZAR PRODUCTO
      // ======================================

      const resultado = await client.query(
        `
          UPDATE public."Products"
          SET
            category_id = $1,
            name = $2,
            quantity = $3,
            unit = $4,
            expiration_date = $5,
            location = $6,
            notes = $7,
            status = $8,
            updated_at = NOW()
          WHERE id = $9
            AND user_id = $10
          RETURNING *
        `,
        [
          category_id,
          name.trim(),
          cantidad,
          unit.trim(),
          expiration_date,
          location.trim(),
          typeof notes === "string" && notes.trim()
            ? notes.trim()
            : null,
          status || "Disponible",
          productId,
          userId,
        ]
      );

      const productoActualizado =
        resultado.rows[0];

      // ======================================
      // REGISTRAR AUDITORÍA DE EDICIÓN
      // ======================================

      await client.query(
        `
          INSERT INTO public."ProductAuditLog"
          (
            user_id,
            product_id,
            product_name,
            action_type,
            previous_data,
            new_data
          )
          VALUES
          (
            $1,
            $2,
            $3,
            'updated',
            $4::jsonb,
            $5::jsonb
          )
        `,
        [
          userId,
          productId,
          productoActualizado.name,
          JSON.stringify(productoAnterior),
          JSON.stringify(productoActualizado),
        ]
      );

      // ======================================
      // CONFIRMAR TRANSACCIÓN
      // ======================================

      await client.query("COMMIT");

      return res.json({
        message:
          "Producto actualizado correctamente",
        producto: productoActualizado,
      });
    } catch (error) {
      if (client) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackError) {
          console.error(
            "Error al revertir edición:",
            rollbackError
          );
        }
      }

      console.error(
        "❌ Error al editar producto:",
        error
      );

      return res.status(500).json({
        message: "Error al editar producto",
      });
    } finally {
      if (client) {
        client.release();
      }
    }
  }
);

// ==========================================
// ELIMINAR PRODUCTO
// REGISTRAR ELIMINACIÓN EN AUDITORÍA
// ==========================================

app.delete(
  "/api/products/:id",
  authMiddleware,
  async (req, res) => {
    const productId = Number(req.params.id);
    const userId = req.user.id;

    // ======================================
    // VALIDAR ID
    // ======================================

    if (
      !Number.isSafeInteger(productId) ||
      productId <= 0
    ) {
      return res.status(400).json({
        message: "ID de producto inválido",
      });
    }

    let client;

    try {
      // ======================================
      // INICIAR TRANSACCIÓN
      // ======================================

      client = await pool.connect();

      await client.query("BEGIN");

      // ======================================
      // OBTENER PRODUCTO ANTERIOR
      // ======================================

      const consultaAnterior =
        await client.query(
          `
            SELECT *
            FROM public."Products"
            WHERE id = $1
              AND user_id = $2
            FOR UPDATE
          `,
          [productId, userId]
        );

      if (
        consultaAnterior.rows.length === 0
      ) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message: "Producto no encontrado",
        });
      }

      const productoAnterior =
        consultaAnterior.rows[0];

      // ======================================
      // ELIMINAR PRODUCTO
      // ======================================

      const resultado = await client.query(
        `
          DELETE FROM public."Products"
          WHERE id = $1
            AND user_id = $2
          RETURNING *
        `,
        [productId, userId]
      );

      const productoEliminado =
        resultado.rows[0];

      // ======================================
      // REGISTRAR AUDITORÍA DE ELIMINACIÓN
      // ======================================

      await client.query(
        `
          INSERT INTO public."ProductAuditLog"
          (
            user_id,
            product_id,
            product_name,
            action_type,
            previous_data,
            new_data
          )
          VALUES
          (
            $1,
            $2,
            $3,
            'deleted',
            $4::jsonb,
            NULL
          )
        `,
        [
          userId,
          productId,
          productoAnterior.name,
          JSON.stringify(productoAnterior),
        ]
      );

      // ======================================
      // CONFIRMAR TRANSACCIÓN
      // ======================================

      await client.query("COMMIT");

      return res.json({
        message:
          "Producto eliminado correctamente",
        producto: productoEliminado,
      });
    } catch (error) {
      if (client) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackError) {
          console.error(
            "Error al revertir eliminación:",
            rollbackError
          );
        }
      }

      console.error(
        "❌ Error al eliminar producto:",
        error
      );

      return res.status(500).json({
        message: "Error al eliminar producto",
      });
    } finally {
      if (client) {
        client.release();
      }
    }
  }
);

// ==========================================
// INICIAR SERVIDOR LOCAL
// ==========================================

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(
      `Servidor ejecutándose en http://localhost:${PORT}`
    );
  });
}

// ==========================================
// EXPORTAR APP PARA VERCEL
// ==========================================

module.exports = app;
