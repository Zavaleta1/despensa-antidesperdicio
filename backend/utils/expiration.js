// ==========================================
// SEMÁFORO DE CADUCIDAD
// ==========================================

function calcularSemaforo(expirationDate, status) {

    // ==========================================
    // AGOTADO
    // ==========================================

    if (status === "Agotado") {
        return {
            days_remaining: null,
            expiration_status: "Agotado",
            expiration_level: "agotado"
        };
    }

    // ==========================================
    // SIN FECHA
    // ==========================================

    if (!expirationDate) {
        return {
            days_remaining: null,
            expiration_status: "Sin fecha",
            expiration_level: "sin-fecha"
        };
    }

    // ==========================================
    // FECHA DE CADUCIDAD
    // ==========================================

    const fecha = new Date(expirationDate);

    if (Number.isNaN(fecha.getTime())) {
        return {
            days_remaining: null,
            expiration_status: "Sin fecha",
            expiration_level: "sin-fecha"
        };
    }

    /*
        IMPORTANTE:

        SQL Server puede devolver:

        2026-10-05T00:00:00.000Z

        No debemos convertir esa fecha a la zona
        horaria local porque podría convertirse
        en 04/10/2026.

        Por eso extraemos año, mes y día usando UTC.
    */

    const fechaCaducidadUTC = Date.UTC(
        fecha.getUTCFullYear(),
        fecha.getUTCMonth(),
        fecha.getUTCDate()
    );

    // ==========================================
    // FECHA ACTUAL
    // ==========================================

    const ahora = new Date();

    const hoyUTC = Date.UTC(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate()
    );

    // ==========================================
    // DIFERENCIA EN DÍAS
    // ==========================================

    const milisegundosPorDia =
        1000 * 60 * 60 * 24;

    const daysRemaining = Math.round(
        (fechaCaducidadUTC - hoyUTC) /
        milisegundosPorDia
    );

    // ==========================================
    // 🔴 CADUCADO
    // ==========================================

    if (daysRemaining < 0) {
        return {
            days_remaining: daysRemaining,
            expiration_status: "Caducado",
            expiration_level: "caducado"
        };
    }

    // ==========================================
    // 🔴 CRÍTICO
    // 0 - 3 días
    // ==========================================

    if (daysRemaining <= 3) {
        return {
            days_remaining: daysRemaining,
            expiration_status: "Crítico",
            expiration_level: "critico"
        };
    }

    // ==========================================
    // 🟠 PRÓXIMO
    // 4 - 7 días
    // ==========================================

    if (daysRemaining <= 7) {
        return {
            days_remaining: daysRemaining,
            expiration_status: "Próximo",
            expiration_level: "proximo"
        };
    }

    // ==========================================
    // 🟡 ATENCIÓN
    // 8 - 14 días
    // ==========================================

    if (daysRemaining <= 14) {
        return {
            days_remaining: daysRemaining,
            expiration_status: "Atención",
            expiration_level: "atencion"
        };
    }

    // ==========================================
    // 🟢 VIGENTE
    // Más de 14 días
    // ==========================================

    return {
        days_remaining: daysRemaining,
        expiration_status: "Vigente",
        expiration_level: "vigente"
    };
}


// ==========================================
// AGREGAR SEMÁFORO A UN PRODUCTO
// ==========================================

function agregarSemaforo(producto) {

    const semaforo = calcularSemaforo(
        producto.expiration_date,
        producto.status
    );

    return {
        ...producto,
        ...semaforo
    };
}


// ==========================================
// AGREGAR SEMÁFORO A VARIOS PRODUCTOS
// ==========================================

function agregarSemaforoAProductos(productos) {

    return productos.map((producto) =>
        agregarSemaforo(producto)
    );
}


// ==========================================
// EXPORTACIONES
// ==========================================

module.exports = {
    calcularSemaforo,
    agregarSemaforo,
    agregarSemaforoAProductos
};