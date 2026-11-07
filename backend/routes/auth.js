
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");

const { pool } = require("../config/database");

const {
  enviarCorreoRecuperacion,
} = require("../services/emailService");

const router = express.Router();

// ==========================================
// CONFIGURACIÓN DE RECUPERACIÓN
// ==========================================

const DURACION_TOKEN_MINUTOS = 30;
const INTERVALO_SOLICITUD_MS = 60 * 1000;

const solicitudesRecuperacion = new Map();

const RESPUESTA_RECUPERACION =
  "Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña.";

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

const normalizarEmail = (email) => {
  if (typeof email !== "string") {
    return null;
  }

  const limpio = email.trim().toLowerCase();

  if (
    limpio.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio)
  ) {
    return null;
  }

  return limpio;
};

const generarHashToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

const obtenerUrlFrontend = () => {
  const configurada = process.env.FRONTEND_URL;

  if (!configurada) {
    throw new Error(
      "FRONTEND_URL no está configurada"
    );
  }

  const url = new URL(configurada);

  const esLocal =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1";

  if (
    url.protocol !== "https:" &&
    !(esLocal && url.protocol === "http:")
  ) {
    throw new Error(
      "FRONTEND_URL debe utilizar HTTPS fuera de localhost"
    );
  }

  if (url.username || url.password) {
    throw new Error(
      "FRONTEND_URL contiene credenciales"
    );
  }

  return url;
};

// ==========================================
// REGISTRO DE USUARIO
// ==========================================

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    // ========================================
    // VALIDACIONES
    // ========================================

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message:
          "Nombre, correo y contraseña son obligatorios",
      });
    }

    const emailLimpio = normalizarEmail(email);

    if (!emailLimpio) {
      return res.status(400).json({
        message:
          "Introduce un correo electrónico válido",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message:
          "La contraseña debe tener al menos 8 caracteres",
      });
    }

    if (Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        message:
          "La contraseña no debe superar 72 bytes",
      });
    }

    const nombreLimpio = name.trim();

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

    const passwordHash = await bcrypt.hash(
      password,
      10
    );

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

    return res.status(201).json({
      message:
        "Usuario registrado correctamente",
      user,
    });
  } catch (error) {
    console.error(
      "❌ Error en registro:",
      error
    );

    return res.status(500).json({
      message: "Error al registrar usuario",
    });
  }
});

// ==========================================
// INICIO DE SESIÓN
// ==========================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    // ========================================
    // VALIDACIONES
    // ========================================

    if (
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message:
          "Correo y contraseña son obligatorios",
      });
    }

    const emailLimpio = normalizarEmail(email);

    if (!emailLimpio) {
      return res.status(400).json({
        message:
          "Correo o contraseña incorrectos",
      });
    }

    // ========================================
    // BUSCAR USUARIO Y VERSIÓN DE SESIÓN
    // ========================================

    const result = await pool.query(
      `
        SELECT
          id,
          name,
          email,
          password_hash,
          token_version
        FROM public."Users"
        WHERE email = $1
      `,
      [emailLimpio]
    );

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

    const passwordCorrect = await bcrypt.compare(
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
    // COMPROBAR CONFIGURACIÓN JWT
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

    // ========================================
    // CREAR JWT CON VERSIÓN DE SESIÓN
    // ========================================

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        tokenVersion: user.token_version,
      },
      process.env.JWT_SECRET,
      {
        algorithm: "HS256",
        expiresIn: "7d",
      }
    );

    // ========================================
    // RESPUESTA
    // ========================================

    return res.json({
      message: "Inicio de sesión exitoso",
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

    return res.status(500).json({
      message: "Error al iniciar sesión",
    });
  }
});

// ==========================================
// SOLICITAR RECUPERACIÓN DE CONTRASEÑA
// ==========================================

