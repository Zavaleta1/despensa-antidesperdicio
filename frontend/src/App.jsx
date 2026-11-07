
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Pantry from "./pages/Pantry";
import Profile from "./pages/Profile";
import Summary from "./pages/Summary";
import Recipes from "./pages/Recipes";
import ResetPassword from "./pages/ResetPassword";

import {
  obtenerNotificaciones,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
} from "./services/notificationService";

import {
  obtenerFotoPerfil,
} from "./services/profileService";

import {
  reiniciarAvisoSesion,
} from "./services/api";

// La URL firmada dura 5 minutos.
// Se renueva cada 4 minutos.
const INTERVALO_RENOVACION_FOTO = 4 * 60 * 1000;

const obtenerRutaActual = () =>
  window.location.pathname;

function App() {
  // ==========================================
  // SESIÓN
  // ==========================================

  const [token, setToken] = useState(
    () => localStorage.getItem("token") || ""
  );

  const [usuario, setUsuario] = useState(() => {
    const usuarioGuardado =
      localStorage.getItem("usuario");

    if (!usuarioGuardado) {
      return null;
    }

    try {
      return JSON.parse(usuarioGuardado);
    } catch {
      localStorage.removeItem("usuario");
      return null;
    }
  });

  const [mensajeSesion, setMensajeSesion] =
    useState("");

  // ==========================================
  // NAVEGACIÓN
  // ==========================================

  const [paginaAuth, setPaginaAuth] =
    useState("login");

  const [paginaActual, setPaginaActual] =
    useState("dashboard");

  const [
    productoSeleccionadoId,
    setProductoSeleccionadoId,
  ] = useState(null);

  const [rutaActual, setRutaActual] =
    useState(obtenerRutaActual);

  useEffect(() => {
    const manejarCambioRuta = () => {
      setRutaActual(obtenerRutaActual());
    };

    window.addEventListener(
      "popstate",
      manejarCambioRuta
    );

    return () => {
      window.removeEventListener(
        "popstate",
        manejarCambioRuta
      );
    };
  }, []);

  // ==========================================
  // FOTOGRAFÍA COMPARTIDA
  // ==========================================

  const [fotoPerfilUrl, setFotoPerfilUrl] =
    useState(null);

  const versionFotoRef = useRef(0);

  const actualizarFotoPerfil = useCallback(
    (nuevaUrl) => {
      versionFotoRef.current += 1;
      setFotoPerfilUrl(nuevaUrl || null);
    },
    []
  );

  // ==========================================
  // NOTIFICACIONES
  // ==========================================

  const [
    notificaciones,
    setNotificaciones,
  ] = useState([]);

  const [
    cargandoNotificaciones,
    setCargandoNotificaciones,
  ] = useState(false);

  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    versionFotoRef.current += 1;

    setToken("");
    setUsuario(null);
    setFotoPerfilUrl(null);
    setNotificaciones([]);
    setCargandoNotificaciones(false);

    setPaginaAuth("login");
    setPaginaActual("dashboard");
    setProductoSeleccionadoId(null);
    setMensajeSesion("");

    reiniciarAvisoSesion();
  }, []);

  // ==========================================
  // PASO 96.9.3
  // DETECTAR SESIÓN INVALIDADA
  // ==========================================

  useEffect(() => {
    const manejarSesionInvalidada = (evento) => {
      const mensaje =
        evento.detail?.message ||
        "Tu sesión ha expirado. Inicia sesión nuevamente.";

      // Limpiar estado de la aplicación.
      // apiRequest ya eliminó el token almacenado.
      cerrarSesion();

      // Mostrar aviso después de limpiar.
      setMensajeSesion(mensaje);

      // Regresar a la ruta principal.
      window.history.replaceState(
        {},
        "",
        "/"
      );

      setRutaActual("/");
    };

    window.addEventListener(
      "sesion-invalidada",
      manejarSesionInvalidada
    );

    return () => {
      window.removeEventListener(
        "sesion-invalidada",
        manejarSesionInvalidada
      );
    };
  }, [cerrarSesion]);

  // ==========================================
  // PASO 96.7 - VOLVER AL LOGIN
  // ==========================================

  const volverAlLogin = () => {
    cerrarSesion();

    window.history.replaceState(
      {},
      "",
      "/"
    );

    setRutaActual("/");
  };

  // ==========================================
  // CARGAR Y RENOVAR FOTOGRAFÍA
  // ==========================================

  useEffect(() => {
    if (!token || !usuario?.id) {
      actualizarFotoPerfil(null);
      return;
    }

    let activo = true;

    async function cargarFoto() {
      const versionSolicitud =
        versionFotoRef.current;

      try {
        const respuesta =
          await obtenerFotoPerfil(token);

        if (
          activo &&
          versionSolicitud ===
            versionFotoRef.current
        ) {
          setFotoPerfilUrl(
            respuesta.photoUrl || null
          );
        }
      } catch (error) {
        if (activo) {
          console.error(
            "Error al cargar fotografía:",
            error
          );
        }
      }
    }

    cargarFoto();

    const intervalo = setInterval(
      cargarFoto,
      INTERVALO_RENOVACION_FOTO
    );

    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }, [
    token,
    usuario?.id,
    actualizarFotoPerfil,
  ]);

  // ==========================================
  // CARGAR NOTIFICACIONES
  // ==========================================

  const cargarNotificaciones = useCallback(
    async () => {
      if (!token) {
        setNotificaciones([]);
        return;
      }

      setCargandoNotificaciones(true);

      try {
        const datos =
          await obtenerNotificaciones(token);

        setNotificaciones(
          Array.isArray(datos) ? datos : []
        );
      } catch (error) {
        console.error(
          "Error al cargar notificaciones:",
          error
        );
      } finally {
        setCargandoNotificaciones(false);
      }
    },
    [token]
  );

  // ==========================================
  // CARGAR NOTIFICACIONES AL INICIAR
  // ==========================================

  useEffect(() => {
    if (token && usuario) {
      cargarNotificaciones();
    } else {
      setNotificaciones([]);
    }
  }, [
    token,
    usuario?.id,
    cargarNotificaciones,
  ]);

  // ==========================================
  // INICIAR SESIÓN
  // ==========================================

  const manejarLogin = (datos) => {
    reiniciarAvisoSesion();

    localStorage.setItem(
      "token",
      datos.token
    );

    localStorage.setItem(
      "usuario",
      JSON.stringify(datos.user)
    );

    actualizarFotoPerfil(null);

    setToken(datos.token);
    setUsuario(datos.user);
    setMensajeSesion("");

    setPaginaAuth("login");
    setPaginaActual("dashboard");
    setProductoSeleccionadoId(null);
  };

  // ==========================================
  // REGISTRO
  // ==========================================

  const manejarRegistroExitoso = () => {
    alert(
      "✅ Cuenta creada correctamente. Ahora inicia sesión."
    );

    setPaginaAuth("login");
  };

  // ==========================================
  // CAMBIAR PÁGINA
  // ==========================================

  const cambiarPagina = (
    pagina,
    productoId = null
  ) => {
    setProductoSeleccionadoId(
      pagina === "pantry" ? productoId : null
    );

    setPaginaActual(pagina);
  };

  // ==========================================
  // ACTUALIZAR USUARIO
  // ==========================================

  const actualizarUsuario = useCallback(
    (datosActualizados) => {
      setUsuario((anterior) => {
        const usuarioActualizado = {
          ...anterior,
          ...datosActualizados,
        };

        localStorage.setItem(
          "usuario",
          JSON.stringify(usuarioActualizado)
        );

        return usuarioActualizado;
      });
    },
    []
  );

  // ==========================================
  // MARCAR UNA NOTIFICACIÓN COMO LEÍDA
  // ==========================================

  const manejarNotificacionLeida =
    async (notificacion) => {
      if (
        !notificacion ||
        notificacion.is_read
      ) {
        return;
      }

      try {
        await marcarNotificacionLeida(
          notificacion.id,
          token
        );

        setNotificaciones(
          (anteriores) =>
            anteriores.map((item) =>
              item.id === notificacion.id
                ? {
                    ...item,
                    is_read: true,
                  }
                : item
            )
        );
      } catch (error) {
        console.error(
          "Error al marcar notificación como leída:",
          error
        );
      }
    };

  // ==========================================
  // MARCAR TODAS COMO LEÍDAS
  // ==========================================

  const manejarMarcarTodasLeidas =
    async () => {
      try {
        await marcarTodasNotificacionesLeidas(
          token
        );

        setNotificaciones(
          (anteriores) =>
            anteriores.map((item) => ({
              ...item,
              is_read: true,
            }))
        );
      } catch (error) {
        console.error(
          "Error al marcar todas las notificaciones:",
          error
        );
      }
    };

  // ==========================================
  // PROPIEDADES COMPARTIDAS
  // ==========================================

  const propiedadesAplicacion = {
    usuario,
    token,

    fotoPerfilUrl,
    onActualizarFotoPerfil:
      actualizarFotoPerfil,

    onActualizarUsuario:
      actualizarUsuario,

    onLogout: cerrarSesion,

    onCambiarPagina: cambiarPagina,

    notificaciones,

    cargandoNotificaciones,

    onRecargarNotificaciones:
      cargarNotificaciones,

    onNotificacionLeida:
      manejarNotificacionLeida,

    onMarcarTodasLeidas:
      manejarMarcarTodasLeidas,
  };

  // ==========================================
  // RECUPERACIÓN DE CONTRASEÑA
  // ==========================================

  if (rutaActual === "/reset-password") {
    return (
      <ResetPassword
        onVolverLogin={volverAlLogin}
      />
    );
  }

  // ==========================================
  // SIN SESIÓN
  // ==========================================

  if (!token || !usuario) {
    if (paginaAuth === "registro") {
      return (
        <Register
          onRegistroExitoso={
            manejarRegistroExitoso
          }
          onIrALogin={() =>
            setPaginaAuth("login")
          }
        />
      );
    }

    return (
      <>
        {mensajeSesion && (
          <div
            role="alert"
            style={{
              position: "fixed",
              top: "16px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "calc(100% - 32px)",
              maxWidth: "480px",
              padding: "14px 18px",
              borderRadius: "12px",
              background: "#fff7ed",
              border: "1px solid #fdba74",
              color: "#9a3412",
              fontSize: "14px",
              fontWeight: 600,
              textAlign: "center",
              boxShadow:
                "0 8px 24px rgba(0,0,0,0.12)",
              zIndex: 9999,
            }}
          >
            {mensajeSesion}
          </div>
        )}

        <Login
          onLogin={manejarLogin}
          onIrARegistro={() => {
            setMensajeSesion("");
            setPaginaAuth("registro");
          }}
        />
      </>
    );
  }

  // ==========================================
  // DASHBOARD
  // ==========================================

  if (paginaActual === "dashboard") {
    return (
      <Dashboard
        {...propiedadesAplicacion}
      />
    );
  }

  // ==========================================
  // DESPENSA
  // ==========================================

  if (paginaActual === "pantry") {
    return (
      <Pantry
        {...propiedadesAplicacion}
        productoSeleccionadoId={
          productoSeleccionadoId
        }
      />
    );
  }

  // ==========================================
  // AJUSTES
  // ==========================================

  if (paginaActual === "settings") {
    return (
      <Settings
        {...propiedadesAplicacion}
      />
    );
  }

  // ==========================================
  // MI PERFIL
  // ==========================================

  if (paginaActual === "profile") {
    return (
      <Profile
        {...propiedadesAplicacion}
      />
    );
  }

  // ==========================================
  // RESUMEN
  // ==========================================

  if (paginaActual === "summary") {
    return (
      <Summary
        {...propiedadesAplicacion}
      />
    );
  }

  // ==========================================
  // RECETAS
  // ==========================================

  if (paginaActual === "recipes") {
    return (
      <Recipes
        {...propiedadesAplicacion}
      />
    );
  }

  // ==========================================
  // RESPALDO
  // ==========================================

  return (
    <Dashboard
      {...propiedadesAplicacion}
    />
  );
}

export default App;
