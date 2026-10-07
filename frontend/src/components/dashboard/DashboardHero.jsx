function DashboardHero({
  usuario,
  onAgregarProducto,
}) {
  const primerNombre =
    usuario?.name?.split(" ")[0] || "Usuario";

  return (
    <section className="dashboard-heading">
      <div>
        <span className="dashboard-eyebrow">
          MI DESPENSA
        </span>

        <h1>
          Hola, {primerNombre} 👋
        </h1>

        <p>
          Aquí tienes un resumen de tus alimentos
          y de los productos que necesitan atención.
        </p>
      </div>

      <button
        type="button"
        className="dashboard-primary-button"
        onClick={onAgregarProducto}
      >
        ＋ Agregar producto
      </button>
    </section>
  );
}

export default DashboardHero;