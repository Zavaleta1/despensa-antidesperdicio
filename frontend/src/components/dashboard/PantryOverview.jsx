function PantryOverview({ estadisticas }) {
  return (
    <section className="dashboard-summary-grid">
      <article className="dashboard-summary-card">
        <div className="summary-icon">
          📦
        </div>

        <div>
          <span>Productos</span>

          <strong>
            {estadisticas.total}
          </strong>

          <small>En tu despensa</small>
        </div>
      </article>

      <article className="dashboard-summary-card">
        <div className="summary-icon">
          🗂️
        </div>

        <div>
          <span>Categorías</span>

          <strong>
            {estadisticas.categorias}
          </strong>

          <small>En uso</small>
        </div>
      </article>

      <article className="dashboard-summary-card">
        <div className="summary-icon">
          📍
        </div>

        <div>
          <span>Ubicaciones</span>

          <strong>
            {estadisticas.ubicaciones}
          </strong>

          <small>Registradas</small>
        </div>
      </article>

      <article
        className={
          estadisticas.urgentes > 0
            ? "dashboard-summary-card summary-alert"
            : "dashboard-summary-card summary-ok"
        }
      >
        <div className="summary-icon">
          🚦
        </div>

        <div>
          <span>Requieren acción</span>

          <strong>
            {estadisticas.urgentes}
          </strong>

          <small>
            Caducados o críticos
          </small>
        </div>
      </article>
    </section>
  );
}

export default PantryOverview;