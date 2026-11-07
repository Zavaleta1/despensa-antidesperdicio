import { useEffect, useRef, useState } from "react";
import AppLayout from "../components/layout/AppLayout";

import {
  obtenerPerfil,
  actualizarPerfil,
  cambiarContrasena,
  obtenerFotoPerfil,
  subirFotoPerfil,
  eliminarFotoPerfil,
} from "../services/profileService";

import "../styles/profile.css";

const TAMANO_MAXIMO = 2 * 1024 * 1024;

const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

function Profile({
  usuario,
  token,
  fotoPerfilUrl,
  onActualizarFotoPerfil,
  onActualizarUsuario,
  onLogout,
  onCambiarPagina,

  notificaciones = [],
  cargandoNotificaciones = false,
  onRecargarNotificaciones,
  onNotificacionLeida,
  onMarcarTodasLeidas,
}) {
  const [perfil, setPerfil] = useState(null);
  const [nombre, setNombre] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardandoNombre, setGuardandoNombre] =
    useState(false);

  const [contrasenaActual, setContrasenaActual] =
    useState("");
  const [contrasenaNueva, setContrasenaNueva] =
    useState("");
  const [confirmarContrasena, setConfirmarContrasena] =
    useState("");

  const [guardandoContrasena, setGuardandoContrasena] =
    useState(false);

  const [errorPerfil, setErrorPerfil] = useState("");
  const [mensajePerfil, setMensajePerfil] = useState("");

  const [errorContrasena, setErrorContrasena] =
    useState("");
  const [mensajeContrasena, setMensajeContrasena] =
    useState("");

  // ==========================================
  // ESTADOS PARA FOTOGRAFÍA
  // ==========================================

  const [archivoFoto, setArchivoFoto] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState(null);

  const [guardandoFoto, setGuardandoFoto] = useState(false);
  const [eliminandoFoto, setEliminandoFoto] = useState(false);

  const [errorFoto, setErrorFoto] = useState("");
  const [mensajeFoto, setMensajeFoto] = useState("");

  const inputFotoRef = useRef(null);
  const [imagenConError, setImagenConError] = useState(false);
  const fotoUrl = fotoPerfilUrl || null;

  useEffect(() => {
    setImagenConError(false);
  }, [fotoUrl]);

  // ==========================================
  // CARGAR PERFIL
  // ==========================================

  useEffect(() => {
    let activo = true;

    async function cargarPerfil() {
      try {
        setCargando(true);
        setErrorPerfil("");

        const respuesta = await obtenerPerfil(token);

        if (!activo) return;

        setPerfil(respuesta.user);
        setNombre(respuesta.user.name);
      } catch (error) {
        if (!activo) return;

        if (error.status === 401) {
          onLogout();
          return;
        }

        setErrorPerfil(
          error.message ||
            "No se pudo cargar tu perfil."
        );
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarPerfil();

    return () => {
      activo = false;
    };
  }, [token, onLogout]);

  // ==========================================
  // LIBERAR VISTA PREVIA
  // ==========================================

  useEffect(() => {
    return () => {
      if (vistaPrevia) {
        URL.revokeObjectURL(vistaPrevia);
      }
    };
  }, [vistaPrevia]);

  // ==========================================
  // SELECCIONAR FOTOGRAFÍA
  // ==========================================

  function seleccionarFoto(event) {
    const archivo = event.target.files?.[0];

    if (!archivo) return;

    setErrorFoto("");
    setMensajeFoto("");

    if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
      setErrorFoto(
        "Selecciona una imagen JPG, PNG o WEBP."
      );

      event.target.value = "";
      return;
    }

    if (archivo.size > TAMANO_MAXIMO) {
      setErrorFoto(
        "La fotografía no debe superar los 2 MB."
      );

      event.target.value = "";
      return;
    }

    setArchivoFoto(archivo);
    setVistaPrevia(URL.createObjectURL(archivo));
  }

  // ==========================================
  // CANCELAR SELECCIÓN
  // ==========================================

  function cancelarSeleccionFoto() {
    setArchivoFoto(null);
    setVistaPrevia(null);
    setErrorFoto("");

    if (inputFotoRef.current) {
      inputFotoRef.current.value = "";
    }
  }

  // ==========================================
  // GUARDAR FOTOGRAFÍA
  // ==========================================

  async function guardarFoto() {
    if (!archivoFoto || guardandoFoto) return;

    try {
      setGuardandoFoto(true);
      setErrorFoto("");
      setMensajeFoto("");

      const respuesta = await subirFotoPerfil(
        archivoFoto,
        token
      );

      // La URL es temporal porque el bucket es privado.
      // Si el backend no devuelve una URL,
      // consultamos nuevamente la fotografía.
      let nuevaUrl = respuesta.photoUrl;

      if (!nuevaUrl) {
        const fotoActualizada =
          await obtenerFotoPerfil(token);

        nuevaUrl = fotoActualizada.photoUrl;
      }

      if (onActualizarFotoPerfil) {
        onActualizarFotoPerfil(nuevaUrl || null);
      }

      cancelarSeleccionFoto();

      setMensajeFoto(
        respuesta.message ||
          "Fotografía actualizada correctamente."
      );
    } catch (error) {
      if (error.status === 401) {
        onLogout();
        return;
      }

      setErrorFoto(
        error.message ||
          "No se pudo guardar la fotografía."
      );
    } finally {
      setGuardandoFoto(false);
    }
  }

  // ==========================================
  // ELIMINAR FOTOGRAFÍA
  // ==========================================

  async function eliminarFoto() {
    if (eliminandoFoto || guardandoFoto) return;

    const confirmar = window.confirm(
      "¿Deseas eliminar tu fotografía de perfil?"
    );

    if (!confirmar) return;

    try {
      setEliminandoFoto(true);
      setErrorFoto("");
      setMensajeFoto("");

      const respuesta = await eliminarFotoPerfil(token);

      if (onActualizarFotoPerfil) {
        onActualizarFotoPerfil(null);
      }

      cancelarSeleccionFoto();

      setMensajeFoto(
        respuesta.message ||
          "Fotografía eliminada correctamente."
      );
    } catch (error) {
      if (error.status === 401) {
        onLogout();
        return;
      }

      setErrorFoto(
        error.message ||
          "No se pudo eliminar la fotografía."
      );
    } finally {
      setEliminandoFoto(false);
    }
  }

  // ==========================================
  // ACTUALIZAR NOMBRE
  // ==========================================

  async function guardarNombre(event) {
    event.preventDefault();

    const nombreLimpio = nombre.trim();

    if (
      nombreLimpio.length < 2 ||
      nombreLimpio.length > 100
    ) {
      setErrorPerfil(
        "El nombre debe tener entre 2 y 100 caracteres."
      );
      return;
    }

    if (nombreLimpio === perfil?.name) {
      return;
    }

    try {
      setGuardandoNombre(true);
      setErrorPerfil("");
      setMensajePerfil("");

      const respuesta = await actualizarPerfil(
        nombreLimpio,
        token
      );

      setPerfil(respuesta.user);
      setNombre(respuesta.user.name);

      if (onActualizarUsuario) {
        onActualizarUsuario(respuesta.user);
      }

      setMensajePerfil(
        "Tu nombre se actualizó correctamente."
      );
    } catch (error) {
      if (error.status === 401) {
        onLogout();
        return;
      }

      setErrorPerfil(
        error.message ||
          "No se pudo actualizar tu nombre."
      );
    } finally {
      setGuardandoNombre(false);
    }
  }

  // ==========================================
  // CAMBIAR CONTRASEÑA
  // ==========================================

  async function guardarContrasena(event) {
    event.preventDefault();

    setErrorContrasena("");
    setMensajeContrasena("");

    if (
      !contrasenaActual ||
      !contrasenaNueva ||
      !confirmarContrasena
    ) {
      setErrorContrasena(
        "Completa todos los campos."
      );
      return;
    }

    if (
      contrasenaNueva.length < 12 ||
      contrasenaNueva.length > 72
    ) {
      setErrorContrasena(
        "La nueva contraseña debe tener entre 12 y 72 caracteres."
      );
      return;
    }

    if (contrasenaNueva !== confirmarContrasena) {
      setErrorContrasena(
        "Las nuevas contraseñas no coinciden."
      );
      return;
    }

    if (contrasenaNueva === contrasenaActual) {
      setErrorContrasena(
        "La nueva contraseña debe ser diferente."
      );
      return;
    }

    try {
      setGuardandoContrasena(true);

      const respuesta = await cambiarContrasena(
        contrasenaActual,
        contrasenaNueva,
        token
      );

      setContrasenaActual("");
      setContrasenaNueva("");
      setConfirmarContrasena("");

      setMensajeContrasena(
        respuesta.message ||
          "Tu contraseña se actualizó correctamente."
      );
    } catch (error) {
      if (error.status === 401) {
        onLogout();
        return;
      }

      setErrorContrasena(
        error.message ||
          "No se pudo cambiar la contraseña."
      );
    } finally {
      setGuardandoContrasena(false);
    }
  }

  // ==========================================
  // INICIALES DEL USUARIO
  // ==========================================

  const iniciales = (
    perfil?.name ||
    usuario?.name ||
    "U"
  )
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra.charAt(0).toUpperCase())
    .join("");

  const imagenVisible = vistaPrevia || (!imagenConError ? fotoUrl : null);

  const procesandoFoto =
    guardandoFoto || eliminandoFoto;

  return (
    <AppLayout
      usuario={usuario}
      fotoPerfilUrl={fotoPerfilUrl}
      paginaActual="profile"
      titulo="Mi perfil"
      onCambiarPagina={onCambiarPagina}
      onLogout={onLogout}
      notificaciones={notificaciones}
      cargandoNotificaciones={cargandoNotificaciones}
      onRecargarNotificaciones={onRecargarNotificaciones}
      onNotificacionLeida={onNotificacionLeida}
      onMarcarTodasLeidas={onMarcarTodasLeidas}
    >
      <section className="profile-heading">
        <span className="profile-eyebrow">
          MI CUENTA
        </span>

        <h1>
          Tu espacio, <span>tus datos.</span>
        </h1>

        <p>
          Consulta tu información personal y administra
          la seguridad de tu cuenta.
        </p>
      </section>

      {cargando && (
        <div className="profile-state">
          Cargando tu perfil...
        </div>
      )}

      {!cargando && !perfil && (
        <div className="profile-state profile-error">
          {errorPerfil || "No se pudo cargar el perfil."}
        </div>
      )}

      {!cargando && perfil && (
        <div className="profile-content">
          {/* ==================================
              FOTOGRAFÍA E IDENTIDAD
              ================================== */}

          <section className="profile-card">
            <div className="profile-identity">
              <div className="profile-avatar">
                {imagenVisible ? (
                  <img
                    src={imagenVisible}
                    alt={`Fotografía de ${perfil.name}`}
                    className="profile-avatar-image"
                    onError={() => {
                      if (!vistaPrevia) {
                        setImagenConError(true);
                      }
                    }}
                  />
                ) : (
                  iniciales
                )}
              </div>

              <div>
                <span className="profile-eyebrow">
                  PERFIL PERSONAL
                </span>

                <h2>{perfil.name}</h2>
                <p>{perfil.email}</p>
              </div>
            </div>

            <div className="profile-photo-section">
              <h3>Fotografía de perfil</h3>

              <p className="profile-photo-note">
                Selecciona una fotografía JPG, PNG o WEBP
                de hasta 2 MB.
              </p>

              <input
                ref={inputFotoRef}
                id="profile-photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={seleccionarFoto}
                disabled={procesandoFoto}
                className="profile-photo-input"
              />

              {archivoFoto && (
                <p className="profile-photo-note">
                  Imagen seleccionada: {archivoFoto.name}
                </p>
              )}

              {errorFoto && (
                <p
                  className="profile-message error"
                  role="alert"
                >
                  {errorFoto}
                </p>
              )}

              {mensajeFoto && (
                <p
                  className="profile-message success"
                  role="status"
                >
                  {mensajeFoto}
                </p>
              )}

              <div className="profile-actions">
                <button
                  type="button"
                  className="profile-button secondary"
                  onClick={() =>
                    inputFotoRef.current?.click()
                  }
                  disabled={procesandoFoto}
                >
                  {fotoUrl
                    ? "Cambiar fotografía"
                    : "Seleccionar fotografía"}
                </button>

                {archivoFoto && (
                  <>
                    <button
                      type="button"
                      className="profile-button primary"
                      onClick={guardarFoto}
                      disabled={procesandoFoto}
                    >
                      {guardandoFoto
                        ? "Guardando..."
                        : "Guardar fotografía"}
                    </button>

                    <button
                      type="button"
                      className="profile-button secondary"
                      onClick={cancelarSeleccionFoto}
                      disabled={procesandoFoto}
                    >
                      Cancelar
                    </button>
                  </>
                )}

                {fotoUrl && !archivoFoto && (
                  <button
                    type="button"
                    className="profile-button secondary"
                    onClick={eliminarFoto}
                    disabled={procesandoFoto}
                  >
                    {eliminandoFoto
                      ? "Eliminando..."
                      : "Eliminar fotografía"}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* ==================================
              INFORMACIÓN PERSONAL
              ================================== */}

          <section className="profile-card">
            <div className="profile-card-heading">
              <h2>Información personal</h2>
              <p>
                Actualiza el nombre que aparece
                en tu cuenta.
              </p>
            </div>

            <form onSubmit={guardarNombre}>
              <div className="profile-field">
                <label htmlFor="profile-name">
                  Nombre completo
                </label>

                <input
                  id="profile-name"
                  type="text"
                  value={nombre}
                  onChange={(event) => {
                    setNombre(event.target.value);
                    setMensajePerfil("");
                  }}
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="profile-field">
                <label htmlFor="profile-email">
                  Correo electrónico
                </label>

                <input
                  id="profile-email"
                  type="email"
                  value={perfil.email}
                  disabled
                />

                <small>
                  El correo electrónico no se puede
                  modificar por ahora.
                </small>
              </div>

              {errorPerfil && (
                <p
                  className="profile-message error"
                  role="alert"
                >
                  {errorPerfil}
                </p>
              )}

              {mensajePerfil && (
                <p
                  className="profile-message success"
                  role="status"
                >
                  {mensajePerfil}
                </p>
              )}

              <div className="profile-actions">
                {nombre !== perfil.name && (
                  <button
                    type="button"
                    className="profile-button secondary"
                    disabled={guardandoNombre}
                    onClick={() => {
                      setNombre(perfil.name);
                      setErrorPerfil("");
                      setMensajePerfil("");
                    }}
                  >
                    Cancelar
                  </button>
                )}

                <button
                  type="submit"
                  className="profile-button primary"
                  disabled={
                    guardandoNombre ||
                    nombre.trim() === perfil.name
                  }
                >
                  {guardandoNombre
                    ? "Guardando..."
                    : "Guardar nombre"}
                </button>
              </div>
            </form>
          </section>

          {/* ==================================
              SEGURIDAD DE LA CUENTA
              ================================== */}

          <section className="profile-card">
            <div className="profile-card-heading">
              <h2>Seguridad de la cuenta</h2>
              <p>
                Cambia tu contraseña para mantener
                protegida tu información.
              </p>
            </div>

            <form onSubmit={guardarContrasena}>
              <div className="profile-field">
                <label htmlFor="profile-current-password">
                  Contraseña actual
                </label>

                <input
                  id="profile-current-password"
                  type="password"
                  value={contrasenaActual}
                  onChange={(event) =>
                    setContrasenaActual(event.target.value)
                  }
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="profile-field">
                <label htmlFor="profile-new-password">
                  Nueva contraseña
                </label>

                <input
                  id="profile-new-password"
                  type="password"
                  value={contrasenaNueva}
                  onChange={(event) =>
                    setContrasenaNueva(event.target.value)
                  }
                  minLength={12}
                  maxLength={72}
                  autoComplete="new-password"
                  required
                />

                <small>
                  Utiliza entre 12 y 72 caracteres.
                </small>
              </div>

              <div className="profile-field">
                <label htmlFor="profile-confirm-password">
                  Confirmar nueva contraseña
                </label>

                <input
                  id="profile-confirm-password"
                  type="password"
                  value={confirmarContrasena}
                  onChange={(event) =>
                    setConfirmarContrasena(event.target.value)
                  }
                  autoComplete="new-password"
                  required
                />
              </div>

              {errorContrasena && (
                <p
                  className="profile-message error"
                  role="alert"
                >
                  {errorContrasena}
                </p>
              )}

              {mensajeContrasena && (
                <p
                  className="profile-message success"
                  role="status"
                >
                  {mensajeContrasena}
                </p>
              )}

              <div className="profile-actions">
                <button
                  type="submit"
                  className="profile-button primary"
                  disabled={guardandoContrasena}
                >
                  {guardandoContrasena
                    ? "Actualizando..."
                    : "Cambiar contraseña"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </AppLayout>
  );
}

export default Profile;
