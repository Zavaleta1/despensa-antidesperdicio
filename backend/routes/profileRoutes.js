const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const crypto = require("node:crypto");

const { pool } = require("../config/database");
const authMiddleware = require("../middleware/authMiddleware");
const {
  obtenerSupabaseStorage,
} = require("../config/supabaseStorage");

const router = express.Router();

const BUCKET = "profile-images";
const TAMANO_MAXIMO = 2 * 1024 * 1024;

// Todas las rutas requieren autenticación.
router.use(authMiddleware);

// ==========================================
// CONFIGURACIÓN PARA FOTOGRAFÍAS
// ==========================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: TAMANO_MAXIMO,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    const tiposPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!tiposPermitidos.includes(file.mimetype)) {
      return callback(
        new Error(
          "Solo se permiten imágenes JPG, PNG o WEBP"
        )
      );
    }

    callback(null, true);
  },
});

function validarArchivoImagen(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    return null;
  }

  const esJpeg =
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  const esPng =
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([
        0x89, 0x50, 0x4e, 0x47,
        0x0d, 0x0a, 0x1a, 0x0a,
      ])
    );

  const esWebp =
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP";

  if (esJpeg) {
    return {
      extension: "jpg",
      contentType: "image/jpeg",
    };
  }

  if (esPng) {
    return {
      extension: "png",
      contentType: "image/png",
    };
  }

  if (esWebp) {
    return {
      extension: "webp",
      contentType: "image/webp",
    };
  }

  return null;
}

function procesarFoto(req, res, next) {
  upload.single("photo")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (
      error instanceof multer.MulterError &&
      error.code === "LIMIT_FILE_SIZE"
    ) {
      return res.status(413).json({
        message: "La imagen no debe superar los 2 MB",
      });
    }

    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        message: "No se pudo procesar la imagen",
      });
    }

    return res.status(400).json({
      message: error.message || "Imagen no válida",
    });
  });
}

// ==========================================
// OBTENER PERFIL
// GET /api/profile
// ==========================================

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          id,
          name,
          email,
          created_at
        FROM public."Users"
        WHERE id = $1
      `,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    res.json({
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error al obtener perfil:", error);

    res.status(500).json({
      message: "No se pudo obtener el perfil",
    });
  }
});

// ==========================================
// ACTUALIZAR NOMBRE
// PUT /api/profile
// ==========================================

router.put("/", async (req, res) => {
  try {
    const { name } = req.body;

    if (typeof name !== "string") {
      return res.status(400).json({
        message: "El nombre es obligatorio",
      });
    }

    const nombreLimpio = name.trim();

    if (
      nombreLimpio.length < 2 ||
      nombreLimpio.length > 100
    ) {
      return res.status(400).json({
        message:
          "El nombre debe tener entre 2 y 100 caracteres",
      });
    }

    const result = await pool.query(
      `
        UPDATE public."Users"
        SET
          name = $1,
          updated_at = NOW()
        WHERE id = $2
        RETURNING
          id,
          name,
          email,
          created_at
      `,
      [nombreLimpio, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    res.json({
      message: "Nombre actualizado correctamente",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);

    res.status(500).json({
      message: "No se pudo actualizar el perfil",
    });
  }
});

// ==========================================
// CAMBIAR CONTRASEÑA
// PUT /api/profile/password
// ==========================================

router.put("/password", async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        message:
          "La contraseña actual y la nueva son obligatorias",
      });
    }

    if (
      newPassword.length < 12 ||
      newPassword.length > 72
    ) {
      return res.status(400).json({
        message:
          "La nueva contraseña debe tener entre 12 y 72 caracteres",
      });
    }

    const result = await pool.query(
      `
        SELECT password_hash
        FROM public."Users"
        WHERE id = $1
      `,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    const passwordCorrecta = await bcrypt.compare(
      currentPassword,
      result.rows[0].password_hash
    );

    if (!passwordCorrecta) {
      return res.status(400).json({
        message: "La contraseña actual es incorrecta",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message:
          "La nueva contraseña debe ser diferente",
      });
    }

    const nuevoHash = await bcrypt.hash(
      newPassword,
      12
    );

    const actualizacion = await pool.query(
      `
        UPDATE public."Users"
        SET
          password_hash = $1,
          updated_at = NOW()
        WHERE id = $2
          AND password_hash = $3
        RETURNING id
      `,
      [
        nuevoHash,
        req.user.id,
        result.rows[0].password_hash,
      ]
    );

    if (actualizacion.rows.length === 0) {
      return res.status(409).json({
        message:
          "La contraseña cambió durante la operación. Inténtalo nuevamente.",
      });
    }

    res.json({
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);

    res.status(500).json({
      message: "No se pudo cambiar la contraseña",
    });
  }
});

// ==========================================
// OBTENER FOTOGRAFÍA DE PERFIL
// GET /api/profile/photo
// ==========================================

router.get("/photo", async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT profile_image_path
        FROM public."Users"
        WHERE id = $1
      `,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    const rutaImagen =
      result.rows[0].profile_image_path;

    if (!rutaImagen) {
      return res.json({
        photoUrl: null,
      });
    }

    const supabase = obtenerSupabaseStorage();

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(rutaImagen, 300);

    if (error) {
      console.error(
        "Error al generar URL de fotografía:",
        error
      );

      return res.status(500).json({
        message: "No se pudo obtener la fotografía",
      });
    }

    res.json({
      photoUrl: data.signedUrl,
    });
  } catch (error) {
    console.error(
      "Error al consultar fotografía:",
      error
    );

    res.status(500).json({
      message: "No se pudo obtener la fotografía",
    });
  }
});

