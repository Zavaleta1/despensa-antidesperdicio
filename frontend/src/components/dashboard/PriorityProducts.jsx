function PriorityProducts({ productos }) {
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

  const obtenerTextoDias = (producto) => {
    const dias = producto.days_remaining;

    if (
      dias === null ||
      dias === undefined
    ) {
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
            <h3>
              Todo está bajo control
            </h3>

            <p>
              Actualmente no tienes productos
              que requieran atención por
              caducidad.
            </p>
          </div>
        </div>
      ) : (
        <div className="priority-products">
          {productos.map((producto) => (
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
                  {producto.location}
                </span>
              </div>

              <div className="priority-expiration">
                <strong>
                  {producto.expiration_status}
                </strong>

                <span>
                  {obtenerTextoDias(producto)}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default PriorityProducts;