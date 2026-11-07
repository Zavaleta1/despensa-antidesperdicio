
const jwt = require("jsonwebtoken");
const { pool } = require("../config/database");

async function authMiddleware(req, res, next) {
  try {
    // ==========================================
    // VERIFICAR ENCABEZADO DE AUTORIZACIÓN
    // ==========================================

    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        message: "Token de autenticación requerido",
      });
    }

    const partes = authorization.split(" ");

    if (
      partes.length !== 2 ||
      partes[0] !== "Bearer" ||
      !partes[1]
    ) {
      return res.status(401).json({
        message: "Formato de token inválido",
      });
    }

    // ==========================================
    // VERIFICAR JWT
    // ==========================================

    const token = partes[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ["HS256"],
      }
    );

    // ==========================================
    // VALIDAR IDENTIDAD Y VERSIÓN
    // ==========================================

    if (
      !decoded ||
      !Number.isInteger(decoded.id) ||
      decoded.id <= 0 ||
      !Number.isInteger(decoded.tokenVersion) ||
      decoded.tokenVersion < 0
    ) {
      return res.status(401).json({
        message:
          "Sesión no válida. Inicia sesión nuevamente.",
      });
    }

    // ==========================================
    // CONSULTAR VERSIÓN ACTUAL
    // ==========================================

    const resultado = await pool.query(
      `
        SELECT token_version
        FROM public."Users"
        WHERE id = $1
      `,
      [decoded.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({
        message:
          "Usuario no encontrado. Inicia sesión nuevamente.",
      });
    }

    const versionActual =
      resultado.rows[0].token_version;

    // ==========================================
    // INVALIDAR JWT ANTIGUOS
    // ==========================================

    if (decoded.tokenVersion !== versionActual) {
      return res.status(401).json({
        message:
          "Tu sesión ya no es válida. Inicia sesión nuevamente.",
      });
    }

    // ==========================================
    // MANTENER COMPATIBILIDAD CON LAS RUTAS
    // ==========================================

    req.user = decoded;

    return next();
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        message: "Token inválido o expirado",
      });
    }

    console.error(
      "❌ Error en middleware de autenticación:",
      error
    );

    return res.status(503).json({
      message:
        "No se pudo verificar la sesión. Inténtalo nuevamente.",
    });
  }
}

module.exports = authMiddleware;
