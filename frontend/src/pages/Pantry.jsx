import { useEffect, useState } from "react";

import AppLayout from "../components/layout/AppLayout";

import ProductCard from "../components/ProductCard";

import ProductForm from "../components/ProductForm";

import {
  obtenerProductos,
  obtenerCategorias,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from "../services/productService";

import "../styles/pantry.css";


function Pantry({
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
  // ==========================================
  // ESTADOS
  // ==========================================

  const [productos, setProductos] =
    useState([]);

  const [categorias, setCategorias] =
    useState([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    mostrarFormulario,
    setMostrarFormulario,
  ] = useState(false);

  const [
    productoEditando,
    setProductoEditando,
  ] = useState(null);


  // ==========================================
  // FILTROS
  // ==========================================

  const [busqueda, setBusqueda] =
    useState("");

  const [
    categoriaFiltro,
    setCategoriaFiltro,
  ] = useState("");

  const [
    ubicacionFiltro,
    setUbicacionFiltro,
  ] = useState("");

  const [
    semaforoFiltro,
    setSemaforoFiltro,
  ] = useState("");


  // ==========================================
  // CARGAR DATOS
  // ==========================================

  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      setError("");

      try {
        const [
          productosData,
          categoriasData,
        ] = await Promise.all([
          obtenerProductos(token),
          obtenerCategorias(),
        ]);

        setProductos(productosData);
        setCategorias(categoriasData);
      } catch (error) {
        console.error(
          "Error al cargar la despensa:",
          error
        );

        if (error.status === 401) {
          onLogout();
          return;
        }

        setError(
          error.message ||
            "No se pudo cargar la despensa."
        );
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [token, onLogout]);


  // ==========================================
  // RECARGAR PRODUCTOS
  // ==========================================

  const recargarProductos = async () => {
    const datos =
      await obtenerProductos(token);

    setProductos(datos);
  };


  // ==========================================
  // SINCRONIZAR DESPENSA Y NOTIFICACIONES
  // ==========================================

  const sincronizarDespensa = async () => {
    // Primero actualizamos los productos.
    await recargarProductos();

    // Después actualizamos la campana.
    if (onRecargarNotificaciones) {
      await onRecargarNotificaciones();
    }
  };


  // ==========================================
  // FORMULARIO NUEVO
  // ==========================================

  const abrirFormularioNuevo = () => {
    setProductoEditando(null);
    setMostrarFormulario(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  // ==========================================
  // EDITAR PRODUCTO
  // ==========================================

  const abrirFormularioEditar = (
    producto
  ) => {
    setProductoEditando(producto);
    setMostrarFormulario(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  // ==========================================
  // CERRAR FORMULARIO
  // ==========================================

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setProductoEditando(null);
  };


  // ==========================================
  // GUARDAR PRODUCTO
  // ==========================================

  const guardarProducto = async (
    producto
  ) => {
    try {
      // ========================================
      // EDITAR
      // ========================================

      if (productoEditando) {
        await actualizarProducto(
          productoEditando.id,
          producto,
          token
        );

        await sincronizarDespensa();

        cerrarFormulario();

        alert(
          "✅ Producto actualizado correctamente"
        );

        return;
      }


      // ========================================
      // CREAR
      // ========================================

      await crearProducto(
        producto,
        token
      );

      await sincronizarDespensa();

      cerrarFormulario();

      alert(
        "✅ Producto agregado correctamente"
      );
    } catch (error) {
      console.error(
        "Error al guardar producto:",
        error
      );

      if (error.status === 401) {
        onLogout();
        return;
      }

      alert(
        "❌ No se pudo guardar el producto: " +
          error.message
      );

      throw error;
    }
  };


  // ==========================================
  // ELIMINAR PRODUCTO
  // ==========================================

  const manejarEliminarProducto = async (
    producto
  ) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar "${producto.name}"?`
    );

    if (!confirmar) {
      return;
    }

    try {
      await eliminarProducto(
        producto.id,
        token
      );

      // ========================================
      // ACTUALIZAR PRODUCTOS Y NOTIFICACIONES
      // ========================================

      await sincronizarDespensa();

      // Si el producto eliminado estaba
      // abierto en el formulario de edición,
      // cerramos el formulario.

      if (
        productoEditando?.id ===
        producto.id
      ) {
        cerrarFormulario();
      }

      alert(
        "✅ Producto eliminado correctamente"
      );
    } catch (error) {
      console.error(
        "Error al eliminar producto:",
        error
      );

      if (error.status === 401) {
        onLogout();
        return;
      }

      alert(
        "❌ No se pudo eliminar el producto: " +
          error.message
      );
    }
  };


  // ==========================================
  // UBICACIONES DISPONIBLES
  // ==========================================

  const ubicaciones = [
    ...new Set(
      productos
        .map(
          (producto) =>
            producto.location
        )
        .filter(Boolean)
    ),
  ];


  // ==========================================
  // ESTADÍSTICAS
  // ==========================================

  const categoriasUtilizadas =
    new Set(
      productos.map(
        (producto) =>
          producto.category_id
      )
    ).size;


  const productosUrgentes =
    productos.filter(
      (producto) =>
        producto.expiration_level ===
          "caducado" ||
        producto.expiration_level ===
          "critico"
    ).length;


  const productosProximos =
    productos.filter(
      (producto) =>
        producto.expiration_level ===
          "proximo" ||
        producto.expiration_level ===
          "atencion"
    ).length;


  // ==========================================
  // FILTRAR PRODUCTOS
  // ==========================================

  const productosFiltrados =
    productos.filter((producto) => {
      const coincideBusqueda =
        producto.name
          ?.toLowerCase()
          .includes(
            busqueda
              .trim()
              .toLowerCase()
          );

      const coincideCategoria =
        !categoriaFiltro ||
        String(
          producto.category_id
        ) === categoriaFiltro;

      const coincideUbicacion =
        !ubicacionFiltro ||
        producto.location ===
          ubicacionFiltro;

      const coincideSemaforo =
        !semaforoFiltro ||
        producto.expiration_level ===
          semaforoFiltro;

      return (
        coincideBusqueda &&
        coincideCategoria &&
        coincideUbicacion &&
        coincideSemaforo
      );
    });


  // ==========================================
  // LIMPIAR FILTROS
  // ==========================================

  const limpiarFiltros = () => {
    setBusqueda("");
    setCategoriaFiltro("");
    setUbicacionFiltro("");
    setSemaforoFiltro("");
  };


  const hayFiltros = Boolean(
    busqueda ||
      categoriaFiltro ||
      ubicacionFiltro ||
      semaforoFiltro
  );


  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <AppLayout
      usuario={usuario}
      paginaActual="pantry"
      titulo="Mi despensa"

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
      {/* =====================================
          ENCABEZADO
      ====================================== */}

      <section className="pantry-heading">
        <div className="pantry-heading-content">
          <span className="pantry-eyebrow">
            INVENTARIO INTELIGENTE
          </span>

          <h1>
            Todo lo que tienes,
            <span> bajo control.</span>
          </h1>

          <p>
            Organiza tus alimentos, revisa
            qué debes consumir primero y
            reduce el desperdicio en casa.
          </p>
        </div>

        <button
          type="button"
          className="pantry-add-button"
          onClick={
            abrirFormularioNuevo
          }
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>

          <span>
            Agregar producto
          </span>
        </button>
      </section>


      {/* =====================================
          RESUMEN
      ====================================== */}

      <section className="pantry-summary">
        <article className="pantry-summary-card">
          <div className="summary-card-icon total">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
          </div>

          <div>
            <span>
              Productos
            </span>

            <strong>
              {productos.length}
            </strong>

            <small>
              registrados
            </small>
          </div>
        </article>


        <article className="pantry-summary-card">
          <div className="summary-card-icon category">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <rect
                x="3"
                y="3"
                width="7"
                height="7"
                rx="1"
              />

              <rect
                x="14"
                y="3"
                width="7"
                height="7"
                rx="1"
              />

              <rect
                x="3"
                y="14"
                width="7"
                height="7"
                rx="1"
              />

              <rect
                x="14"
                y="14"
                width="7"
                height="7"
                rx="1"
              />
            </svg>
          </div>

          <div>
            <span>
              Categorías
            </span>

            <strong>
              {categoriasUtilizadas}
            </strong>

            <small>
              en uso
            </small>
          </div>
        </article>


        <article
          className={
            productosUrgentes > 0
              ? "pantry-summary-card urgent"
              : "pantry-summary-card"
          }
        >
          <div className="summary-card-icon urgent">
            <span>!</span>
          </div>

          <div>
            <span>
              Prioridad alta
            </span>

            <strong>
              {productosUrgentes}
            </strong>

            <small>
              consumir primero
            </small>
          </div>
        </article>


        <article className="pantry-summary-card">
          <div className="summary-card-icon upcoming">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
              />

              <path d="M12 7v5l3 2" />
            </svg>
          </div>

          <div>
            <span>
              Por revisar
            </span>

            <strong>
              {productosProximos}
            </strong>

            <small>
              próximos / atención
            </small>
          </div>
        </article>
      </section>


      {/* =====================================
          FORMULARIO
      ====================================== */}

      {mostrarFormulario && (
        <section className="pantry-form-panel">
          <ProductForm
            key={
              productoEditando
                ? `editar-${productoEditando.id}`
                : "nuevo"
            }

            categorias={
              categorias
            }

            producto={
              productoEditando
            }

            onGuardar={
              guardarProducto
            }

            onCancelar={
              cerrarFormulario
            }
          />
        </section>
      )}


      {/* =====================================
          INVENTARIO
      ====================================== */}

      <section className="inventory-panel">

        {/* ===================================
            ENCABEZADO DEL INVENTARIO
        ==================================== */}

        <div className="inventory-panel-header">
          <div>
            <span className="inventory-eyebrow">
              TUS ALIMENTOS
            </span>

            <h2>
              Inventario
            </h2>

            <p>
              Encuentra rápidamente lo que
              tienes disponible.
            </p>
          </div>

          <div className="inventory-count">
            <strong>
              {productosFiltrados.length}
            </strong>

            <span>
              {productosFiltrados.length === 1
                ? "producto"
                : "productos"}
            </span>
          </div>
        </div>


        {/* ===================================
            FILTROS
        ==================================== */}

        <div className="inventory-toolbar">

          {/* BUSCADOR */}

          <div className="inventory-search">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
              />

              <path d="m20 20-4-4" />
            </svg>

            <input
              type="search"
              value={busqueda}
              onChange={(evento) =>
                setBusqueda(
                  evento.target.value
                )
              }
              placeholder="Buscar producto..."
              aria-label="Buscar producto"
            />

            {busqueda && (
              <button
                type="button"
                className="search-clear-button"
                onClick={() =>
                  setBusqueda("")
                }
                aria-label="Limpiar búsqueda"
              >
                ×
              </button>
            )}
          </div>


          {/* CATEGORÍA */}

          <div className="filter-control">
            <span className="filter-control-label">
              Categoría
            </span>

            <select
              value={
                categoriaFiltro
              }
              onChange={(evento) =>
                setCategoriaFiltro(
                  evento.target.value
                )
              }
              aria-label="Filtrar por categoría"
            >
              <option value="">
                Todas
              </option>

              {categorias.map(
                (categoria) => (
                  <option
                    key={
                      categoria.id
                    }
                    value={
                      categoria.id
                    }
                  >
                    {categoria.icon
                      ? `${categoria.icon} `
                      : ""}

                    {categoria.name}
                  </option>
                )
              )}
            </select>
          </div>


          {/* UBICACIÓN */}

          <div className="filter-control">
            <span className="filter-control-label">
              Ubicación
            </span>

            <select
              value={
                ubicacionFiltro
              }
              onChange={(evento) =>
                setUbicacionFiltro(
                  evento.target.value
                )
              }
              aria-label="Filtrar por ubicación"
            >
              <option value="">
                Todas
              </option>

              {ubicaciones.map(
                (ubicacion) => (
                  <option
                    key={ubicacion}
                    value={ubicacion}
                  >
                    {ubicacion}
                  </option>
                )
              )}
            </select>
          </div>


          {/* SEMÁFORO */}

          <div className="filter-control">
            <span className="filter-control-label">
              Semáforo
            </span>

            <select
              value={
                semaforoFiltro
              }
              onChange={(evento) =>
                setSemaforoFiltro(
                  evento.target.value
                )
              }
              aria-label="Filtrar por semáforo"
            >
              <option value="">
                Todos
              </option>

              <option value="caducado">
                🔴 Caducados
              </option>

              <option value="critico">
                🔴 Críticos
              </option>

              <option value="proximo">
                🟠 Próximos
              </option>

              <option value="atencion">
                🟡 Atención
              </option>

              <option value="vigente">
                🟢 Vigentes
              </option>

              <option value="agotado">
                ⚫ Agotados
              </option>
            </select>
          </div>
        </div>


        {/* ===================================
            INFORMACIÓN DE RESULTADOS
        ==================================== */}

        <div className="inventory-information">
          <div className="inventory-result-text">
            {hayFiltros ? (
              <>
                <span className="filter-active-dot" />

                <p>
                  Mostrando{" "}
                  <strong>
                    {productosFiltrados.length}
                  </strong>{" "}
                  de{" "}
                  <strong>
                    {productos.length}
                  </strong>{" "}
                  productos
                </p>
              </>
            ) : (
              <p>
                Todos tus productos están
                visibles.
              </p>
            )}
          </div>

          {hayFiltros && (
            <button
              type="button"
              className="clear-filters-button"
              onClick={
                limpiarFiltros
              }
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 15H6L5 6" />
              </svg>

              Limpiar filtros
            </button>
          )}
        </div>


        {/* ===================================
            CARGANDO
        ==================================== */}

        {cargando && (
          <div className="pantry-state">
            <div className="pantry-loader" />

            <h3>
              Preparando tu despensa
            </h3>

            <p>
              Estamos cargando tus alimentos...
            </p>
          </div>
        )}


        {/* ===================================
            ERROR
        ==================================== */}

        {!cargando && error && (
          <div className="pantry-state error">
            <div className="state-icon">
              !
            </div>

            <h3>
              No pudimos cargar la despensa
            </h3>

            <p>
              {error}
            </p>
          </div>
        )}


        {/* ===================================
            DESPENSA VACÍA
        ==================================== */}

        {!cargando &&
          !error &&
          productos.length === 0 && (
            <div className="pantry-state empty">
              <div className="state-icon">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                  <path d="m3.3 7 8.7 5 8.7-5" />
                  <path d="M12 22V12" />
                </svg>
              </div>

              <h3>
                Tu despensa está vacía
              </h3>

              <p>
                Agrega tu primer alimento y
                comienza a controlar su
                caducidad.
              </p>

              <button
                type="button"
                className="pantry-add-button"
                onClick={
                  abrirFormularioNuevo
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>

                Agregar primer producto
              </button>
            </div>
          )}


        {/* ===================================
            SIN RESULTADOS
        ==================================== */}

        {!cargando &&
          !error &&
          productos.length > 0 &&
          productosFiltrados.length === 0 && (
            <div className="pantry-state empty">
              <div className="state-icon">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                  />

                  <path d="m20 20-4-4" />
                </svg>
              </div>

              <h3>
                No encontramos productos
              </h3>

              <p>
                Prueba con otra búsqueda o
                cambia los filtros
                seleccionados.
              </p>

              <button
                type="button"
                className="clear-filters-button"
                onClick={
                  limpiarFiltros
                }
              >
                Limpiar filtros
              </button>
            </div>
          )}


        {/* ===================================
            PRODUCTOS
        ==================================== */}

        {!cargando &&
          !error &&
          productosFiltrados.length > 0 && (
            <div className="products-grid">
              {productosFiltrados.map(
                (producto) => (
                  <ProductCard
                    key={
                      producto.id
                    }

                    producto={
                      producto
                    }

                    onEditar={
                      abrirFormularioEditar
                    }

                    onEliminar={
                      manejarEliminarProducto
                    }
                  />
                )
              )}
            </div>
          )}
      </section>
    </AppLayout>
  );
}

export default Pantry;