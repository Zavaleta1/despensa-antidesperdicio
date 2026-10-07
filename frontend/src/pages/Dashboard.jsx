import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AppLayout from "../components/layout/AppLayout";

import DashboardHero from "../components/dashboard/DashboardHero";
import PantryOverview from "../components/dashboard/PantryOverview";
import ExpirationTrafficLight from "../components/dashboard/ExpirationTrafficLight";
import PriorityProducts from "../components/dashboard/PriorityProducts";
import AntiWasteBanner from "../components/dashboard/AntiWasteBanner";

import {
  obtenerProductos,
} from "../services/productService";

import "../styles/dashboard.css";


function Dashboard({
  usuario,
  token,
  onLogout,
  onCambiarPagina,

  // ==========================================
  // NOTIFICACIONES
  // ==========================================

  notificaciones = [],
  cargandoNotificaciones = false,
  onRecargarNotificaciones,
  onNotificacionLeida,
  onMarcarTodasLeidas,
}) {
  const [productos, setProductos] =
    useState([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");


  // ==========================================
  // CARGAR PRODUCTOS
  // ==========================================

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setCargando(true);
        setError("");

        const datos =
          await obtenerProductos(token);

        setProductos(datos);
      } catch (error) {
        console.error(
          "Error al cargar el Dashboard:",
          error
        );

        if (error.status === 401) {
          onLogout();
          return;
        }

        setError(
          error.message ||
            "No se pudo cargar la información."
        );
      } finally {
        setCargando(false);
      }
    };

    cargarProductos();
  }, [token, onLogout]);


  // ==========================================
  // ESTADÍSTICAS
  // ==========================================

  const estadisticas = useMemo(() => {
    const categorias = new Set(
      productos.map(
        (producto) =>
          producto.category_id
      )
    );

    const ubicaciones = new Set(
      productos
        .map(
          (producto) =>
            producto.location
        )
        .filter(Boolean)
    );

    const contarNivel = (nivel) =>
      productos.filter(
        (producto) =>
          producto.expiration_level === nivel
      ).length;

    const caducados =
      contarNivel("caducado");

    const criticos =
      contarNivel("critico");

    const proximos =
      contarNivel("proximo");

    const atencion =
      contarNivel("atencion");

    const vigentes =
      contarNivel("vigente");

    const agotados =
      contarNivel("agotado");

    return {
      total: productos.length,

      categorias:
        categorias.size,

      ubicaciones:
        ubicaciones.size,

      caducados,
      criticos,
      proximos,
      atencion,
      vigentes,
      agotados,

      urgentes:
        caducados + criticos,
    };
  }, [productos]);


  // ==========================================
  // PRODUCTOS PRIORITARIOS
  // ==========================================

  const productosPrioritarios =
    useMemo(() => {
      const prioridad = {
        caducado: 0,
        critico: 1,
        proximo: 2,
        atencion: 3,
      };

      return productos
        .filter((producto) =>
          [
            "caducado",
            "critico",
            "proximo",
            "atencion",
          ].includes(
            producto.expiration_level
          )
        )
        .sort((a, b) => {
          const prioridadA =
            prioridad[
              a.expiration_level
            ];

          const prioridadB =
            prioridad[
              b.expiration_level
            ];

          if (
            prioridadA !== prioridadB
          ) {
            return (
              prioridadA -
              prioridadB
            );
          }

          return (
            (a.days_remaining ??
              99999) -
            (b.days_remaining ??
              99999)
          );
        })
        .slice(0, 5);
    }, [productos]);


  // ==========================================
  // NAVEGACIÓN
  // ==========================================

  const irADespensa = () => {
    onCambiarPagina("pantry");
  };

  const irARecetas = () => {
    onCambiarPagina("recipes");
  };


  // ==========================================
  // RENDER
  // ==========================================

  return (
    <AppLayout
      usuario={usuario}
      paginaActual="dashboard"
      titulo="Inicio"

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
      <DashboardHero
        usuario={usuario}
        onAgregarProducto={
          irADespensa
        }
      />

      {/* =====================================
          CARGANDO
      ====================================== */}

      {cargando && (
        <div className="dashboard-state">
          <span>⏳</span>

          <p>
            Cargando tu despensa...
          </p>
        </div>
      )}

      {/* =====================================
          ERROR
      ====================================== */}

      {!cargando && error && (
        <div className="dashboard-state dashboard-error">
          <span>!</span>

          <h3>
            No pudimos cargar el resumen
          </h3>

          <p>{error}</p>
        </div>
      )}

      {/* =====================================
          CONTENIDO
      ====================================== */}

      {!cargando && !error && (
        <>
          <PantryOverview
            estadisticas={
              estadisticas
            }
          />

          <ExpirationTrafficLight
            estadisticas={
              estadisticas
            }
            onVerDespensa={
              irADespensa
            }
          />

          <PriorityProducts
            productos={
              productosPrioritarios
            }
          />

          <AntiWasteBanner
            onVerRecetas={
              irARecetas
            }
          />
        </>
      )}
    </AppLayout>
  );
}

export default Dashboard;