
import { useState } from "react";
import "../styles/resetPassword.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

function ResetPassword({ onVolverLogin }) {
  const [token] = useState(() => {
    const parametros = new URLSearchParams(
      window.location.search
    );

    return parametros.get("token") || "";
  });

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [mostrarPassword, setMostrarPassword] =
    useState(false);

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  const tokenValido = /^[a-f0-9]{64}$/i.test(token);

  const manejarSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!tokenValido) {
      setError("El enlace de recuperación no es válido.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Completa ambos campos.");
      return;
    }

    if (
      password.length < 8 ||
      new TextEncoder().encode(password).length > 72
    ) {
      setError(
        "La contraseña debe tener al menos 8 caracteres y no superar 72 bytes."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);

    try {
      const respuesta = await fetch(
        `${API_URL}/api/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password,
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.message ||
          "No se pudo restablecer la contraseña."
        );
      }

      setExito(true);
      setPassword("");
      setConfirmPassword("");

      // Retirar el token de la barra de direcciones.
      window.history.replaceState(
        {},
        "",
        "/reset-password"
      );
    } catch (error) {
      setError(
        error.message ||
        "Ocurrió un error al restablecer la contraseña."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="reset-password-page">
      <section className="reset-password-card">
        <div className="reset-password-logo">
          🌿
        </div>

        <h1>Despensa Antidesperdicio</h1>

        <p className="reset-password-subtitle">
          Recuperación de contraseña
        </p>

        {exito ? (
          <div
            className="reset-password-success"
            role="status"
          >
            <div className="reset-password-icon">
              ✓
            </div>

            <h2>¡Contraseña actualizada!</h2>

            <p>
              Tu contraseña se restableció
              correctamente. Ya puedes iniciar
              sesión con tu nueva contraseña.
            </p>

            <button
              type="button"
              className="reset-password-button"
              onClick={onVolverLogin}
            >
              Ir a iniciar sesión
            </button>
          </div>
        ) : !tokenValido ? (
          <div className="reset-password-invalid">
            <h2>Enlace no válido</h2>

            <p>
              El enlace está incompleto o no
              tiene un formato válido. Solicita
              un nuevo correo de recuperación.
            </p>

            <button
              type="button"
              className="reset-password-button"
              onClick={onVolverLogin}
            >
              Volver al inicio de sesión
            </button>
          </div>
        ) : (
          <>
            <h2>Crear nueva contraseña</h2>

            <p className="reset-password-description">
              Introduce una nueva contraseña
              para recuperar tu cuenta.
            </p>

            <form onSubmit={manejarSubmit}>
              <div className="reset-password-field">
                <label htmlFor="password">
                  Nueva contraseña
                </label>

                <input
                  id="password"
                  type={
                    mostrarPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={cargando}
                />
              </div>

              <div className="reset-password-field">
                <label htmlFor="confirmPassword">
                  Confirmar contraseña
                </label>

                <input
                  id="confirmPassword"
                  type={
                    mostrarPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                  required
                  disabled={cargando}
                />
              </div>

              <label className="reset-password-show">
                <input
                  type="checkbox"
                  checked={mostrarPassword}
                  onChange={(event) =>
                    setMostrarPassword(
                      event.target.checked
                    )
                  }
                  disabled={cargando}
                />
                Mostrar contraseñas
              </label>

              {error && (
                <div
                  className="reset-password-error"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="reset-password-button"
                disabled={cargando}
              >
                {cargando
                  ? "Actualizando contraseña..."
                  : "Restablecer contraseña"}
              </button>
            </form>

            <p className="reset-password-footer">
              El enlace caduca en 30 minutos
              y solo puede utilizarse una vez.
            </p>
          </>
        )}
      </section>
    </main>
  );
}

export default ResetPassword;
