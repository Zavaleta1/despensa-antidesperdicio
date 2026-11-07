
import { useEffect, useState } from "react";

function PriorityProducts({
  productos,
  onVerDespensa,
}) {
  // ==========================================
  // INGREDIENTES SELECCIONADOS
  // ==========================================

  const [
    ingredientesSeleccionados,
    setIngredientesSeleccionados,
  ] = useState([]);

  // ==========================================
  // PRODUCTOS APTOS PARA BUSCAR RECETAS
  // Entre 0 y 3 días antes de caducar
  // ==========================================

  const productosParaRecetas = productos.filter(
    (producto) => {
      const dias = Number(
        producto.days_remaining
      );

      const cantidad = Number(
        producto.quantity
      );

      return (
        producto.days_remaining != null &&
        Number.isFinite(dias) &&
        dias >= 0 &&
        dias <= 3 &&
        Number.isFinite(cantidad) &&
        cantidad > 0
      );
    }
  );

  // ==========================================
  // SINCRONIZAR SELECCIÓN
  // Si un producto deja de estar disponible,
  // se elimina de la selección.
  // ==========================================

  useEffect(() => {
    const idsDisponibles = new Set(
      productosParaRecetas.map(
        (producto) => String(producto.id)
      )
    );

    setIngredientesSeleccionados(
      (anteriores) => {
        const actualizados = anteriores.filter(
          (id) => idsDisponibles.has(id)
        );

        return actualizados.length ===
          anteriores.length
          ? anteriores
          : actualizados;
      }
    );
  }, [productos]);

  // ==========================================
  // INDICADOR DEL SEMÁFORO
  // ==========================================

  const obtenerIconoSemaforo = (nivel) => {
    switch (nivel) {
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
  // TEXTO DE CADUCIDAD
  // ==========================================

  const obtenerTextoDias = (producto) => {
    const dias = producto.days_remaining;

    if (dias === null || dias === undefined) {
      return "Sin fecha";
    }

    if (dias < 0) {
      const diferencia = Math.abs(dias);

      return diferencia === 1
        ? "Caducó hace 1 día"
        : `Caducó hace ${diferencia} días`;
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
  // SELECCIONAR O QUITAR INGREDIENTE
  // ==========================================

  const alternarIngrediente = (productoId) => {
    const id = String(productoId);

    setIngredientesSeleccionados(
      (anteriores) =>
        anteriores.includes(id)
          ? anteriores.filter(
              (actual) => actual !== id
            )
          : [...anteriores, id]
    );
  };

  // ==========================================
  // GENERAR BÚSQUEDA EN GOOGLE
  // ==========================================

  const buscarRecetas = () => {
    const nombres = productosParaRecetas
      .filter((producto) =>
        ingredientesSeleccionados.includes(
          String(producto.id)
        )
      )
      .map((producto) =>
        producto.name.trim()
      )
      .filter(Boolean);

    // Evitar nombres repetidos
    const ingredientes = [
      ...new Set(nombres),
    ];

    if (ingredientes.length === 0) {
      return;
    }

    const consulta = `recetas con ${ingredientes.join(
      " "
    )}`;

    const url =
      "https://www.google.com/search?q=" +
      encodeURIComponent(consulta);

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <section className="dashboard-section">
      <div className="dashboard-section-heading">
        <div>
          <span className="dashboard-eyebrow">
            PRIORIDAD
          </span>

          <h2>
            Productos que requieren atención
          </h2>

          <p>
            Revisa primero los alimentos con
            menor tiempo disponible.
          </p>
        </div>
      </div>

      {productos.length === 0 ? (
        <div className="dashboard-good-state">
          <span>✓</span>

          <div>
            <h3>Todo está bajo control</h3>

            <p>
              Actualmente no tienes productos
              que requieran atención por
              caducidad.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="priority-products">
            {productos.map((producto) => {
              const id = String(producto.id);

              const aptoParaRecetas =
                productosParaRecetas.some(
                  (item) =>
                    String(item.id) === id
                );

              const seleccionado =
                ingredientesSeleccionados.includes(
                  id
                );

              return (
                <article
                  key={producto.id}
                  className={`priority-product priority-${producto.expiration_level}`}
                >
                  <div className="priority-status">
                    <span>
                      {obtenerIconoSemaforo(
                        producto.expiration_level
                      )}
                    </span>
                  </div>

                  <div className="priority-product-info">
                    <strong>
                      {producto.name}
                    </strong>

                    <span>
                      {producto.quantity}{" "}
                      {producto.unit}
                      {" · "}
                      {producto.location ||
                        "Sin ubicación"}
                    </span>

                    {aptoParaRecetas && (
                      <label className="priority-ingredient-select">
                        <input
                          type="checkbox"
                          checked={seleccionado}
                          onChange={() =>
                            alternarIngrediente(
                              producto.id
                            )
                          }
                        />

                        <span>
                          Usar como ingrediente
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="priority-expiration">
                    <strong>
                      {producto.expiration_status}
                    </strong>

                    <span>
                      {obtenerTextoDias(producto)}
                    </span>

                    <button
                      type="button"
                      className="priority-view-button"
                      onClick={() =>
                        onVerDespensa(producto)
                      }
                    >
                      Ver en mi despensa
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {productosParaRecetas.length > 0 && (
            <div className="priority-recipes-panel">
              <div>
                <h3>
                  🍳 Aprovecha tus alimentos
                </h3>

                <p>
                  Selecciona los ingredientes
                  que deseas utilizar y busca
                  recetas para aprovecharlos
                  antes de que caduquen.
                </p>

                <span className="priority-recipes-count">
                  {
                    ingredientesSeleccionados.length
                  }{" "}
                  {ingredientesSeleccionados.length ===
                  1
                    ? "ingrediente seleccionado"
                    : "ingredientes seleccionados"}
                </span>
              </div>

              <button
                type="button"
                className="priority-recipes-button"
                onClick={buscarRecetas}
                disabled={
                  ingredientesSeleccionados.length ===
                  0
                }
              >
                🔎 Buscar recetas
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default PriorityProducts;
