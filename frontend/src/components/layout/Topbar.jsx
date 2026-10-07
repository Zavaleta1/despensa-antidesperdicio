import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";


function Topbar({
  usuario,
  titulo,

  notificaciones = [],
  cargandoNotificaciones = false,

  onNotificacionLeida,
  onMarcarTodasLeidas,
  onRecargarNotificaciones,

  onIrAPerfil,
  onIrAAjustes,
  onIrADespensa,

  onLogout,
}) {
  // ==========================================
  // ESTADOS DE LOS MENÚS
  // ==========================================

  const [
    mostrarNotificaciones,
    setMostrarNotificaciones,
  ] = useState(false);

  const [
    mostrarPerfil,
    setMostrarPerfil,
  ] = useState(false);


  // ==========================================
  // REFERENCIAS
  // ==========================================

  const notificacionesRef =
    useRef(null);

  const perfilRef =
    useRef(null);


  // ==========================================
  // INICIALES DEL USUARIO
  // ==========================================

  const obtenerIniciales = () => {
    if (!usuario?.name) {
      return "U";
    }

    return usuario.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((palabra) => palabra[0])
      .join("")
      .toUpperCase();
  };


  // ==========================================
  // NOTIFICACIONES NO LEÍDAS
  // ==========================================

  const notificacionesNoLeidas =
    useMemo(() => {
      return notificaciones.filter(
        (notificacion) =>
          !notificacion.is_read
      ).length;
    }, [notificaciones]);


  // ==========================================
  // ORDENAR NOTIFICACIONES
  // ==========================================

  const notificacionesOrdenadas =
    useMemo(() => {
      return [...notificaciones].sort(
        (a, b) =>
          new Date(b.created_at) -
          new Date(a.created_at)
      );
    }, [notificaciones]);


  // ==========================================
  // CERRAR AL HACER CLICK FUERA
  // ==========================================

  useEffect(() => {
    const manejarClickExterior = (
      evento
    ) => {
      if (
        notificacionesRef.current &&
        !notificacionesRef.current.contains(
          evento.target
        )
      ) {
        setMostrarNotificaciones(false);
      }

      if (
        perfilRef.current &&
        !perfilRef.current.contains(
          evento.target
        )
      ) {
        setMostrarPerfil(false);
      }
    };

    document.addEventListener(
      "mousedown",
      manejarClickExterior
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        manejarClickExterior
      );
    };
  }, []);


  // ==========================================
  // ABRIR NOTIFICACIONES
  // ==========================================

  const alternarNotificaciones =
    async () => {
      const seAbrira =
        !mostrarNotificaciones;

      setMostrarNotificaciones(
        seAbrira
      );

      setMostrarPerfil(false);

      /*
        Al abrir la campana podemos
        solicitar una actualización.
      */

      if (
        seAbrira &&
        onRecargarNotificaciones
      ) {
        await onRecargarNotificaciones();
      }
    };


  // ==========================================
  // ABRIR PERFIL
  // ==========================================

  const alternarPerfil = () => {
    setMostrarPerfil(
      (anterior) => !anterior
    );

    setMostrarNotificaciones(false);
  };


  // ==========================================
  // SELECCIONAR NOTIFICACIÓN
  // ==========================================

  const seleccionarNotificacion =
    async (notificacion) => {
      try {
        if (
          !notificacion.is_read &&
          onNotificacionLeida
        ) {
          await onNotificacionLeida(
            notificacion
          );
        }

        setMostrarNotificaciones(false);

        /*
          Si la notificación pertenece
          a un producto, llevamos al
          usuario a Mi despensa.
        */

        if (
          notificacion.product_id &&
          onIrADespensa
        ) {
          onIrADespensa();
        }
      } catch (error) {
        console.error(
          "Error al abrir notificación:",
          error
        );
      }
    };


  // ==========================================
  // MARCAR TODAS COMO LEÍDAS
  // ==========================================

  const marcarTodas = async () => {
    if (
      !onMarcarTodasLeidas ||
      notificacionesNoLeidas === 0
    ) {
      return;
    }

    await onMarcarTodasLeidas();
  };


  // ==========================================
  // FORMATEAR FECHA
  // ==========================================

  const formatearFechaNotificacion = (
    fecha
  ) => {
    if (!fecha) {
      return "";
    }

    const fechaNotificacion =
      new Date(fecha);

    if (
      Number.isNaN(
        fechaNotificacion.getTime()
      )
    ) {
      return "";
    }

    return fechaNotificacion.toLocaleString(
      "es-MX",
      {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };


  // ==========================================
  // INDICADOR DEL SEMÁFORO
  // ==========================================

  const obtenerIndicador = (nivel) => {
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

      default:
        return "🔔";
    }
  };


  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <header className="topbar">
      {/* =====================================
          TÍTULO
      ====================================== */}

      <div className="topbar-title">
        <span className="topbar-section-label">
          DESPENSA ANTIDESPERDICIO
        </span>

        <h2>{titulo}</h2>

        <p>
          Organiza, aprovecha y reduce el
          desperdicio de alimentos.
        </p>
      </div>


      {/* =====================================
          ACCIONES
      ====================================== */}

      <div className="topbar-actions">

        {/* ===================================
            NOTIFICACIONES
        ==================================== */}

        <div
          className="topbar-dropdown-wrapper"
          ref={notificacionesRef}
        >
          <button
            type="button"
            className={
              mostrarNotificaciones
                ? "notification-button active"
                : "notification-button"
            }
            title="Notificaciones"
            aria-label="Notificaciones"
            aria-expanded={
              mostrarNotificaciones
            }
            onClick={
              alternarNotificaciones
            }
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>

            {notificacionesNoLeidas >
              0 && (
              <span className="notification-count">
                {notificacionesNoLeidas >
                99
                  ? "99+"
                  : notificacionesNoLeidas}
              </span>
            )}
          </button>


          {/* =================================
              PANEL
          ================================== */}

          <div
            className={
              mostrarNotificaciones
                ? "notification-panel open"
                : "notification-panel"
            }
          >
            <div className="notification-panel-header">
              <div>
                <span className="notification-panel-label">
                  CENTRO DE AVISOS
                </span>

                <h3>
                  Notificaciones
                </h3>
              </div>

              {notificacionesNoLeidas >
                0 && (
                <span className="notification-summary">
                  {notificacionesNoLeidas}{" "}
                  {notificacionesNoLeidas ===
                  1
                    ? "nueva"
                    : "nuevas"}
                </span>
              )}
            </div>


            {/* ===============================
                CONTENIDO
            ================================ */}

            <div className="notification-panel-content">

              {/* CARGANDO */}

              {cargandoNotificaciones && (
                <div className="notification-empty">
                  <div className="notification-empty-icon">
                    ⏳
                  </div>

                  <strong>
                    Actualizando avisos
                  </strong>

                  <p>
                    Estamos revisando el
                    estado de tus alimentos.
                  </p>
                </div>
              )}


              {/* VACÍO */}

              {!cargandoNotificaciones &&
                notificacionesOrdenadas
                  .length === 0 && (
                  <div className="notification-empty">
                    <div className="notification-empty-icon">
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                        <path d="M10 21h4" />
                      </svg>
                    </div>

                    <strong>
                      Todo está bajo control
                    </strong>

                    <p>
                      No tienes avisos de
                      caducidad pendientes.
                    </p>
                  </div>
                )}


              {/* NOTIFICACIONES */}

              {!cargandoNotificaciones &&
                notificacionesOrdenadas.map(
                  (notificacion) => (
                    <button
                      key={
                        notificacion.id
                      }
                      type="button"
                      className={
                        !notificacion.is_read
                          ? "notification-item unread"
                          : "notification-item"
                      }
                      onClick={() =>
                        seleccionarNotificacion(
                          notificacion
                        )
                      }
                    >
                      <span className="notification-level">
                        {obtenerIndicador(
                          notificacion.expiration_level
                        )}
                      </span>

                      <span className="notification-item-content">
                        <strong>
                          {
                            notificacion.title
                          }
                        </strong>

                        <span>
                          {
                            notificacion.message
                          }
                        </span>

                        <small>
                          {formatearFechaNotificacion(
                            notificacion.created_at
                          )}
                        </small>
                      </span>

                      {!notificacion.is_read && (
                        <span
                          className="notification-unread-dot"
                          aria-label="No leída"
                        />
                      )}
                    </button>
                  )
                )}
            </div>


            {/* ===============================
                PIE
            ================================ */}

            {!cargandoNotificaciones &&
              notificaciones.length >
                0 && (
                <div className="notification-panel-footer">
                  {notificacionesNoLeidas >
                  0 ? (
                    <button
                      type="button"
                      className="notification-read-all-button"
                      onClick={
                        marcarTodas
                      }
                    >
                      ✓ Marcar todas como
                      leídas
                    </button>
                  ) : (
                    <span>
                      No tienes notificaciones
                      pendientes
                    </span>
                  )}
                </div>
              )}
          </div>
        </div>


        {/* ===================================
            DIVISOR
        ==================================== */}

        <div className="topbar-divider" />


        {/* ===================================
            PERFIL
        ==================================== */}

        <div
          className="topbar-dropdown-wrapper"
          ref={perfilRef}
        >
          <button
            type="button"
            className={
              mostrarPerfil
                ? "topbar-user active"
                : "topbar-user"
            }
            onClick={alternarPerfil}
            aria-expanded={mostrarPerfil}
          >
            <div className="user-avatar">
              {obtenerIniciales()}
            </div>

            <div className="user-information">
              <strong>
                {usuario?.name ||
                  "Usuario"}
              </strong>

              <span>
                {usuario?.email ||
                  "Mi cuenta"}
              </span>
            </div>

            <svg
              className={
                mostrarPerfil
                  ? "user-chevron open"
                  : "user-chevron"
              }
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="m7 10 5 5 5-5" />
            </svg>
          </button>


          {/* =================================
              MENÚ PERFIL
          ================================== */}

          <div
            className={
              mostrarPerfil
                ? "profile-menu open"
                : "profile-menu"
            }
          >
            <div className="profile-menu-header">
              <div className="profile-menu-avatar">
                {obtenerIniciales()}
              </div>

              <div>
                <strong>
                  {usuario?.name ||
                    "Usuario"}
                </strong>

                <span>
                  {usuario?.email ||
                    ""}
                </span>
              </div>
            </div>

            <div className="profile-menu-divider" />


            {/* MI PERFIL */}

            <button
              type="button"
              className="profile-menu-item"
              onClick={() => {
                setMostrarPerfil(false);

                if (onIrAPerfil) {
                  onIrAPerfil();
                }
              }}
            >
              <span className="profile-menu-icon">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="8"
                    r="4"
                  />

                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
              </span>

              <span>
                <strong>
                  Mi perfil
                </strong>

                <small>
                  Información de tu cuenta
                </small>
              </span>

              <span className="profile-menu-arrow">
                ›
              </span>
            </button>


            {/* AJUSTES */}

            <button
              type="button"
              className="profile-menu-item"
              onClick={() => {
                setMostrarPerfil(false);

                if (onIrAAjustes) {
                  onIrAAjustes();
                }
              }}
            >
              <span className="profile-menu-icon">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                  />

                  <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1a1.7 1.7 0 0 0 1.1 1.6 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.14.36.35.68.6 1 .3.28.69.42 1.1.4h.1v4h-.1a1.7 1.7 0 0 0-1.7.6Z" />
                </svg>
              </span>

              <span>
                <strong>
                  Ajustes
                </strong>

                <small>
                  Notificaciones y preferencias
                </small>
              </span>

              <span className="profile-menu-arrow">
                ›
              </span>
            </button>


            <div className="profile-menu-divider" />


            {/* CERRAR SESIÓN */}

            <button
              type="button"
              className="profile-menu-item logout"
              onClick={onLogout}
            >
              <span className="profile-menu-icon">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M10 17l5-5-5-5" />
                  <path d="M15 12H3" />
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                </svg>
              </span>

              <span>
                <strong>
                  Cerrar sesión
                </strong>

                <small>
                  Salir de tu cuenta
                </small>
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;