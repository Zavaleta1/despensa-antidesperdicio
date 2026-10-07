function StatCard({
  icono,
  titulo,
  valor,
  descripcion,
  tipo = "default",
}) {
  return (
    <article className={`stat-card stat-${tipo}`}>
      <div className="stat-icon">
        {icono}
      </div>

      <div className="stat-information">
        <span className="stat-title">
          {titulo}
        </span>

        <strong className="stat-value">
          {valor}
        </strong>

        <span className="stat-description">
          {descripcion}
        </span>
      </div>
    </article>
  );
}

export default StatCard;