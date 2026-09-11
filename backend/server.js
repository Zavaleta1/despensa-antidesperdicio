const express = require("express");
const cors = require("cors");

const { poolPromise } = require("./config/database");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());


// ==========================================
// RUTA PRINCIPAL
// ==========================================

app.get("/", (req, res) => {
    res.json({
        message: "API Despensa Antidesperdicio funcionando"
    });
});


// ==========================================
// OBTENER PRODUCTOS
// ==========================================

app.get("/api/products", async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT
                id,
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
            FROM dbo.Products
            ORDER BY expiration_date ASC
        `);

        res.json(result.recordset);

    } catch (error) {
        console.error("❌ Error al obtener productos:", error);

        res.status(500).json({
            message: "Error al obtener productos",
            error: error.message
        });
    }
});


// ==========================================
// OBTENER CATEGORÍAS
// ==========================================

app.get("/api/categories", async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT
                id,
                name,
                icon
            FROM dbo.Categories
            ORDER BY name
        `);

        res.json(result.recordset);

    } catch (error) {
        console.error("❌ Error al obtener categorías:", error);

        res.status(500).json({
            message: "Error al obtener categorías",
            error: error.message
        });
    }
});


// ==========================================
// AGREGAR PRODUCTO
// ==========================================

app.post("/api/products", async (req, res) => {
    try {

        const {
            user_id,
            category_id,
            name,
            quantity,
            unit,
            expiration_date,
            location,
            notes,
            status
        } = req.body;


        // Validaciones básicas

        if (!user_id) {
            return res.status(400).json({
                message: "El usuario es obligatorio"
            });
        }

        if (!category_id) {
            return res.status(400).json({
                message: "La categoría es obligatoria"
            });
        }

        if (!name) {
            return res.status(400).json({
                message: "El nombre del producto es obligatorio"
            });
        }

        if (!quantity) {
            return res.status(400).json({
                message: "La cantidad es obligatoria"
            });
        }

        if (!unit) {
            return res.status(400).json({
                message: "La unidad es obligatoria"
            });
        }

        if (!expiration_date) {
            return res.status(400).json({
                message: "La fecha de caducidad es obligatoria"
            });
        }

        if (!location) {
            return res.status(400).json({
                message: "La ubicación es obligatoria"
            });
        }


        const pool = await poolPromise;

        const result = await pool
            .request()
            .input("user_id", user_id)
            .input("category_id", category_id)
            .input("name", name)
            .input("quantity", quantity)
            .input("unit", unit)
            .input("expiration_date", expiration_date)
            .input("location", location)
            .input("notes", notes || null)
            .input("status", status || "Disponible")
            .query(`
                INSERT INTO dbo.Products
                (
                    user_id,
                    category_id,
                    name,
                    quantity,
                    unit,
                    expiration_date,
                    location,
                    notes,
                    status
                )
                OUTPUT INSERTED.*
                VALUES
                (
                    @user_id,
                    @category_id,
                    @name,
                    @quantity,
                    @unit,
                    @expiration_date,
                    @location,
                    @notes,
                    @status
                )
            `);


        console.log("✅ Producto agregado:", result.recordset[0]);

        res.status(201).json({
            message: "Producto agregado correctamente",
            producto: result.recordset[0]
        });


    } catch (error) {

        console.error("❌ Error al agregar producto:", error);

        res.status(500).json({
            message: "Error al agregar producto",
            error: error.message
        });
    }
});


// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});