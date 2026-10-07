import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

import "../../styles/layout.css";


function AppLayout({
  usuario,
  paginaActual,
  titulo,

  onCambiarPagina,
  onLogout,

  notificaciones = [],
  cargandoNotificaciones = false,

  onNotificacionLeida,
  onMarcarTodasLeidas,
  onRecargarNotificaciones,

  children,
}) {
  // ==========================================
  // NAVEGACIÓN DESDE TOPBAR
  // ==========================================

  const irAPerfil = () => {
    onCambiarPagina("profile");
  };

  const irAAjustes = () => {
    onCambiarPagina("settings");
  };

  const irADespensa = () => {
    onCambiarPagina("pantry");
  };


  return (
    <div className="app-layout">
      <Sidebar
        paginaActual={paginaActual}
        onCambiarPagina={
          onCambiarPagina
        }
        onLogout={onLogout}
      />

      <div className="app-main">
        <Topbar
          usuario={usuario}
          titulo={titulo}

          notificaciones={
            notificaciones
          }

          cargandoNotificaciones={
            cargandoNotificaciones
          }

          onNotificacionLeida={
            onNotificacionLeida
          }

          onMarcarTodasLeidas={
            onMarcarTodasLeidas
          }

          onRecargarNotificaciones={
            onRecargarNotificaciones
          }

          onIrAPerfil={irAPerfil}
          onIrAAjustes={irAAjustes}
          onIrADespensa={irADespensa}

          onLogout={onLogout}
        />

        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;