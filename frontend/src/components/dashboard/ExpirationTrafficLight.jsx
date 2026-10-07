function ExpirationTrafficLight({
  estadisticas,
  onVerDespensa,
}) {
  return (
    <section className="dashboard-section">
      <div className="dashboard-section-heading">
        <div>
          <span className="dashboard-eyebrow">
            SEMÁFORO
          </span>

          <h2>
            Estado de tus alimentos
          </h2>

          <p>
            Clasificación basada en la fecha
            de caducidad registrada.
          </p>
        </div>

        <button
          type="button"
          className="dashboard-link-button"
          onClick={onVerDespensa}
        >
          Ver despensa →
        </button>
      </div>

      <div className="traffic-light-grid">
        <article className="traffic-card traffic-red">
          <span className="traffic-circle">
            🔴
          </span>

          <div>
            <strong>
              {estadisticas.caducados +
                estadisticas.criticos}
            </strong>

            <span>Urgentes</span>

            <small>
              {estadisticas.caducados} caducados
              {" · "}
              {estadisticas.criticos} críticos
            </small>
          </div>
        </article>

        <article className="traffic-card traffic-orange">
          <span className="traffic-circle">
            🟠
          </span>

          <div>
            <strong>
              {estadisticas.proximos}
            </strong>

            <span>Próximos</span>

            <small>4 a 7 días</small>
          </div>
        </article>

        <article className="traffic-card traffic-yellow">
          <span className="traffic-circle">
            🟡
          </span>

          <div>
            <strong>
              {estadisticas.atencion}
            </strong>

            <span>Atención</span>

            <small>8 a 14 días</small>
          </div>
        </article>

        <article className="traffic-card traffic-green">
          <span className="traffic-circle">
            🟢
          </span>

          <div>
            <strong>
              {estadisticas.vigentes}
            </strong>

            <span>Vigentes</span>

            <small>Más de 14 días</small>
          </div>
        </article>
      </div>
    </section>
  );
}

export default ExpirationTrafficLight;