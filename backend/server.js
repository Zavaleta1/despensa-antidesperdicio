require("dotenv").config();

const {
  agregarSemaforoAProductos,
} = require("./utils/expiration");

const express = require("express");
const cors = require("cors");

const { pool } = require("./config/database");

const authRoutes =
  require("./routes/auth");

const notificationRoutes =
  require("./routes/notifications");

const notificationPreferencesRoutes =
  require("./routes/notificationPreferences");

const authMiddleware =
  require("./middleware/authMiddleware");


const app = express();

const PORT =
  process.env.PORT || 3000;


// ==========================================
// MIDDLEWARES
// ==========================================

app.use(cors());

app.use(express.json());


// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================

app.use(
  "/api/auth",
  authRoutes
);


// ==========================================
// RUTAS DE NOTIFICACIONES
// ==========================================

app.use(
  "/api/notifications",
  notificationRoutes
);


// ==========================================
// RUTAS DE PREFERENCIAS
// ==========================================

app.use(
  "/api/notification-preferences",
  notificationPreferencesRoutes
);


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
        agregarSemaforoAProductos(
          result.rows
        );

      res.json(
        productosConSemaforo
      );

    } catch (error) {
      console.error(
        "❌ Error al obtener productos:",
        error
      );

      res.status(500).json({
        message:
          "Error al obtener productos",

        error: error.message,
      });
    }
  }
);


// ==========================================
// OBTENER CATEGORÍAS
// ==========================================

app.get(
  "/api/categories",
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `
            SELECT
              id,
              name,
              icon
            FROM public."Categories"
            ORDER BY name
          `
        );

      res.json(result.rows);

    } catch (error) {
      console.error(
        "❌ Error al obtener categorías:",
        error
      );

      res.status(500).json({
        message:
          "Error al obtener categorías",

        error: error.message,
      });
    }
  }
);


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
      } = req.body;

      const user_id =
        req.user.id;


      // ======================================
      // VALIDACIONES
      // ======================================

      if (!category_id) {
        return res.status(400).json({
          message:
            "La categoría es obligatoria",
        });
      }

      if (!name || !name.trim()) {
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
          message:
            "La cantidad es obligatoria",
        });
      }

      if (
        Number.isNaN(
          Number(quantity)
        ) ||
        Number(quantity) <= 0
      ) {
        return res.status(400).json({
          message:
            "La cantidad debe ser mayor que 0",
        });
      }

      if (!unit || !unit.trim()) {
        return res.status(400).json({
          message:
            "La unidad es obligatoria",
        });
      }

      if (!expiration_date) {
        return res.status(400).json({
          message:
            "La fecha de caducidad es obligatoria",
        });
      }

      if (
        !location ||
        !location.trim()
      ) {
        return res.status(400).json({
          message:
            "La ubicación es obligatoria",
        });
      }


      // ======================================
      // INSERTAR PRODUCTO
      // ======================================

      const result =
        await pool.query(
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
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              $8,
              $9,
              NOW(),
              NOW()
            )

            RETURNING *
          `,
          [
            user_id,
            category_id,
            name.trim(),
            Number(quantity),
            unit.trim(),
            expiration_date,
            location.trim(),
            notes
              ? notes.trim()
              : null,
            status || "Disponible",
          ]
        );

      const producto =
        result.rows[0];

      console.log(
        "✅ Producto agregado:",
        producto
      );

      res.status(201).json({
        message:
          "Producto agregado correctamente",

        producto,
      });

    } catch (error) {
      console.error(
        "❌ Error al agregar producto:",
        error
      );

      res.status(500).json({
        message:
          "Error al agregar producto",

        error: error.message,
      });
    }
  }
);


// ==========================================
// EDITAR PRODUCTO
// ==========================================

app.put(
  "/api/products/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const productId =
        Number(req.params.id);

      const userId =
        req.user.id;

      const {
        category_id,
        name,
        quantity,
        unit,
        expiration_date,
        location,
        notes,
        status,
      } = req.body;


      // ======================================
      // VALIDAR ID
      // ======================================

      if (
        !Number.isInteger(
          productId
        ) ||
        productId <= 0
      ) {
        return res.status(400).json({
          message:
            "ID de producto inválido",
        });
      }


      // ======================================
      // VALIDAR CAMPOS
      // ======================================

      if (
        !category_id ||
        !name ||
        quantity === undefined ||
        quantity === null ||
        !unit ||
        !expiration_date ||
        !location
      ) {
        return res.status(400).json({
          message:
            "Faltan campos obligatorios",
        });
      }

      if (
        Number.isNaN(
          Number(quantity)
        ) ||
        Number(quantity) <= 0
      ) {
        return res.status(400).json({
          message:
            "La cantidad debe ser mayor que 0",
        });
      }


      // ======================================
      // ACTUALIZAR PRODUCTO
      // ======================================

      const result =
        await pool.query(
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

            WHERE
              id = $9
              AND user_id = $10

            RETURNING *
          `,
          [
            category_id,
            name.trim(),
            Number(quantity),
            unit.trim(),
            expiration_date,
            location.trim(),
            notes
              ? notes.trim()
              : null,
            status || "Disponible",
            productId,
            userId,
          ]
        );


      // ======================================
      // PRODUCTO NO ENCONTRADO
      // ======================================

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          message:
            "Producto no encontrado",
        });
      }


      // ======================================
      // RESPUESTA
      // ======================================

      res.json({
        message:
          "Producto actualizado correctamente",

        producto:
          result.rows[0],
      });

    } catch (error) {
      console.error(
        "❌ Error al editar producto:",
        error
      );

      res.status(500).json({
        message:
          "Error al editar producto",

        error: error.message,
      });
    }
  }
);


// ==========================================
// ELIMINAR PRODUCTO
// ==========================================

app.delete(
  "/api/products/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const productId =
        Number(req.params.id);

      const userId =
        req.user.id;


      // ======================================
      // VALIDAR ID
      // ======================================

      if (
        !Number.isInteger(
          productId
        ) ||
        productId <= 0
      ) {
        return res.status(400).json({
          message:
            "ID de producto inválido",
        });
      }


      // ======================================
      // ELIMINAR PRODUCTO
      // ======================================

      const result =
        await pool.query(
          `
            DELETE FROM public."Products"

            WHERE
              id = $1
              AND user_id = $2

            RETURNING *
          `,
          [
            productId,
            userId,
          ]
        );


      // ======================================
      // PRODUCTO NO ENCONTRADO
      // ======================================

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          message:
            "Producto no encontrado",
        });
      }


      // ======================================
      // RESPUESTA
      // ======================================

      res.json({
        message:
          "Producto eliminado correctamente",

        producto:
          result.rows[0],
      });

    } catch (error) {
      console.error(
        "❌ Error al eliminar producto:",
        error
      );

      res.status(500).json({
        message:
          "Error al eliminar producto",

        error: error.message,
      });
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