import { useState } from "react";


function Icono({ tipo }) {
  const iconos = {
    dashboard: (
      <>
        <path d="M3 13h8V3H3v10Z" />
        <path d="M13 21h8V11h-8v10Z" />
        <path d="M3 21h8v-6H3v6Z" />
        <path d="M13 9h8V3h-8v6Z" />
      </>
    ),

    pantry: (
      <>
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </>
    ),

    recipes: (
      <>
        <path d="M12 3v18" />
        <path d="M8 3v5a4 4 0 0 0 8 0V3" />
        <path d="M5 3v7a3 3 0 0 0 3 3" />
      </>
    ),

    summary: (
      <>
        <path d="M4 19V9" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M22 19V3" />
      </>
    ),

    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1a1.7 1.7 0 0 0 1.1 1.6 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.14.36.35.68.6 1 .3.28.69.42 1.1.4h.1v4h-.1a1.7 1.7 0 0 0-1.7.6Z" />
      </>
    ),

    logout: (
      <>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      </>
    ),

    more: (
      <>
        <circle
          cx="5"
          cy="12"
          r="1"
          fill="currentColor"
          stroke="none"
        />
        <circle
          cx="12"
          cy="12"
          r="1"
          fill="currentColor"
          stroke="none"
        />
        <circle
          cx="19"
          cy="12"
          r="1"
          fill="currentColor"
          stroke="none"
        />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconos[tipo]}
    </svg>
  );
}


