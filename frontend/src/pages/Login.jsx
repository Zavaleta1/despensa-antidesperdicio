
import { useState } from "react";
import { iniciarSesion } from "../services/authService";
import "../styles/auth.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

function Login({ onLogin, onIrARegistro }) {
  const [formulario, setFormulario] = useState({
    email: "",
    password: "",
  });

  const [procesando, setProcesando] = useState(false);
  const [recuperando, setRecuperando] = useState(false);
  const [error, setError] = useState("");
  const [mensajeRecuperacion, setMensajeRecuperacion] =
    useState("");
  const [mostrarPassword, setMostrarPassword] =
    useState(false);

  // ==========================================
  // CAMBIAR CAMPOS
  // ==========================================

  const cambiarCampo = (evento) => {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));

    setError("");
    setMensajeRecuperacion("");
  };

  // ==========================================
  // INICIAR SESIÓN
  // ==========================================

  const enviarFormulario = async (evento) => {
    evento.preventDefault();

    if (procesando || recuperando) {
      return;
    }

    setProcesando(true);
    setError("");
    setMensajeRecuperacion("");

    try {
      const datos = await iniciarSesion(formulario);
      onLogin(datos);
    } catch (error) {
      console.error(
        "Error al iniciar sesión:",
        error
      );

      setError(
        error.message ||
          "No se pudo iniciar sesión."
      );
    } finally {
      setProcesando(false);
    }
  };

  // ==========================================
  // PASO 96.8 - RECUPERAR CONTRASEÑA
  // ==========================================

  const recuperarPassword = async () => {
    if (procesando || recuperando) {
      return;
    }

    setError("");
    setMensajeRecuperacion("");

    const email = formulario.email.trim().toLowerCase();

    if (!email) {
      setError(
        "Primero introduce tu correo electrónico para recibir el enlace de recuperación."
      );
      return;
    }

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      setError(
        "Introduce un correo electrónico válido."
      );
      return;
    }

    setRecuperando(true);

    try {
      const respuesta = await fetch(
        `${API_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      if (!respuesta.ok) {
        throw new Error(
          "No se pudo procesar la solicitud. Inténtalo más tarde."
        );
      }

      setMensajeRecuperacion(
        "Si el correo está registrado, recibirás un enlace para recuperar tu contraseña. Revisa tu bandeja de entrada y la carpeta de spam."
      );
    } catch (error) {
      console.error(
        "Error al solicitar recuperación:",
        error
      );

      setError(
        "No se pudo solicitar la recuperación en este momento. Inténtalo más tarde."
      );
    } finally {
      setRecuperando(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        {/* ======================================
            PANEL INFORMATIVO
        ======================================= */}

        <section className="auth-visual-panel">
          <div className="auth-visual-decoration auth-decoration-one" />
          <div className="auth-visual-decoration auth-decoration-two" />

          <div className="auth-brand">
            <div className="auth-brand-icon">
              🥫
            </div>

            <div>
              <strong>Despensa</strong>
              <span>Antidesperdicio</span>
            </div>
          </div>

          <div className="auth-visual-content">
            <span className="auth-eyebrow">
              CONSUME MEJOR · DESPERDICIA MENOS
            </span>

            <h1>
              Aprovecha más de
              <span> cada alimento.</span>
            </h1>

            <p>
              Organiza tu despensa, controla las
              fechas de caducidad y descubre qué
              alimentos debes consumir primero.
            </p>

            <div className="auth-semaphore-card">
              <div className="auth-semaphore-header">
                <div className="auth-semaphore-icon">
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                </div>

                <div>
                  <strong>
                    Tu despensa te avisa
                  </strong>

                  <span>
                    Consume primero lo que más lo
                    necesita
                  </span>
                </div>
              </div>

              <div className="auth-semaphore-list">
                <div className="auth-semaphore-item">
                  <span className="auth-dot red" />

                  <div>
                    <strong>Prioridad alta</strong>
                    <span>
                      Consume cuanto antes
                    </span>
                  </div>
                </div>

                <div className="auth-semaphore-item">
                  <span className="auth-dot orange" />

                  <div>
                    <strong>Próximo</strong>
                    <span>
                      Planea utilizarlo pronto
                    </span>
                  </div>
                </div>

                <div className="auth-semaphore-item">
                  <span className="auth-dot yellow" />

                  <div>
                    <strong>Atención</strong>
                    <span>
                      Manténlo en seguimiento
                    </span>
                  </div>
                </div>

                <div className="auth-semaphore-item">
                  <span className="auth-dot green" />

                  <div>
                    <strong>Vigente</strong>
                    <span>
                      Aún tienes tiempo
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-visual-footer">
            <span>
              🌱 Pequeñas decisiones, menos
              desperdicio.
            </span>
          </div>
        </section>

        {/* ======================================
            PANEL DE LOGIN
        ======================================= */}

        <main className="auth-form-panel">
          {/* MARCA PARA MÓVIL */}

          <div className="auth-mobile-brand">
            <div className="auth-brand-icon">
              🥫
            </div>

            <div>
              <strong>Despensa</strong>
              <span>Antidesperdicio</span>
            </div>
          </div>

          <div className="auth-form-content">
            <div className="auth-form-heading">
              <span className="auth-form-eyebrow">
                BIENVENIDO
              </span>

              <h2>
                Bienvenido de nuevo
              </h2>

              <p>
                Ingresa tus datos para acceder a
                tu despensa.
              </p>
            </div>

            <form
              className="auth-form"
              onSubmit={enviarFormulario}
            >
              {/* CORREO */}

              <div className="auth-field">
                <label htmlFor="email">
                  Correo electrónico
                </label>

                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
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
                  </span>

                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formulario.email}
                    onChange={cambiarCampo}
                    placeholder="correo@ejemplo.com"
                    autoComplete="email"
                    disabled={procesando || recuperando}
                    required
                  />
                </div>
              </div>

              {/* CONTRASEÑA */}

              <div className="auth-field">
                <label htmlFor="password">
                  Contraseña
                </label>

                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <rect
                        x="5"
                        y="10"
                        width="14"
                        height="11"
                        rx="2"
                      />

                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                    </svg>
                  </span>

                  <input
                    id="password"
                    type={
                      mostrarPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    value={formulario.password}
                    onChange={cambiarCampo}
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                    disabled={procesando || recuperando}
                    required
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() =>
                      setMostrarPassword(
                        (actual) => !actual
                      )
                    }
                    aria-label={
                      mostrarPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    title={
                      mostrarPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                  >
                    {mostrarPassword ? (
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="m3 3 18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9 5 9 5a15.7 15.7 0 0 1-2.1 2.7" />
                        <path d="M6.6 6.6C4.4 8 3 10 3 10s3.5 5 9 5a9.7 9.7 0 0 0 3-.5" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z" />

                        <circle
                          cx="12"
                          cy="12"
                          r="2.5"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* PASO 96.8 - RECUPERACIÓN */}

              <div className="auth-forgot-area">
                <button
                  type="button"
                  className="auth-forgot-button"
                  onClick={recuperarPassword}
                  disabled={procesando || recuperando}
                >
                  {recuperando
                    ? "Enviando instrucciones..."
                    : "¿Olvidaste tu contraseña?"}
                </button>
              </div>

              {/* MENSAJE DE RECUPERACIÓN */}

              {mensajeRecuperacion && (
                <div
                  className="auth-recovery-success"
                  role="status"
                >
                  <span aria-hidden="true">✓</span>

                  <p>
                    {mensajeRecuperacion}
                  </p>
                </div>
              )}

              {/* ERROR */}

              {error && (
                <div
                  className="auth-error"
                  role="alert"
                >
                  <span className="auth-error-icon">
                    !
                  </span>

                  <div>
                    <strong>
                      No pudimos completar la solicitud
                    </strong>

                    <span>
                      {error}
                    </span>
                  </div>
                </div>
              )}

              {/* BOTÓN */}

              <button
                className="auth-primary-button"
                type="submit"
                disabled={procesando || recuperando}
              >
                {procesando ? (
                  <>
                    <span className="auth-spinner" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <span>
                      Iniciar sesión
                    </span>

                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14" />
                      <path d="m14 7 5 5-5 5" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* ==================================
                REGISTRO
            =================================== */}

            <div className="auth-divider">
              <span />
              <p>¿Eres nuevo?</p>
              <span />
            </div>

            <div className="auth-register-area">
              <p>
                Crea tu cuenta y comienza a
                organizar tus alimentos.
              </p>

              <button
                type="button"
                className="auth-secondary-button"
                onClick={onIrARegistro}
                disabled={procesando || recuperando}
              >
                Crear una cuenta
              </button>
            </div>
          </div>

          <div className="auth-form-footer">
            <span>
              Despensa Antidesperdicio
            </span>

            <span className="auth-footer-dot">
              •
            </span>

            <span>
              Consume con conciencia
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Login;
