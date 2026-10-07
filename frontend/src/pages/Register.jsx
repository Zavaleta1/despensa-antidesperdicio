import { useState } from "react";
import { registrarUsuario } from "../services/authService";
import "../styles/auth.css";

function Register({ onRegistroExitoso, onIrALogin }) {
  const [formulario, setFormulario] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  const cambiarCampo = (evento) => {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  };

  const enviarFormulario = async (evento) => {
    evento.preventDefault();

    setProcesando(true);
    setError("");

    try {
      await registrarUsuario(formulario);

      onRegistroExitoso();
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      setError(error.message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🥫</div>

        <h1>Despensa Antidesperdicio</h1>

        <p className="auth-description">
          Crea tu cuenta para administrar tu propia despensa
        </p>

        <h2>Crear cuenta</h2>

        <form onSubmit={enviarFormulario}>
          <div className="auth-field">
            <label htmlFor="name">
              Nombre
            </label>

            <input
              id="name"
              type="text"
              name="name"
              value={formulario.name}
              onChange={cambiarCampo}
              placeholder="Tu nombre"
              autoComplete="name"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="email">
              Correo electrónico
            </label>

            <input
              id="email"
              type="email"
              name="email"
              value={formulario.email}
              onChange={cambiarCampo}
              placeholder="correo@ejemplo.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">
              Contraseña
            </label>

            <input
              id="password"
              type="password"
              name="password"
              value={formulario.password}
              onChange={cambiarCampo}
              placeholder="Mínimo 6 caracteres"
              minLength="6"
              autoComplete="new-password"
              required
            />
          </div>

          {error && (
            <div className="auth-error">
              ❌ {error}
            </div>
          )}

          <button
            className="auth-primary-button"
            type="submit"
            disabled={procesando}
          >
            {procesando
              ? "Creando cuenta..."
              : "Crear cuenta"}
          </button>
        </form>

        <p className="auth-change">
          ¿Ya tienes una cuenta?{" "}
          <button
            type="button"
            className="auth-link"
            onClick={onIrALogin}
          >
            Iniciar sesión
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;