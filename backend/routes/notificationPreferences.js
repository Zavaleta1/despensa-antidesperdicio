const express = require("express");

const authMiddleware =
    require("../middleware/authMiddleware");

const {
    obtenerPreferenciasUsuario,
    actualizarPreferenciasUsuario
} = require(
    "../services/notificationPreferenceService"
);


const router = express.Router();


// ==========================================
// VALIDAR BOOLEANO
// ==========================================

function esBooleano(valor) {
    return typeof valor === "boolean";
}


// ==========================================
// OBTENER PREFERENCIAS
// ==========================================

router.get(
    "/",
    authMiddleware,
    async (req, res) => {

        try {

            const preferencias =
                await obtenerPreferenciasUsuario(
                    req.user.id
                );


            res.json(preferencias);

        } catch (error) {

            console.error(
                "❌ Error al obtener preferencias:",
                error
            );


            res.status(500).json({
                message:
                    "Error al obtener preferencias de notificación",

                error:
                    error.message
            });
        }
    }
);


// ==========================================
// ACTUALIZAR PREFERENCIAS
// ==========================================

router.put(
    "/",
    authMiddleware,
    async (req, res) => {

        try {

            const {
                in_app_enabled,
                email_enabled,
                notify_expired,
                notify_critical,
                notify_upcoming,
                notify_attention,
                notify_current
            } = req.body;


            // ==================================
            // VALIDAR CAMPOS
            // ==================================

            const campos = {
                in_app_enabled,
                email_enabled,
                notify_expired,
                notify_critical,
                notify_upcoming,
                notify_attention,
                notify_current
            };


            for (
                const [
                    nombre,
                    valor
                ] of Object.entries(campos)
            ) {

                if (!esBooleano(valor)) {

                    return res
                        .status(400)
                        .json({
                            message:
                                `El campo ${nombre} debe ser booleano`
                        });
                }
            }


            // ==================================
            // ACTUALIZAR
            // ==================================

            const preferencias =
                await actualizarPreferenciasUsuario(
                    req.user.id,
                    campos
                );


            res.json({
                message:
                    "Preferencias actualizadas correctamente",

                preferencias
            });

        } catch (error) {

            console.error(
                "❌ Error al actualizar preferencias:",
                error
            );


            res.status(500).json({
                message:
                    "Error al actualizar preferencias de notificación",

                error:
                    error.message
            });
        }
    }
);


module.exports = router;