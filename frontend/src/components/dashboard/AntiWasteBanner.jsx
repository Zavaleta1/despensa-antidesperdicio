function AntiWasteBanner({
  onVerRecetas,
}) {
  return (
    <section className="antiwaste-banner">
      <div className="antiwaste-icon">
        🌿
      </div>

      <div className="antiwaste-content">
        <span className="dashboard-eyebrow">
          ANTIDESPERDICIO
        </span>

        <h2>
          Aprovecha primero lo que está
          por caducar
        </h2>

        <p>
          Usa tus alimentos prioritarios para
          encontrar opciones de preparación
          antes de que se desperdicien.
        </p>
      </div>

      <button
        type="button"
        onClick={onVerRecetas}
      >
        ¿Qué puedo cocinar? →
      </button>
    </section>
  );
}

export default AntiWasteBanner;