function Sidebar({
  paginaActual,
  onCambiarPagina,
  onLogout,
}) {
  const [menuMovilAbierto, setMenuMovilAbierto] =
    useState(false);

  // ==========================================
  // OPCIONES
  // ==========================================

  const opciones = [
    {
      id: "dashboard",
      icono: "dashboard",
      texto: "Inicio",
      textoMovil: "Inicio",
    },
    {
      id: "pantry",
      icono: "pantry",
      texto: "Mi despensa",
      textoMovil: "Despensa",
    },
    {
      id: "recipes",
      icono: "recipes",
      texto: "¿Qué puedo cocinar?",
      textoMovil: "Cocinar",
    },
    {
      id: "summary",
      icono: "summary",
      texto: "Resumen",
      textoMovil: "Resumen",
    },
  ];

  // En la barra inferior dejamos solamente
  // las tres secciones principales.
  const opcionesMoviles = opciones.filter(
    (opcion) =>
      opcion.id === "dashboard" ||
      opcion.id === "pantry" ||
      opcion.id === "recipes"
  );

  const masActivo =
    paginaActual === "summary" ||
    paginaActual === "settings";


  // ==========================================
  // NAVEGACIÓN MÓVIL
  // ==========================================

  const cambiarPaginaMovil = (pagina) => {
    setMenuMovilAbierto(false);
    onCambiarPagina(pagina);
  };

  const cerrarSesionMovil = () => {
    setMenuMovilAbierto(false);
    onLogout();
  };


  return (
    <>
      {/* =====================================
          SIDEBAR ESCRITORIO / TABLET
      ====================================== */}

      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <svg
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M24 39C14 35 9 27 11 17c8 0 14 3 17 9 1-7 5-12 12-15 2 11-3 20-16 28Z"
                fill="currentColor"
                opacity="0.95"
              />

              <path
                d="M24 39c0-9 3-16 10-22"
                fill="none"
                stroke="white"
                strokeWidth="2.4"
                strokeLinecap="round"
              />

              <path
                d="M24 39c-1-7-4-12-9-16"
                fill="none"
                stroke="white"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="sidebar-brand-text">
            <h1>Despensa</h1>
            <span>Antidesperdicio</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-section-title">
            PRINCIPAL
          </p>

          {opciones.map((opcion) => (
            <button
              key={opcion.id}
              type="button"
              title={opcion.texto}
              className={
                paginaActual === opcion.id
                  ? "sidebar-item active"
                  : "sidebar-item"
              }
              onClick={() =>
                onCambiarPagina(opcion.id)
              }
            >
              <span className="sidebar-item-icon">
                <Icono tipo={opcion.icono} />
              </span>

              <span className="sidebar-item-text">
                {opcion.texto}
              </span>

              {paginaActual === opcion.id && (
                <span className="sidebar-active-dot" />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-eco-card">
          <div className="eco-card-icon">
            ♻
          </div>

          <div>
            <strong>Aprovecha más</strong>

            <p>
              Cada alimento que aprovechas
              cuenta.
            </p>
          </div>
        </div>

        <div className="sidebar-bottom">
          <button
            type="button"
            title="Ajustes"
            className={
              paginaActual === "settings"
                ? "sidebar-item active"
                : "sidebar-item"
            }
            onClick={() =>
              onCambiarPagina("settings")
            }
          >
            <span className="sidebar-item-icon">
              <Icono tipo="settings" />
            </span>

            <span className="sidebar-item-text">
              Ajustes
            </span>
          </button>

          <button
            type="button"
            title="Cerrar sesión"
            className="sidebar-item logout"
            onClick={onLogout}
          >
            <span className="sidebar-item-icon">
              <Icono tipo="logout" />
            </span>

            <span className="sidebar-item-text">
              Cerrar sesión
            </span>
          </button>
        </div>
      </aside>


      {/* =====================================
          FONDO DEL MENÚ MÓVIL
      ====================================== */}

      {menuMovilAbierto && (
        <button
          type="button"
          className="mobile-menu-backdrop"
          aria-label="Cerrar menú"
          onClick={() =>
            setMenuMovilAbierto(false)
          }
        />
      )}


      {/* =====================================
          MENÚ "MÁS" PARA MÓVIL
      ====================================== */}

      <div
        className={
          menuMovilAbierto
            ? "mobile-more-menu open"
            : "mobile-more-menu"
        }
      >
        <div className="mobile-more-handle" />

        <div className="mobile-more-header">
          <div>
            <span className="mobile-more-eyebrow">
              NAVEGACIÓN
            </span>

            <h3>Más opciones</h3>
          </div>

          <button
            type="button"
            className="mobile-more-close"
            onClick={() =>
              setMenuMovilAbierto(false)
            }
            aria-label="Cerrar menú"
          >
            ×
          </button>
        </div>

        <div className="mobile-more-options">
          <button
            type="button"
            className={
              paginaActual === "summary"
                ? "mobile-more-item active"
                : "mobile-more-item"
            }
            onClick={() =>
              cambiarPaginaMovil("summary")
            }
          >
            <span className="mobile-more-item-icon">
              <Icono tipo="summary" />
            </span>

            <span className="mobile-more-item-content">
              <strong>Resumen</strong>
              <small>
                Consulta el estado de tu despensa
              </small>
            </span>

            <span className="mobile-more-arrow">
              ›
            </span>
          </button>

          <button
            type="button"
            className={
              paginaActual === "settings"
                ? "mobile-more-item active"
                : "mobile-more-item"
            }
            onClick={() =>
              cambiarPaginaMovil("settings")
            }
          >
            <span className="mobile-more-item-icon">
              <Icono tipo="settings" />
            </span>

            <span className="mobile-more-item-content">
              <strong>Ajustes</strong>
              <small>
                Configura tu cuenta
              </small>
            </span>

            <span className="mobile-more-arrow">
              ›
            </span>
          </button>
        </div>

        <div className="mobile-more-divider" />

        <button
          type="button"
          className="mobile-more-item mobile-logout"
          onClick={cerrarSesionMovil}
        >
          <span className="mobile-more-item-icon">
            <Icono tipo="logout" />
          </span>

          <span className="mobile-more-item-content">
            <strong>Cerrar sesión</strong>
            <small>
              Salir de tu cuenta
            </small>
          </span>
        </button>
      </div>


      {/* =====================================
          NAVEGACIÓN INFERIOR MÓVIL
      ====================================== */}

      <nav
        className="mobile-navigation"
        aria-label="Navegación principal"
      >
        {opcionesMoviles.map((opcion) => (
          <button
            key={opcion.id}
            type="button"
            aria-label={opcion.texto}
            className={
              paginaActual === opcion.id
                ? "mobile-navigation-item active"
                : "mobile-navigation-item"
            }
            onClick={() =>
              cambiarPaginaMovil(opcion.id)
            }
          >
            <span className="mobile-navigation-icon">
              <Icono tipo={opcion.icono} />
            </span>

            <span className="mobile-navigation-text">
              {opcion.textoMovil}
            </span>
          </button>
        ))}

        <button
          type="button"
          aria-label="Más opciones"
          aria-expanded={menuMovilAbierto}
          className={
            menuMovilAbierto || masActivo
              ? "mobile-navigation-item active"
              : "mobile-navigation-item"
          }
          onClick={() =>
            setMenuMovilAbierto(
              (estadoActual) => !estadoActual
            )
          }
        >
          <span className="mobile-navigation-icon">
            <Icono tipo="more" />
          </span>

          <span className="mobile-navigation-text">
            Más
          </span>
        </button>
      </nav>
    </>
  );
}

export default Sidebar;