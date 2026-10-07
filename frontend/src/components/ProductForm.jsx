import { useState } from "react";

const formularioVacio = {
  category_id: "",
  name: "",
  quantity: "",
  unit: "",
  expiration_date: "",
  location: "",
  notes: "",
  status: "Disponible",
};

function ProductForm({
  categorias,
  producto = null,
  onGuardar,
  onCancelar,
}) {
  const [formulario, setFormulario] = useState(() => {
    if (!producto) {
      return formularioVacio;
    }

    return {
      category_id: producto.category_id ?? "",
      name: producto.name ?? "",
      quantity: producto.quantity ?? "",
      unit: producto.unit ?? "",
      expiration_date:
        producto.expiration_date?.substring(0, 10) ?? "",
      location: producto.location ?? "",
      notes: producto.notes ?? "",
      status: producto.status ?? "Disponible",
    };
  });

  const [guardando, setGuardando] = useState(false);

  const esEdicion = Boolean(producto);

  // ==========================================
  // CAMBIAR CAMPOS
  // ==========================================

  const cambiarCampo = (evento) => {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  };

  // ==========================================
  // ENVIAR FORMULARIO
  // ==========================================

  const enviarFormulario = async (evento) => {
    evento.preventDefault();

    if (guardando) {
      return;
    }

    setGuardando(true);

    try {
      const datosProducto = {
        category_id: Number(formulario.category_id),
        name: formulario.name.trim(),
        quantity: Number(formulario.quantity),
        unit: formulario.unit,
        expiration_date: formulario.expiration_date,
        location: formulario.location,
        notes: formulario.notes.trim(),
        status: formulario.status,
      };

      await onGuardar(datosProducto);

      if (!esEdicion) {
        setFormulario({
          ...formularioVacio,
        });
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="product-form-container">
      {/* ======================================
          CABECERA
      ======================================= */}

      <div className="product-form-header">
        <div className="product-form-header-icon">
          {esEdicion ? (
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          )}
        </div>

        <div className="product-form-title">
          <span>
            {esEdicion
              ? "ACTUALIZAR PRODUCTO"
              : "NUEVO PRODUCTO"}
          </span>

          <h2>
            {esEdicion
              ? `Editar ${producto.name}`
              : "Agregar a mi despensa"}
          </h2>

          <p>
            {esEdicion
              ? "Actualiza la información del alimento seleccionado."
              : "Registra un alimento para controlar su cantidad y fecha de caducidad."}
          </p>
        </div>
      </div>

      {/* ======================================
          FORMULARIO
      ======================================= */}

      <form onSubmit={enviarFormulario}>
        <div className="product-form-grid">
          {/* NOMBRE */}

          <div className="form-field">
            <label htmlFor="product-name">
              Nombre del producto
              <span className="required-mark">*</span>
            </label>

            <div className="form-control-wrapper">
              <span className="form-control-icon">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                  <path d="m3.3 7 8.7 5 8.7-5" />
                  <path d="M12 22V12" />
                </svg>
              </span>

              <input
                id="product-name"
                type="text"
                name="name"
                value={formulario.name}
                onChange={cambiarCampo}
                placeholder="Ej. Manzanas"
                autoComplete="off"
                required
              />
            </div>
          </div>

          {/* CATEGORÍA */}

          <div className="form-field">
            <label htmlFor="product-category">
              Categoría
              <span className="required-mark">*</span>
            </label>

            <div className="form-control-wrapper">
              <span className="form-control-icon">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <rect
                    x="3"
                    y="3"
                    width="7"
                    height="7"
                    rx="1"
                  />
                  <rect
                    x="14"
                    y="3"
                    width="7"
                    height="7"
                    rx="1"
                  />
                  <rect
                    x="3"
                    y="14"
                    width="7"
                    height="7"
                    rx="1"
                  />
                  <rect
                    x="14"
                    y="14"
                    width="7"
                    height="7"
                    rx="1"
                  />
                </svg>
              </span>

              <select
                id="product-category"
                name="category_id"
                value={formulario.category_id}
                onChange={cambiarCampo}
                required
              >
                <option value="">
                  Selecciona una categoría
                </option>

                {categorias.map((categoria) => (
                  <option
                    key={categoria.id}
                    value={categoria.id}
                  >
                    {categoria.icon
                      ? `${categoria.icon} `
                      : ""}

                    {categoria.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* CANTIDAD */}

          <div className="form-field">
            <label htmlFor="product-quantity">
              Cantidad
              <span className="required-mark">*</span>
            </label>

            <div className="form-control-wrapper">
              <span className="form-control-icon">
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

              <input
                id="product-quantity"
                type="number"
                name="quantity"
                value={formulario.quantity}
                onChange={cambiarCampo}
                min="0.01"
                step="0.01"
                placeholder="Ej. 2"
                inputMode="decimal"
                required
              />
            </div>
          </div>

          {/* UNIDAD */}

          <div className="form-field">
            <label htmlFor="product-unit">
              Unidad
              <span className="required-mark">*</span>
            </label>

            <div className="form-control-wrapper">
              <span className="form-control-icon">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M4 6h16" />
                  <path d="M7 6v12" />
                  <path d="M17 6v12" />
                  <path d="M4 18h16" />
                  <path d="M10 9v3" />
                  <path d="M14 9v3" />
                </svg>
              </span>

              <select
                id="product-unit"
                name="unit"
                value={formulario.unit}
                onChange={cambiarCampo}
                required
              >
                <option value="">
                  Selecciona una unidad
                </option>

                <option value="piezas">
                  Piezas
                </option>

                <option value="kg">
                  Kilogramos
                </option>

                <option value="g">
                  Gramos
                </option>

                <option value="litros">
                  Litros
                </option>

                <option value="ml">
                  Mililitros
                </option>
              </select>
            </div>
          </div>

          {/* FECHA */}

          <div className="form-field">
            <label htmlFor="product-expiration">
              Fecha de caducidad
              <span className="required-mark">*</span>
            </label>

            <div className="form-control-wrapper">
              <span className="form-control-icon">
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
              </span>

              <input
                id="product-expiration"
                type="date"
                name="expiration_date"
                value={formulario.expiration_date}
                onChange={cambiarCampo}
                required
              />
            </div>
          </div>

          {/* UBICACIÓN */}

          <div className="form-field">
            <label htmlFor="product-location">
              Ubicación
              <span className="required-mark">*</span>
            </label>

            <div className="form-control-wrapper">
              <span className="form-control-icon">
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

              <select
                id="product-location"
                name="location"
                value={formulario.location}
                onChange={cambiarCampo}
                required
              >
                <option value="">
                  Selecciona una ubicación
                </option>

                <option value="Refrigerador">
                  Refrigerador
                </option>

                <option value="Congelador">
                  Congelador
                </option>

                <option value="Despensa">
                  Despensa
                </option>

                <option value="Alacena">
                  Alacena
                </option>
              </select>
            </div>
          </div>

          {/* ESTADO */}

          <div className="form-field">
            <label htmlFor="product-status">
              Estado del producto
            </label>

            <div className="form-control-wrapper">
              <span className="form-control-icon">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                  />
                  <path d="m8 12 2.5 2.5L16 9" />
                </svg>
              </span>

              <select
                id="product-status"
                name="status"
                value={formulario.status}
                onChange={cambiarCampo}
              >
                <option value="Disponible">
                  Disponible
                </option>

                <option value="Por caducar">
                  Por caducar
                </option>

                <option value="Agotado">
                  Agotado
                </option>
              </select>
            </div>
          </div>

          {/* NOTAS */}

          <div className="form-field full-width">
            <label htmlFor="product-notes">
              Notas
              <span className="optional-label">
                Opcional
              </span>
            </label>

            <div className="form-control-wrapper textarea-wrapper">
              <span className="form-control-icon textarea-icon">
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

              <textarea
                id="product-notes"
                name="notes"
                value={formulario.notes}
                onChange={cambiarCampo}
                placeholder="Ej. Consumir primero, paquete abierto..."
                rows="4"
                maxLength="500"
              />
            </div>

            <div className="form-field-footer">
              <span>
                Añade información que te ayude
                a recordar algo importante.
              </span>

              <span>
                {formulario.notes.length}/500
              </span>
            </div>
          </div>
        </div>

        {/* ======================================
            AYUDA SEMÁFORO
        ======================================= */}

        <div className="product-form-semaphore-help">
          <div className="semaphore-help-icon">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
              />
              <path d="M12 11v5" />
              <path d="M12 8h.01" />
            </svg>
          </div>

          <div>
            <strong>
              El semáforo se calcula automáticamente
            </strong>

            <p>
              Utilizaremos la fecha de caducidad para
              indicar la prioridad de consumo del alimento.
            </p>
          </div>

          <div className="semaphore-mini">
            <span title="Crítico">🔴</span>
            <span title="Próximo">🟠</span>
            <span title="Atención">🟡</span>
            <span title="Vigente">🟢</span>
          </div>
        </div>

        {/* ======================================
            ACCIONES
        ======================================= */}

        <div className="form-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={onCancelar}
            disabled={guardando}
          >
            Cancelar
          </button>

          <button
            className="primary-button"
            type="submit"
            disabled={guardando}
          >
            {guardando ? (
              <>
                <span className="button-spinner" />

                {esEdicion
                  ? "Actualizando..."
                  : "Guardando..."}
              </>
            ) : (
              <>
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  {esEdicion ? (
                    <>
                      <path d="M20 6 9 17l-5-5" />
                    </>
                  ) : (
                    <>
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </>
                  )}
                </svg>

                {esEdicion
                  ? "Guardar cambios"
                  : "Agregar producto"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProductForm;