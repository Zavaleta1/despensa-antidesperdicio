
import { useEffect, useMemo, useState } from "react";

import AppLayout from "../components/layout/AppLayout";
import { obtenerProductos } from "../services/productService";

import "../styles/recipes.css";

const OPCIONES = {
  TODOS: "todos",
  CRITICOS: "criticos",
  LIBRE: "libre",
};

function Recipes({
  usuario,
  token,
  fotoPerfilUrl,
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

  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [modo, setModo] = useState(OPCIONES.TODOS);

  const [ingredientesSeleccionados, setIngredientesSeleccionados] =
    useState([]);

  // ==========================================
  // CARGAR PRODUCTOS
  // ==========================================

  useEffect(() => {
    let activo = true;

    const cargarProductos = async () => {
      try {
        setCargando(true);
        setError("");

        const datos = await obtenerProductos(token);

        if (activo) {
          setProductos(Array.isArray(datos) ? datos : []);
        }
      } catch (error) {
        if (!activo) return;

        console.error("Error al cargar ingredientes:", error);

        if (error.status === 401) {
          onLogout();
          return;
        }

        setError(
          error.message ||
            "No se pudieron cargar los ingredientes."
        );
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    cargarProductos();

    return () => {
      activo = false;
    };
  }, [token, onLogout]);

  // ==========================================
  // PRODUCTOS CON EXISTENCIAS
  // ==========================================

  const productosDisponibles = useMemo(() => {
    return productos
      .filter((producto) => Number(producto.quantity) > 0)
      .sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", "es", {
          sensitivity: "base",
        })
      );
  }, [productos]);

  // ==========================================
  // PRODUCTOS CRÍTICOS: 0 A 3 DÍAS
  // ==========================================

  const productosCriticos = useMemo(() => {
    return productosDisponibles
      .filter((producto) => {
        if (producto.days_remaining == null) {
          return false;
        }

        const dias = Number(producto.days_remaining);

        return (
          Number.isFinite(dias) &&
          dias >= 0 &&
          dias <= 3
        );
      })
      .sort(
        (a, b) =>
          Number(a.days_remaining) -
          Number(b.days_remaining)
      );
  }, [productosDisponibles]);

  // ==========================================
  // PRODUCTOS MOSTRADOS SEGÚN EL MODO
  // ==========================================

  const productosElegibles =
    modo === OPCIONES.LIBRE
      ? productosDisponibles
      : productosCriticos;

  // ==========================================
  // INGREDIENTES PARA LA CONSULTA
  // ==========================================

  const ingredientesParaBuscar = useMemo(() => {
    if (modo === OPCIONES.TODOS) {
      return productosCriticos;
    }

    const idsSeleccionados = new Set(
      ingredientesSeleccionados
    );

    return productosElegibles.filter((producto) =>
      idsSeleccionados.has(String(producto.id))
    );
  }, [
    modo,
    productosCriticos,
    productosElegibles,
    ingredientesSeleccionados,
  ]);

  // ==========================================
  // CAMBIAR MODO
  // ==========================================

  const cambiarModo = (nuevoModo) => {
    setModo(nuevoModo);
    setIngredientesSeleccionados([]);
  };

  // ==========================================
  // SELECCIONAR INGREDIENTES
  // ==========================================

  const alternarIngrediente = (productoId) => {
    const id = String(productoId);

    setIngredientesSeleccionados((anteriores) =>
      anteriores.includes(id)
        ? anteriores.filter((actual) => actual !== id)
        : [...anteriores, id]
    );
  };

  // ==========================================
  // NOMBRES SIN REPETICIONES
  // ==========================================

  const nombresIngredientes = useMemo(() => {
    const nombres = ingredientesParaBuscar
      .map((producto) => String(producto.name || "").trim())
      .filter(Boolean);

    return [...new Set(nombres)];
  }, [ingredientesParaBuscar]);

  // ==========================================
  // BÚSQUEDA EN GOOGLE
  // ==========================================

  const buscarRecetas = () => {
    if (nombresIngredientes.length === 0) {
      return;
    }

    const consulta =
      `recetas con ${nombresIngredientes.join(" ")}`;

    const url =
      "https://www.google.com/search?q=" +
      encodeURIComponent(consulta);

    window.open(url, "_blank", "noopener,noreferrer");
  };

  // ==========================================
  // TEXTO DE CADUCIDAD
  // ==========================================

  const obtenerTextoDias = (producto) => {
    const dias = Number(producto.days_remaining);

    if (producto.days_remaining == null) {
      return "Sin fecha de caducidad";
    }

    if (dias < 0) {
      return "Caducado";
    }

    if (dias === 0) {
      return "Caduca hoy";
    }

    if (dias === 1) {
      return "Caduca mañana";
    }

    return `Faltan ${dias} días`;
  };

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <AppLayout
      usuario={usuario}
      fotoPerfilUrl={fotoPerfilUrl}
      paginaActual="recipes"
      titulo="¿Qué puedo cocinar?"
      onCambiarPagina={onCambiarPagina}
      onLogout={onLogout}
      notificaciones={notificaciones}
      cargandoNotificaciones={cargandoNotificaciones}
      onRecargarNotificaciones={onRecargarNotificaciones}
      onNotificacionLeida={onNotificacionLeida}
      onMarcarTodasLeidas={onMarcarTodasLeidas}
    >
      <div className="recipes-page">
        <section className="recipes-hero">
          <span className="recipes-eyebrow">
            COCINA ANTIDESPERDICIO
          </span>

          <h1>¿Qué puedo cocinar?</h1>

          <p>
            Aprovecha los alimentos de tu despensa
            para encontrar recetas y evitar que se
            desperdicien.
          </p>
        </section>

        {cargando && (
          <div className="recipes-state">
            <p>⏳ Cargando ingredientes...</p>
          </div>
        )}

        {!cargando && error && (
          <div className="recipes-state recipes-error" role="alert">
            <h3>No pudimos cargar tu despensa</h3>
            <p>{error}</p>
          </div>
        )}

        {!cargando && !error && (
          <>
            <section className="recipes-section">
              <div className="recipes-section-heading">
                <span className="recipes-eyebrow">
                  PASO 1
                </span>

                <h2>Elige cómo quieres cocinar</h2>

                <p>
                  Selecciona una de las tres opciones.
                </p>
              </div>

              <div className="recipes-options">
                <button
                  type="button"
                  className={`recipes-option ${
                    modo === OPCIONES.TODOS ? "active" : ""
                  }`}
                  onClick={() => cambiarModo(OPCIONES.TODOS)}
                  aria-pressed={modo === OPCIONES.TODOS}
                >
                  <span className="recipes-option-icon">
                    🍲
                  </span>

                  <strong>
                    Usar todos los próximos a caducar
                  </strong>

                  <span>
                    Buscar recetas con todos los productos
                    que caducan entre 0 y 3 días.
                  </span>

                  <small>
                    {productosCriticos.length} disponibles
                  </small>
                </button>

                <button
                  type="button"
                  className={`recipes-option ${
                    modo === OPCIONES.CRITICOS ? "active" : ""
                  }`}
                  onClick={() => cambiarModo(OPCIONES.CRITICOS)}
                  aria-pressed={modo === OPCIONES.CRITICOS}
                >
                  <span className="recipes-option-icon">
                    🥑
                  </span>

                  <strong>
                    Elegir productos próximos a caducar
                  </strong>

                  <span>
                    Selecciona únicamente los alimentos
                    próximos a caducar que quieras utilizar.
                  </span>

                  <small>
                    {productosCriticos.length} para elegir
                  </small>
                </button>

                <button
                  type="button"
                  className={`recipes-option ${
                    modo === OPCIONES.LIBRE ? "active" : ""
                  }`}
                  onClick={() => cambiarModo(OPCIONES.LIBRE)}
                  aria-pressed={modo === OPCIONES.LIBRE}
                >
                  <span className="recipes-option-icon">
                    🧺
                  </span>

                  <strong>
                    Elegir ingredientes libremente
                  </strong>

                  <span>
                    Combina cualquier alimento disponible
                    de tu despensa.
                  </span>

                  <small>
                    {productosDisponibles.length} disponibles
                  </small>
                </button>
              </div>
            </section>

            <section className="recipes-section">
              <div className="recipes-section-heading">
                <span className="recipes-eyebrow">
                  PASO 2
                </span>

                <h2>
                  {modo === OPCIONES.TODOS
                    ? "Ingredientes detectados automáticamente"
                    : "Selecciona tus ingredientes"}
                </h2>

                <p>
                  {modo === OPCIONES.TODOS
                    ? "Estos son los alimentos que utilizaremos para buscar recetas."
                    : "Marca uno o varios alimentos para incluirlos en la búsqueda."}
                </p>
              </div>

              {productosElegibles.length === 0 ? (
                <div className="recipes-empty">
                  <span>🌿</span>

                  <h3>
                    {modo === OPCIONES.LIBRE
                      ? "No tienes alimentos disponibles"
                      : "No hay productos próximos a caducar"}
                  </h3>

                  <p>
                    {modo === OPCIONES.LIBRE
                      ? "Agrega alimentos a tu despensa para buscar recetas."
                      : "Puedes elegir la opción libre para cocinar con otros alimentos."}
                  </p>

                  <button
                    type="button"
                    onClick={() => onCambiarPagina("pantry")}
                  >
                    Ver mi despensa
                  </button>
                </div>
              ) : (
                <div className="recipes-ingredients">
                  {productosElegibles.map((producto) => {
                    const seleccionado =
                      modo === OPCIONES.TODOS ||
                      ingredientesSeleccionados.includes(
                        String(producto.id)
                      );

                    return (
                      <label
                        key={producto.id}
                        className={`recipes-ingredient ${
                          seleccionado ? "selected" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={seleccionado}
                          disabled={modo === OPCIONES.TODOS}
                          onChange={() =>
                            alternarIngrediente(producto.id)
                          }
                        />

                        <div className="recipes-ingredient-info">
                          <strong>{producto.name}</strong>

                          <span>
                            {producto.quantity} {producto.unit}
                            {" · "}
                            {producto.location || "Sin ubicación"}
                          </span>
                        </div>

                        <small>
                          {obtenerTextoDias(producto)}
                        </small>
                      </label>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="recipes-search-panel">
              <div>
                <span className="recipes-eyebrow">
                  PASO 3
                </span>

                <h2>Encuentra una receta</h2>

                <p>
                  {nombresIngredientes.length === 0
                    ? "Selecciona al menos un ingrediente para continuar."
                    : `Buscarás recetas con ${nombresIngredientes.length} ${
                        nombresIngredientes.length === 1
                          ? "ingrediente"
                          : "ingredientes"
                      }.`}
                </p>

                {nombresIngredientes.length > 0 && (
                  <div className="recipes-selected-tags">
                    {nombresIngredientes.map((nombre) => (
                      <span key={nombre}>{nombre}</span>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="recipes-search-button"
                onClick={buscarRecetas}
                disabled={nombresIngredientes.length === 0}
              >
                🔎 Buscar recetas en Google ↗
              </button>
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
}

export default Recipes;
