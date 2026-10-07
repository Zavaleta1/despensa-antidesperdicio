import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Pantry from "./pages/Pantry";

import {
  obtenerNotificaciones,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
} from "./services/notificationService";


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


  // ==========================================
  // NAVEGACIÓN
  // ==========================================

  const [paginaAuth, setPaginaAuth] =
    useState("login");

  const [paginaActual, setPaginaActual] =
    useState("dashboard");


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
  // CARGAR NOTIFICACIONES
  // ==========================================

  const cargarNotificaciones =
    useCallback(async () => {
      if (!token) {
        setNotificaciones([]);
        return;
      }

      setCargandoNotificaciones(true);

      try {
        const datos =
          await obtenerNotificaciones(token);

        setNotificaciones(
          Array.isArray(datos)
            ? datos
            : []
        );
      } catch (error) {
        console.error(
          "Error al cargar notificaciones:",
          error
        );

        /*
          Si falla la carga de notificaciones
          no cerramos la sesión ni bloqueamos
          el resto de la aplicación.
        */
      } finally {
        setCargandoNotificaciones(false);
      }
    }, [token]);


  // ==========================================
  // CARGAR AL INICIAR SESIÓN
  // ==========================================

  useEffect(() => {
    if (token && usuario) {
      cargarNotificaciones();
    } else {
      setNotificaciones([]);
    }
  }, [
    token,
    usuario,
    cargarNotificaciones,
  ]);


  // ==========================================
  // LOGIN
  // ==========================================

  const manejarLogin = (datos) => {
    localStorage.setItem(
      "token",
      datos.token
    );

    localStorage.setItem(
      "usuario",
      JSON.stringify(datos.user)
    );

    setToken(datos.token);
    setUsuario(datos.user);

    setPaginaActual("dashboard");
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
  // CERRAR SESIÓN
  // ==========================================

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    setToken("");
    setUsuario(null);

    setNotificaciones([]);

    setPaginaAuth("login");
    setPaginaActual("dashboard");
  };


  // ==========================================
  // CAMBIAR PÁGINA
  // ==========================================

  const cambiarPagina = (pagina) => {
    setPaginaActual(pagina);
  };


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
            anteriores.map(
              (notificacion) => ({
                ...notificacion,
                is_read: true,
              })
            )
        );
      } catch (error) {
        console.error(
          "Error al marcar todas las notificaciones:",
          error
        );
      }
    };


  // ==========================================
  // PROPIEDADES COMUNES
  // ==========================================

  const propiedadesAplicacion = {
    usuario,
    token,

    onLogout: cerrarSesion,

    onCambiarPagina:
      cambiarPagina,

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
      <Login
        onLogin={manejarLogin}
        onIrARegistro={() =>
          setPaginaAuth("registro")
        }
      />
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
  // PÁGINAS EN CONSTRUCCIÓN
  // ==========================================

  if (
    paginaActual === "recipes" ||
    paginaActual === "summary" ||
   
    paginaActual === "profile"
  ) {
    return (
      <Dashboard
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