// ==========================================
// SUBIR O CAMBIAR FOTOGRAFÍA
// POST /api/profile/photo
// Campo multipart/form-data: photo
// ==========================================

router.post("/photo", procesarFoto, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "Debes seleccionar una imagen",
    });
  }

  const tipoDetectado = validarArchivoImagen(
    req.file.buffer
  );

  if (
    !tipoDetectado ||
    tipoDetectado.contentType !== req.file.mimetype
  ) {
    return res.status(400).json({
      message:
        "El archivo no corresponde a una imagen JPG, PNG o WEBP válida",
    });
  }

  let cliente = null;
  let transaccionAbierta = false;
  let nuevaRuta = null;
  let subidaCompletada = false;
  let cambioConfirmado = false;
  let supabase = null;

  try {
    supabase = obtenerSupabaseStorage();
    cliente = await pool.connect();

    await cliente.query("BEGIN");
    transaccionAbierta = true;

    // Evitar que dos cambios simultáneos
    // modifiquen la fotografía incorrectamente.
    const usuario = await cliente.query(
      `
        SELECT profile_image_path
        FROM public."Users"
        WHERE id = $1
        FOR UPDATE
      `,
      [req.user.id]
    );

    if (usuario.rows.length === 0) {
      await cliente.query("ROLLBACK");
      transaccionAbierta = false;

      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    const rutaAnterior =
      usuario.rows[0].profile_image_path;

    nuevaRuta =
      `${req.user.id}/` +
      `${crypto.randomUUID()}.` +
      tipoDetectado.extension;

    // Guardar la nueva imagen.
    const { error: errorSubida } =
      await supabase.storage
        .from(BUCKET)
        .upload(nuevaRuta, req.file.buffer, {
          contentType: tipoDetectado.contentType,
          upsert: false,
        });

    if (errorSubida) {
      throw errorSubida;
    }

    subidaCompletada = true;

    // Sustituir la ruta de la imagen anterior
    // por la nueva.
    await cliente.query(
      `
        UPDATE public."Users"
        SET
          profile_image_path = $1,
          updated_at = NOW()
        WHERE id = $2
      `,
      [nuevaRuta, req.user.id]
    );

    await cliente.query("COMMIT");
    transaccionAbierta = false;
    cambioConfirmado = true;

    // Solo eliminar la fotografía anterior
    // cuando la nueva ya esté guardada.
    if (
      rutaAnterior &&
      rutaAnterior !== nuevaRuta
    ) {
      try {
        const { error: errorEliminar } =
          await supabase.storage
            .from(BUCKET)
            .remove([rutaAnterior]);

        if (errorEliminar) {
          console.error(
            "No se pudo borrar la foto anterior:",
            errorEliminar
          );
        }
      } catch (errorEliminar) {
        console.error(
          "No se pudo borrar la foto anterior:",
          errorEliminar
        );
      }
    }

    // Crear URL temporal de la imagen nueva.
    let photoUrl = null;

    try {
      const { data, error } =
        await supabase.storage
          .from(BUCKET)
          .createSignedUrl(nuevaRuta, 300);

      if (error) {
        throw error;
      }

      photoUrl = data?.signedUrl || null;
    } catch (errorUrl) {
      console.error(
        "No se pudo generar la URL de la foto nueva:",
        errorUrl
      );
    }

    return res.json({
      message: "Fotografía actualizada correctamente",
      photoUrl,
    });
  } catch (error) {
    console.error(
      "Error al actualizar fotografía:",
      error
    );

    if (transaccionAbierta && cliente) {
      try {
        await cliente.query("ROLLBACK");
      } catch (errorRollback) {
        console.error(
          "Error al revertir la transacción:",
          errorRollback
        );
      }
    }

    // Limpiar la imagen nueva solamente si
    // no se confirmó su uso en la base de datos.
    if (
      subidaCompletada &&
      !cambioConfirmado &&
      nuevaRuta &&
      supabase
    ) {
      try {
        const consulta = await pool.query(
          `
            SELECT profile_image_path
            FROM public."Users"
            WHERE id = $1
          `,
          [req.user.id]
        );

        if (
          consulta.rows[0]?.profile_image_path !==
          nuevaRuta
        ) {
          const { error: errorLimpieza } =
            await supabase.storage
              .from(BUCKET)
              .remove([nuevaRuta]);

          if (errorLimpieza) {
            console.error(
              "Error limpiando subida:",
              errorLimpieza
            );
          }
        }
      } catch (errorLimpieza) {
        console.error(
          "No se pudo comprobar la limpieza:",
          errorLimpieza
        );
      }
    }

    return res.status(500).json({
      message: "No se pudo actualizar la fotografía",
    });
  } finally {
    if (cliente) {
      cliente.release();
    }
  }
});

