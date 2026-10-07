const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { pool } = require("../config/database");

const router = express.Router();


// ==========================================
// REGISTRO DE USUARIO
// ==========================================

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ========================================
    // VALIDACIONES
    // ========================================

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Nombre, correo y contraseña son obligatorios",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "La contraseña debe tener al menos 6 caracteres",
      });
    }

    const nombreLimpio = name.trim();

    const emailLimpio =
      email.trim().toLowerCase();


    // ========================================
    // COMPROBAR SI EL CORREO YA EXISTE
    // ========================================

    const existingUser = await pool.query(
      `
        SELECT id
        FROM public."Users"
        WHERE email = $1
      `,
      [emailLimpio]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message:
          "El correo electrónico ya está registrado",
      });
    }


    // ========================================
    // CREAR HASH DE LA CONTRASEÑA
    // ========================================

    const passwordHash =
      await bcrypt.hash(password, 10);


    // ========================================
    // CREAR USUARIO
    // ========================================

    const result = await pool.query(
      `
        INSERT INTO public."Users"
        (
          name,
          email,
          password_hash,
          created_at,
          updated_at
        )
        VALUES
        (
          $1,
          $2,
          $3,
          NOW(),
          NOW()
        )
        RETURNING
          id,
          name,
          email,
          created_at
      `,
      [
        nombreLimpio,
        emailLimpio,
        passwordHash,
      ]
    );

    const user = result.rows[0];


    // ========================================
    // CREAR PREFERENCIAS POR DEFECTO
    // ========================================

    await pool.query(
      `
        INSERT INTO public."NotificationPreferences"
        (
          user_id,
          in_app_enabled,
          email_enabled,
          notify_expired,
          notify_critical,
          notify_upcoming,
          notify_attention,
          notify_current,
          created_at,
          updated_at
        )
        VALUES
        (
          $1,
          TRUE,
          TRUE,
          TRUE,
          TRUE,
          TRUE,
          TRUE,
          FALSE,
          NOW(),
          NOW()
        )
        ON CONFLICT (user_id)
        DO NOTHING
      `,
      [user.id]
    );


    // ========================================
    // RESPUESTA
    // ========================================

    res.status(201).json({
      message:
        "Usuario registrado correctamente",

      user,
    });

  } catch (error) {
    console.error(
      "❌ Error en registro:",
      error
    );

    res.status(500).json({
      message:
        "Error al registrar usuario",

      error: error.message,
    });
  }
});


// ==========================================
// INICIO DE SESIÓN
// ==========================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;


    // ========================================
    // VALIDACIONES
    // ========================================

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Correo y contraseña son obligatorios",
      });
    }

    const emailLimpio =
      email.trim().toLowerCase();


    // ========================================
    // BUSCAR USUARIO
    // ========================================

    const result = await pool.query(
      `
        SELECT
          id,
          name,
          email,
          password_hash
        FROM public."Users"
        WHERE email = $1
      `,
      [emailLimpio]
    );


    // ========================================
    // USUARIO NO ENCONTRADO
    // ========================================

    if (result.rows.length === 0) {
      return res.status(401).json({
        message:
          "Correo o contraseña incorrectos",
      });
    }

    const user = result.rows[0];


    // ========================================
    // COMPROBAR CONTRASEÑA
    // ========================================

    const passwordCorrect =
      await bcrypt.compare(
        password,
        user.password_hash
      );

    if (!passwordCorrect) {
      return res.status(401).json({
        message:
          "Correo o contraseña incorrectos",
      });
    }


    // ========================================
    // CREAR TOKEN JWT
    // ========================================

    if (!process.env.JWT_SECRET) {
      console.error(
        "❌ JWT_SECRET no está configurado"
      );

      return res.status(500).json({
        message:
          "Error de configuración del servidor",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );


    // ========================================
    // RESPUESTA
    // ========================================

    res.json({
      message:
        "Inicio de sesión exitoso",

      token,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error(
      "❌ Error en inicio de sesión:",
      error
    );

    res.status(500).json({
      message:
        "Error al iniciar sesión",

      error: error.message,
    });
  }
});


module.exports = router;