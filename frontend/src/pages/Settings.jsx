import {
  useEffect,
  useState,
} from "react";

import AppLayout from "../components/layout/AppLayout";

import {
  obtenerPreferenciasNotificacion,
  actualizarPreferenciasNotificacion,
} from "../services/notificationPreferenceService";

import "../styles/settings.css";


function Settings({
  usuario,
  token,
  onLogout,
  onCambiarPagina,

  notificaciones = [],
  cargandoNotificaciones = false,
  onRecargarNotificaciones,
  onNotificacionLeida,
  onMarcarTodasLeidas,
}) {
  // ==========================================
  // ESTADOS
  // ==========================================

  const [
    preferencias,
    setPreferencias,
  ] = useState(null);

  const [
    preferenciasOriginales,
    setPreferenciasOriginales,
  ] = useState(null);

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [error, setError] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");


  // ==========================================
  // CARGAR PREFERENCIAS
  // ==========================================

  useEffect(() => {
    const cargarPreferencias =
      async () => {
        try {
          setCargando(true);
          setError("");

          const datos =
            await obtenerPreferenciasNotificacion(
              token
            );

          setPreferencias(datos);

          setPreferenciasOriginales(
            datos
          );
        } catch (error) {
          console.error(
            "Error al cargar preferencias:",
            error
          );

          if (error.status === 401) {
            onLogout();
            return;
          }

          setError(
            error.message ||
              "No se pudieron cargar tus preferencias."
          );
        } finally {
          setCargando(false);
        }
      };

    cargarPreferencias();
  }, [token, onLogout]);


  // ==========================================
  // CAMBIAR INTERRUPTOR
  // ==========================================

  const cambiarPreferencia = (
    campo
  ) => {
    setPreferencias((anteriores) => ({
      ...anteriores,
      [campo]: !anteriores[campo],
    }));

    setMensaje("");
  };


  // ==========================================
  // DETECTAR CAMBIOS
  // ==========================================

  const hayCambios =
    preferencias &&
    preferenciasOriginales &&
    [
      "in_app_enabled",
      "email_enabled",
      "notify_expired",
      "notify_critical",
      "notify_upcoming",
      "notify_attention",
      "notify_current",
    ].some(
      (campo) =>
        preferencias[campo] !==
        preferenciasOriginales[campo]
    );


  // ==========================================
  // GUARDAR
  // ==========================================

  const guardarPreferencias =
    async () => {
      if (
        !preferencias ||
        guardando ||
        !hayCambios
      ) {
        return;
      }

      try {
        setGuardando(true);
        setError("");
        setMensaje("");

        const datosGuardar = {
          in_app_enabled:
            preferencias.in_app_enabled,

          email_enabled:
            preferencias.email_enabled,

          notify_expired:
            preferencias.notify_expired,

          notify_critical:
            preferencias.notify_critical,

          notify_upcoming:
            preferencias.notify_upcoming,

          notify_attention:
            preferencias.notify_attention,

          notify_current:
            preferencias.notify_current,
        };


        const respuesta =
          await actualizarPreferenciasNotificacion(
            datosGuardar,
            token
          );


        const actualizadas =
          respuesta.preferencias;


        setPreferencias(
          actualizadas
        );

        setPreferenciasOriginales(
          actualizadas
        );

        setMensaje(
          "Tus preferencias se guardaron correctamente."
        );


        /*
          Las preferencias pueden afectar
          los avisos que aparecen en la
          aplicación, por lo que recargamos
          la campana.
        */

        if (
          onRecargarNotificaciones
        ) {
          await onRecargarNotificaciones();
        }
      } catch (error) {
        console.error(
          "Error al guardar preferencias:",
          error
        );

        if (error.status === 401) {
          onLogout();
          return;
        }

        setError(
          error.message ||
            "No se pudieron guardar los cambios."
        );
      } finally {
        setGuardando(false);
      }
    };


  // ==========================================
  // CANCELAR CAMBIOS
  // ==========================================

  const cancelarCambios = () => {
    if (!preferenciasOriginales) {
      return;
    }

    setPreferencias({
      ...preferenciasOriginales,
    });

    setMensaje("");
    setError("");
  };


  // ==========================================
  // COMPONENTE INTERRUPTOR
  // ==========================================

  const Interruptor = ({
    activo,
    onClick,
    ariaLabel,
    disabled = false,
  }) => (
    <button
      type="button"
      className={
        activo
          ? "settings-switch active"
          : "settings-switch"
      }
      role="switch"
      aria-checked={activo}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
    >
      <span />
    </button>
  );


  // ==========================================
  // RENDER
  // ==========================================

  return (
    <AppLayout
      usuario={usuario}
      paginaActual="settings"
      titulo="Ajustes"

      onCambiarPagina={
        onCambiarPagina
      }

      onLogout={onLogout}

      notificaciones={
        notificaciones
      }

      cargandoNotificaciones={
        cargandoNotificaciones
      }

      onRecargarNotificaciones={
        onRecargarNotificaciones
      }

      onNotificacionLeida={
        onNotificacionLeida
      }

      onMarcarTodasLeidas={
        onMarcarTodasLeidas
      }
    >
      <section className="settings-heading">
        <div>
          <span className="settings-eyebrow">
            PREFERENCIAS
          </span>

          <h1>
            Configura tu{" "}
            <span>experiencia.</span>
          </h1>

          <p>
            Decide cómo y cuándo quieres
            recibir avisos sobre los
            alimentos de tu despensa.
          </p>
        </div>
      </section>


      {/* =====================================
          CARGANDO
      ====================================== */}

      {cargando && (
        <div className="settings-state">
          <div className="settings-loader" />

          <h3>
            Cargando tus preferencias
          </h3>

          <p>
            Estamos preparando tu
            configuración.
          </p>
        </div>
      )}


      {/* =====================================
          ERROR DE CARGA
      ====================================== */}

      {!cargando &&
        error &&
        !preferencias && (
          <div className="settings-state error">
            <div className="settings-state-icon">
              !
            </div>

            <h3>
              No pudimos cargar los ajustes
            </h3>

            <p>{error}</p>
          </div>
        )}


      {/* =====================================
          CONFIGURACIÓN
      ====================================== */}

      {!cargando && preferencias && (
        <div className="settings-content">

          {/* =================================
              CANALES
          ================================== */}

          <section className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  <path d="M10 21h4" />
                </svg>
              </div>

              <div>
                <span>
                  NOTIFICACIONES
                </span>

                <h2>
                  Cómo quieres recibir avisos
                </h2>

                <p>
                  Elige los canales que
                  utilizaremos para avisarte.
                </p>
              </div>
            </div>


            <div className="settings-options">

              {/* APP */}

              <div className="settings-option">
                <div className="settings-option-main">
                  <div className="settings-option-icon app">
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                      <path d="M10 21h4" />
                    </svg>
                  </div>

                  <div>
                    <strong>
                      Notificaciones en la
                      aplicación
                    </strong>

                    <p>
                      Muestra avisos de
                      caducidad dentro de
                      Despensa
                      Antidesperdicio.
                    </p>
                  </div>
                </div>

                <Interruptor
                  activo={
                    preferencias.in_app_enabled
                  }
                  ariaLabel="Notificaciones en la aplicación"
                  onClick={() =>
                    cambiarPreferencia(
                      "in_app_enabled"
                    )
                  }
                />
              </div>


              {/* EMAIL */}

              <div className="settings-option">
                <div className="settings-option-main">
                  <div className="settings-option-icon email">
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="2"
                      />

                      <path d="m3 7 9 6 9-6" />
                    </svg>
                  </div>

                  <div>
                    <strong>
                      Notificaciones por correo
                    </strong>

                    <p>
                      Recibe avisos en{" "}
                      <span className="settings-email">
                        {usuario?.email ||
                          "tu correo electrónico"}
                      </span>
                    </p>
                  </div>
                </div>

                <Interruptor
                  activo={
                    preferencias.email_enabled
                  }
                  ariaLabel="Notificaciones por correo electrónico"
                  onClick={() =>
                    cambiarPreferencia(
                      "email_enabled"
                    )
                  }
                />
              </div>
            </div>
          </section>


          {/* =================================
              NIVELES DEL SEMÁFORO
          ================================== */}

          <section className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon traffic">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <rect
                    x="7"
                    y="2"
                    width="10"
                    height="20"
                    rx="3"
                  />

                  <circle
                    cx="12"
                    cy="7"
                    r="1.5"
                  />

                  <circle
                    cx="12"
                    cy="12"
                    r="1.5"
                  />

                  <circle
                    cx="12"
                    cy="17"
                    r="1.5"
                  />
                </svg>
              </div>

              <div>
                <span>
                  SEMÁFORO DE CADUCIDAD
                </span>

                <h2>
                  ¿Sobre qué alimentos quieres
                  avisos?
                </h2>

                <p>
                  Personaliza los estados que
                  consideras importantes.
                </p>
              </div>
            </div>


            <div className="settings-levels">

              {/* CADUCADOS */}

              <div className="settings-level">
                <div className="settings-level-information">
                  <span className="settings-level-dot expired" />

                  <div>
                    <strong>
                      Alimentos caducados
                    </strong>

                    <p>
                      La fecha de caducidad ya
                      pasó.
                    </p>
                  </div>
                </div>

                <Interruptor
                  activo={
                    preferencias.notify_expired
                  }
                  ariaLabel="Avisos de alimentos caducados"
                  onClick={() =>
                    cambiarPreferencia(
                      "notify_expired"
                    )
                  }
                />
              </div>


              {/* CRÍTICOS */}

              <div className="settings-level">
                <div className="settings-level-information">
                  <span className="settings-level-dot critical" />

                  <div>
                    <strong>
                      Estado crítico
                    </strong>

                    <p>
                      Caduca entre hoy y los
                      próximos 3 días.
                    </p>
                  </div>
                </div>

                <Interruptor
                  activo={
                    preferencias.notify_critical
                  }
                  ariaLabel="Avisos críticos"
                  onClick={() =>
                    cambiarPreferencia(
                      "notify_critical"
                    )
                  }
                />
              </div>


              {/* PRÓXIMOS */}

              <div className="settings-level">
                <div className="settings-level-information">
                  <span className="settings-level-dot upcoming" />

                  <div>
                    <strong>
                      Próximos a caducar
                    </strong>

                    <p>
                      Caducan dentro de 4 a 7
                      días.
                    </p>
                  </div>
                </div>

                <Interruptor
                  activo={
                    preferencias.notify_upcoming
                  }
                  ariaLabel="Avisos próximos a caducar"
                  onClick={() =>
                    cambiarPreferencia(
                      "notify_upcoming"
                    )
                  }
                />
              </div>


              {/* ATENCIÓN */}

              <div className="settings-level">
                <div className="settings-level-information">
                  <span className="settings-level-dot attention" />

                  <div>
                    <strong>
                      Atención
                    </strong>

                    <p>
                      Caducan dentro de 8 a 14
                      días.
                    </p>
                  </div>
                </div>

                <Interruptor
                  activo={
                    preferencias.notify_attention
                  }
                  ariaLabel="Avisos de atención"
                  onClick={() =>
                    cambiarPreferencia(
                      "notify_attention"
                    )
                  }
                />
              </div>


              {/* VIGENTES */}

              <div className="settings-level">
                <div className="settings-level-information">
                  <span className="settings-level-dot current" />

                  <div>
                    <strong>
                      Alimentos vigentes
                    </strong>

                    <p>
                      Tienen más de 14 días
                      antes de caducar.
                    </p>
                  </div>
                </div>

                <Interruptor
                  activo={
                    preferencias.notify_current
                  }
                  ariaLabel="Avisos de alimentos vigentes"
                  onClick={() =>
                    cambiarPreferencia(
                      "notify_current"
                    )
                  }
                />
              </div>
            </div>
          </section>


          {/* =================================
              MENSAJES
          ================================== */}

          {error && (
            <div className="settings-message error">
              <span>!</span>

              {error}
            </div>
          )}

          {mensaje && (
            <div className="settings-message success">
              <span>✓</span>

              {mensaje}
            </div>
          )}


          {/* =================================
              GUARDAR
          ================================== */}

          <div className="settings-actions">
            <div className="settings-change-information">
              {hayCambios ? (
                <>
                  <span className="unsaved-dot" />

                  Tienes cambios sin guardar
                </>
              ) : (
                <>
                  <span className="saved-check">
                    ✓
                  </span>

                  Tus preferencias están
                  actualizadas
                </>
              )}
            </div>

            <div className="settings-action-buttons">
              {hayCambios && (
                <button
                  type="button"
                  className="settings-secondary-button"
                  onClick={
                    cancelarCambios
                  }
                  disabled={guardando}
                >
                  Cancelar
                </button>
              )}

              <button
                type="button"
                className="settings-save-button"
                onClick={
                  guardarPreferencias
                }
                disabled={
                  guardando ||
                  !hayCambios
                }
              >
                {guardando ? (
                  <>
                    <span className="button-loader" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M5 3h12l2 2v16H5Z" />
                      <path d="M8 3v6h8V3" />
                      <path d="M8 21v-7h8v7" />
                    </svg>

                    Guardar cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default Settings;