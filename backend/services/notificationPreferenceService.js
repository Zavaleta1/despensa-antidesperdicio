const {
  pool,
} = require("../config/database");


// ==========================================
// NORMALIZAR PREFERENCIAS
// ==========================================

function normalizarPreferencias(
  preferencias
) {
  if (!preferencias) {
    return null;
  }

  return {
    id:
      preferencias.id,

    user_id:
      preferencias.user_id,

    in_app_enabled:
      Boolean(
        preferencias.in_app_enabled
      ),

    email_enabled:
      Boolean(
        preferencias.email_enabled
      ),

    notify_expired:
      Boolean(
        preferencias.notify_expired
      ),

    notify_critical:
      Boolean(
        preferencias.notify_critical
      ),

    notify_upcoming:
      Boolean(
        preferencias.notify_upcoming
      ),

    notify_attention:
      Boolean(
        preferencias.notify_attention
      ),

    notify_current:
      Boolean(
        preferencias.notify_current
      ),

    created_at:
      preferencias.created_at,

    updated_at:
      preferencias.updated_at,
  };
}


// ==========================================
// OBTENER PREFERENCIAS DEL USUARIO
// ==========================================

async function obtenerPreferenciasUsuario(
  userId
) {
  // ========================================
  // BUSCAR PREFERENCIAS EXISTENTES
  // ========================================

  const resultado =
    await pool.query(
      `
        SELECT
          id,
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

        FROM public."NotificationPreferences"

        WHERE user_id = $1
      `,
      [userId]
    );


  // ========================================
  // SI YA EXISTEN
  // ========================================

  if (
    resultado.rows.length > 0
  ) {
    return normalizarPreferencias(
      resultado.rows[0]
    );
  }


  // ========================================
  // CREAR CONFIGURACIÓN POR DEFECTO
  // ========================================

  const creado =
    await pool.query(
      `
        INSERT INTO
          public."NotificationPreferences"
        (
          user_id
        )

        VALUES
        (
          $1
        )

        RETURNING
          id,
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
      `,
      [userId]
    );


  return normalizarPreferencias(
    creado.rows[0]
  );
}


// ==========================================
// ACTUALIZAR PREFERENCIAS
// ==========================================

async function actualizarPreferenciasUsuario(
  userId,
  preferencias
) {
  // Garantizamos que exista el registro.
  await obtenerPreferenciasUsuario(
    userId
  );


  // ========================================
  // ACTUALIZAR
  // ========================================

  const resultado =
    await pool.query(
      `
        UPDATE
          public."NotificationPreferences"

        SET
          in_app_enabled = $1,
          email_enabled = $2,
          notify_expired = $3,
          notify_critical = $4,
          notify_upcoming = $5,
          notify_attention = $6,
          notify_current = $7,
          updated_at = NOW()

        WHERE
          user_id = $8

        RETURNING
          id,
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
      `,
      [
        Boolean(
          preferencias.in_app_enabled
        ),

        Boolean(
          preferencias.email_enabled
        ),

        Boolean(
          preferencias.notify_expired
        ),

        Boolean(
          preferencias.notify_critical
        ),

        Boolean(
          preferencias.notify_upcoming
        ),

        Boolean(
          preferencias.notify_attention
        ),

        Boolean(
          preferencias.notify_current
        ),

        userId,
      ]
    );


  return normalizarPreferencias(
    resultado.rows[0]
  );
}


// ==========================================
// EXPORTACIONES
// ==========================================

module.exports = {
  obtenerPreferenciasUsuario,
  actualizarPreferenciasUsuario,
};