router.post("/forgot-password", async (req, res) => {
  try {
    const emailLimpio = normalizarEmail(
      req.body?.email
    );

    if (!emailLimpio) {
      return res.status(400).json({
        message:
          "Introduce un correo electrónico válido",
      });
    }

    // ========================================
    // LIMITAR SOLICITUDES REPETIDAS
    // ========================================

    const ahora = Date.now();

    const ultimaSolicitud =
      solicitudesRecuperacion.get(emailLimpio);

    if (
      ultimaSolicitud &&
      ahora - ultimaSolicitud <
        INTERVALO_SOLICITUD_MS
    ) {
      return res.json({
        message: RESPUESTA_RECUPERACION,
      });
    }

    solicitudesRecuperacion.set(
      emailLimpio,
      ahora
    );

    // Limpieza básica de entradas antiguas
    if (solicitudesRecuperacion.size > 1000) {
      for (const [correo, fecha] of solicitudesRecuperacion) {
        if (
          ahora - fecha >
          INTERVALO_SOLICITUD_MS
        ) {
          solicitudesRecuperacion.delete(correo);
        }
      }
    }

    // ========================================
    // BUSCAR USUARIO
    // ========================================

    const resultado = await pool.query(
      `
        SELECT id, email
        FROM public."Users"
        WHERE email = $1
      `,
      [emailLimpio]
    );

    // No revelar si el correo existe
    if (resultado.rows.length === 0) {
      return res.json({
        message: RESPUESTA_RECUPERACION,
      });
    }

    const usuario = resultado.rows[0];

    // ========================================
    // GENERAR TOKEN SEGURO
    // ========================================

    const token = crypto
      .randomBytes(32)
      .toString("hex");

    const tokenHash = generarHashToken(token);

    // ========================================
    // CONSTRUIR ENLACE
    // ========================================

    const urlRecuperacion =
      obtenerUrlFrontend();

    urlRecuperacion.pathname =
      "/reset-password";

    urlRecuperacion.search = "";
    urlRecuperacion.hash = "";

    urlRecuperacion.searchParams.set(
      "token",
      token
    );

    // ========================================
    // INVALIDAR SOLICITUDES ANTERIORES
    // ========================================

    await pool.query(
      `
        DELETE FROM public."PasswordResetTokens"
        WHERE user_id = $1
      `,
      [usuario.id]
    );

    // ========================================
    // GUARDAR HASH DEL TOKEN
    // ========================================

    await pool.query(
      `
        INSERT INTO public."PasswordResetTokens"
        (
          user_id,
          token_hash,
          expires_at,
          created_at
        )
        VALUES
        (
          $1,
          $2,
          NOW() + ($3 * INTERVAL '1 minute'),
          NOW()
        )
      `,
      [
        usuario.id,
        tokenHash,
        DURACION_TOKEN_MINUTOS,
      ]
    );

    // ========================================
    // ENVIAR CORREO
    // ========================================

    try {
      await enviarCorreoRecuperacion({
        email: usuario.email,
        enlaceRecuperacion:
          urlRecuperacion.toString(),
      });
    } catch (errorCorreo) {
      console.error(
        "❌ Error enviando recuperación:",
        errorCorreo.message
      );

      // No dejar un token activo si falló el envío
      await pool.query(
        `
          DELETE FROM public."PasswordResetTokens"
          WHERE token_hash = $1
        `,
        [tokenHash]
      );
    }

    // ========================================
    // RESPUESTA GENÉRICA
    // ========================================

    return res.json({
      message: RESPUESTA_RECUPERACION,
    });
  } catch (error) {
    console.error(
      "❌ Error en recuperación:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudo procesar la solicitud",
    });
  }
});

// ==========================================
// RESTABLECER CONTRASEÑA
// ==========================================

router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body || {};

  // ========================================
  // VALIDACIONES
  // ========================================

  if (
    typeof token !== "string" ||
    !/^[a-f0-9]{64}$/i.test(token)
  ) {
    return res.status(400).json({
      message:
        "El enlace de recuperación no es válido",
    });
  }

  if (
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({
      message:
        "La contraseña debe tener al menos 8 caracteres y no superar 72 bytes",
    });
  }

  const tokenHash = generarHashToken(token);

  let client;

  try {
    // ========================================
    // INICIAR TRANSACCIÓN
    // ========================================

    client = await pool.connect();

    await client.query("BEGIN");

    // ========================================
    // BUSCAR TOKEN Y BLOQUEAR FILA
    // ========================================

    const resultado = await client.query(
      `
        SELECT
          id,
          user_id,
          expires_at,
          used_at
        FROM public."PasswordResetTokens"
        WHERE token_hash = $1
        FOR UPDATE
      `,
      [tokenHash]
    );

    if (resultado.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message:
          "El enlace es inválido o ha caducado",
      });
    }

    const registro = resultado.rows[0];

    if (
      registro.used_at ||
      new Date(registro.expires_at).getTime() <=
        Date.now()
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message:
          "El enlace es inválido o ha caducado",
      });
    }

    // ========================================
    // CREAR HASH DE NUEVA CONTRASEÑA
    // ========================================

    const nuevoHash = await bcrypt.hash(
      password,
      10
    );

    // ========================================
    // ACTUALIZAR CONTRASEÑA
    // E INVALIDAR SESIONES ANTERIORES
    // ========================================

    const actualizacion = await client.query(
      `
        UPDATE public."Users"
        SET
          password_hash = $1,
          token_version = token_version + 1,
          updated_at = NOW()
        WHERE id = $2
        RETURNING id
      `,
      [
        nuevoHash,
        registro.user_id,
      ]
    );

    if (actualizacion.rows.length === 0) {
      throw new Error(
        "No se encontró el usuario del token"
      );
    }

    // ========================================
    // INVALIDAR TODOS LOS TOKENS
    // DE RECUPERACIÓN DEL USUARIO
    // ========================================

    await client.query(
      `
        DELETE FROM public."PasswordResetTokens"
        WHERE user_id = $1
      `,
      [registro.user_id]
    );

    // ========================================
    // CONFIRMAR CAMBIOS
    // ========================================

    await client.query("COMMIT");

    return res.json({
      message:
        "Contraseña actualizada correctamente. Ya puedes iniciar sesión.",
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "Error al revertir recuperación:",
          rollbackError
        );
      }
    }

    console.error(
      "❌ Error al restablecer contraseña:",
      error
    );

    return res.status(500).json({
      message:
        "No se pudo restablecer la contraseña",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// ==========================================
// EXPORTAR RUTAS
// ==========================================

module.exports = router;
