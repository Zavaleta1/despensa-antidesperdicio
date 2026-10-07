function ProductCard({
  producto,
  onEditar,
  onEliminar,
}) {
  // ==========================================
  // FORMATEAR FECHA
  // ==========================================

  const formatearFecha = (fecha) => {
    if (!fecha) {
      return "Sin fecha";
    }

    const [anio, mes, dia] = fecha
      .substring(0, 10)
      .split("-");

    return `${dia}/${mes}/${anio}`;
  };


  // ==========================================
  // TEXTO DE CADUCIDAD
  // ==========================================

  const obtenerTextoCaducidad = () => {
    const dias = producto.days_remaining;

    if (producto.expiration_level === "agotado") {
      return "Producto agotado";
    }

    if (dias === null || dias === undefined) {
      return "Sin información de caducidad";
    }

    if (dias < 0) {
      const diasCaducado = Math.abs(dias);

      return diasCaducado === 1
        ? "Caducó hace 1 día"
        : `Caducó hace ${diasCaducado} días`;
    }

    if (dias === 0) {
      return "Caduca hoy";
    }

    if (dias === 1) {
      return "Caduca mañana";
    }

    return `Faltan ${dias} días`;
  };


  // ==========================================
  // INDICADOR DEL SEMÁFORO
  // ==========================================

  const obtenerIndicador = () => {
    switch (producto.expiration_level) {
      case "caducado":
      case "critico":
        return "🔴";

      case "proximo":
        return "🟠";

      case "atencion":
        return "🟡";

      case "vigente":
        return "🟢";

      case "agotado":
        return "⚫";

      default:
        return "⚪";
    }
  };


  // ==========================================
  // CATEGORÍA
  // ==========================================

  const iconoCategoria =
    producto.category_icon || "📦";

  const nombreCategoria =
    producto.category_name || "Sin categoría";


  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <article
      className={`product-card product-card-${
        producto.expiration_level || "sin-fecha"
      }`}
    >
      {/* ======================================
          CABECERA
      ======================================= */}

      <div className="product-card-header">
        <div className="product-identity">
          <div
            className="product-main-icon"
            title={nombreCategoria}
          >
            {iconoCategoria}
          </div>

          <div className="product-title-area">
            <span className="product-category-label">
              {nombreCategoria}
            </span>

            <h3 title={producto.name}>
              {producto.name}
            </h3>
          </div>
        </div>

        <div
          className={`expiration-badge expiration-${
            producto.expiration_level || "sin-fecha"
          }`}
        >
          <span className="expiration-dot">
            {obtenerIndicador()}
          </span>

          <span>
            {producto.expiration_status ||
              "Sin estado"}
          </span>
        </div>
      </div>


      {/* ======================================
          CADUCIDAD
      ======================================= */}

      <div className="product-expiration-panel">
        <div className="expiration-calendar-icon">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <rect
              x="3"
              y="5"
              width="18"
              height="16"
              rx="2"
            />

            <path d="M16 3v4" />
            <path d="M8 3v4" />
            <path d="M3 10h18" />
          </svg>
        </div>

        <div className="product-expiration-text">
          <span>
            CADUCIDAD
          </span>

          <strong>
            {obtenerTextoCaducidad()}
          </strong>

          <small>
            {formatearFecha(
              producto.expiration_date
            )}
          </small>
        </div>
      </div>


      {/* ======================================
          INFORMACIÓN DEL PRODUCTO
      ======================================= */}

      <div className="product-details">
        {/* CANTIDAD */}

        <div className="product-detail">
          <span className="detail-icon">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M4 19h16" />
              <path d="M6 16l3-8 3 8" />
              <path d="M7 13h4" />
              <path d="M15 8h3" />
              <path d="M16.5 8v8" />
            </svg>
          </span>

          <div>
            <small>
              CANTIDAD
            </small>

            <strong>
              {producto.quantity}{" "}
              {producto.unit}
            </strong>
          </div>
        </div>


        {/* UBICACIÓN */}

        <div className="product-detail">
          <span className="detail-icon">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />

              <circle
                cx="12"
                cy="10"
                r="2.5"
              />
            </svg>
          </span>

          <div>
            <small>
              UBICACIÓN
            </small>

            <strong title={producto.location}>
              {producto.location ||
                "Sin ubicación"}
            </strong>
          </div>
        </div>
      </div>


      {/* ======================================
          NOTAS
      ======================================= */}

      {producto.notes && (
        <div className="product-notes">
          <span className="product-notes-icon">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />

              <path d="M14 2v6h6" />

              <path d="M8 13h8" />

              <path d="M8 17h5" />
            </svg>
          </span>

          <p title={producto.notes}>
            {producto.notes}
          </p>
        </div>
      )}


      {/* ======================================
          ACCIONES
      ======================================= */}

      <div className="product-actions">
        <button
          type="button"
          className="edit-button"
          onClick={() =>
            onEditar(producto)
          }
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 20h9" />

            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>

          Editar
        </button>

        <button
          type="button"
          className="delete-button"
          onClick={() =>
            onEliminar(producto)
          }
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M3 6h18" />

            <path d="M8 6V4h8v2" />

            <path d="M19 6l-1 15H6L5 6" />

            <path d="M10 11v6" />

            <path d="M14 11v6" />
          </svg>

          Eliminar
        </button>
      </div>
    </article>
  );
}

export default ProductCard;