// ==========================================
// ELIMINAR FOTOGRAFÍA
// DELETE /api/profile/photo
// ==========================================

router.delete("/photo", async (req, res) => {
  let cliente = null;
  let transaccionAbierta = false;

  try {
    cliente = await pool.connect();

    await cliente.query("BEGIN");
    transaccionAbierta = true;

    // Obtener la ruta anterior antes
    // de quitarla de la base de datos.
    const usuario = await cliente.query(
      `
        SELECT profile_image_path
        FROM public."Users"
        WHERE id = $1
        FOR UPDATE
      `,
      [req.user.id]
    );

    if (usuario.rows.length === 0) {
      await cliente.query("ROLLBACK");
      transaccionAbierta = false;

      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    const rutaAnterior =
      usuario.rows[0].profile_image_path;

    // Eliminar la referencia de la fotografía.
    await cliente.query(
      `
        UPDATE public."Users"
        SET
          profile_image_path = NULL,
          updated_at = NOW()
        WHERE id = $1
      `,
      [req.user.id]
    );

    await cliente.query("COMMIT");
    transaccionAbierta = false;

    // Eliminar también el archivo de Supabase.
    if (rutaAnterior) {
      try {
        const supabase = obtenerSupabaseStorage();

        const { error } =
          await supabase.storage
            .from(BUCKET)
            .remove([rutaAnterior]);

        if (error) {
          console.error(
            "No se pudo borrar el archivo de foto:",
            error
          );
        }
      } catch (errorStorage) {
        console.error(
          "No se pudo borrar el archivo de foto:",
          errorStorage
        );
      }
    }

    return res.json({
      message:
        "Fotografía eliminada del perfil correctamente",
      photoUrl: null,
    });
  } catch (error) {
    console.error(
      "Error al eliminar fotografía:",
      error
    );

    if (transaccionAbierta && cliente) {
      try {
        await cliente.query("ROLLBACK");
      } catch (errorRollback) {
        console.error(
          "Error al revertir la transacción:",
          errorRollback
        );
      }
    }

    return res.status(500).json({
      message: "No se pudo eliminar la fotografía",
    });
  } finally {
    if (cliente) {
      cliente.release();
    }
  }
});

module.exports = router;