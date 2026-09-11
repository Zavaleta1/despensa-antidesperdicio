import { useEffect, useState } from "react";

function App() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [formulario, setFormulario] = useState({
    category_id: "",
    name: "",
    quantity: "",
    unit: "",
    expiration_date: "",
    location: "",
    notes: "",
    status: "Disponible",
  });


  // ==========================================
  // CARGAR PRODUCTOS Y CATEGORÍAS
  // ==========================================

  useEffect(() => {
    cargarProductos();
    cargarCategorias();
  }, []);


  const cargarProductos = () => {
    fetch("http://localhost:3000/api/products")
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error("No se pudieron obtener los productos");
        }

        return respuesta.json();
      })
      .then((datos) => {
        console.log("Productos recibidos:", datos);
        setProductos(datos);
        setCargando(false);
      })
      .catch((error) => {
        console.error("Error:", error);
        setError("No se pudieron cargar los productos.");
        setCargando(false);
      });
  };


  const cargarCategorias = () => {
    fetch("http://localhost:3000/api/categories")
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error("No se pudieron obtener las categorías");
        }

        return respuesta.json();
      })
      .then((datos) => {
        console.log("Categorías recibidas:", datos);
        setCategorias(datos);
      })
      .catch((error) => {
        console.error("Error categorías:", error);
      });
  };


  // ==========================================
  // CAMBIAR CAMPOS DEL FORMULARIO
  // ==========================================

  const cambiarCampo = (evento) => {
    const { name, value } = evento.target;

    setFormulario({
      ...formulario,
      [name]: value,
    });
  };


  // ==========================================
  // AGREGAR PRODUCTO
  // ==========================================

  const agregarProducto = async (evento) => {
    evento.preventDefault();

    setGuardando(true);

    try {
      const respuesta = await fetch(
        "http://localhost:3000/api/products",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            user_id: 1,
            category_id: Number(formulario.category_id),
            name: formulario.name,
            quantity: Number(formulario.quantity),
            unit: formulario.unit,
            expiration_date: formulario.expiration_date,
            location: formulario.location,
            notes: formulario.notes,
            status: formulario.status,
          }),
        }
      );


      const datos = await respuesta.json();


      if (!respuesta.ok) {
        throw new Error(
          datos.message || "No se pudo agregar el producto"
        );
      }


      console.log("Producto agregado:", datos);


      // Cerrar formulario
      setMostrarFormulario(false);


      // Limpiar formulario
      setFormulario({
        category_id: "",
        name: "",
        quantity: "",
        unit: "",
        expiration_date: "",
        location: "",
        notes: "",
        status: "Disponible",
      });


      // Recargar productos
      cargarProductos();


      alert("✅ Producto agregado correctamente");


    } catch (error) {

      console.error("Error:", error);

      alert(
        "❌ No se pudo agregar el producto: " +
        error.message
      );

    } finally {
      setGuardando(false);
    }
  };


  // ==========================================
  // FORMATO DE FECHA
  // ==========================================

  const formatearFecha = (fecha) => {
    if (!fecha) return "";

    const fechaParte = fecha.substring(0, 10);

    const partes = fechaParte.split("-");

    if (partes.length !== 3) {
      return fecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };


  // ==========================================
  // ABRIR FORMULARIO
  // ==========================================

  const abrirFormulario = () => {
    setMostrarFormulario(true);
  };


  // ==========================================
  // CERRAR FORMULARIO
  // ==========================================

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
  };


  return (
    <div style={estilos.contenedor}>

      {/* ======================================
          ENCABEZADO
      ====================================== */}

      <header style={estilos.encabezado}>

        <h1>
          🥫 Despensa Antidesperdicio
        </h1>

        <p>
          Sistema de gestión de alimentos
        </p>

      </header>


      {/* ======================================
          CONTENIDO
      ====================================== */}

      <main style={estilos.contenido}>

        <section style={estilos.tarjeta}>

          <div style={estilos.tituloSeccion}>

            <div>

              <h2>
                Mis productos
              </h2>

              <p>
                Alimentos registrados en la despensa
              </p>

            </div>


            <button
              style={estilos.boton}
              onClick={abrirFormulario}
            >
              + Agregar producto
            </button>

          </div>


          {/* ==================================
              FORMULARIO
          ================================== */}

          {mostrarFormulario && (

            <div style={estilos.formularioContenedor}>

              <h2>
                Agregar nuevo producto
              </h2>


              <form onSubmit={agregarProducto}>

                <div style={estilos.formGrid}>


                  {/* Nombre */}

                  <div style={estilos.campo}>

                    <label>
                      Nombre del producto
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={formulario.name}
                      onChange={cambiarCampo}
                      placeholder="Ej. Arroz"
                      required
                    />

                  </div>


                  {/* Categoría */}

                  <div style={estilos.campo}>

                    <label>
                      Categoría
                    </label>

                    <select
                      name="category_id"
                      value={formulario.category_id}
                      onChange={cambiarCampo}
                      required
                    >

                      <option value="">
                        Selecciona una categoría
                      </option>

                      {categorias.map((categoria) => (

                        <option
                          key={categoria.id}
                          value={categoria.id}
                        >
                          {categoria.name}
                        </option>

                      ))}

                    </select>

                  </div>


                  {/* Cantidad */}

                  <div style={estilos.campo}>

                    <label>
                      Cantidad
                    </label>

                    <input
                      type="number"
                      name="quantity"
                      value={formulario.quantity}
                      onChange={cambiarCampo}
                      placeholder="Ej. 2"
                      min="0.01"
                      step="0.01"
                      required
                    />

                  </div>


                  {/* Unidad */}

                  <div style={estilos.campo}>

                    <label>
                      Unidad
                    </label>

                    <select
                      name="unit"
                      value={formulario.unit}
                      onChange={cambiarCampo}
                      required
                    >

                      <option value="">
                        Selecciona una unidad
                      </option>

                      <option value="piezas">
                        Piezas
                      </option>

                      <option value="kg">
                        Kilogramos
                      </option>

                      <option value="g">
                        Gramos
                      </option>

                      <option value="litros">
                        Litros
                      </option>

                      <option value="ml">
                        Mililitros
                      </option>

                    </select>

                  </div>


                  {/* Fecha */}

                  <div style={estilos.campo}>

                    <label>
                      Fecha de caducidad
                    </label>

                    <input
                      type="date"
                      name="expiration_date"
                      value={formulario.expiration_date}
                      onChange={cambiarCampo}
                      required
                    />

                  </div>


                  {/* Ubicación */}

                  <div style={estilos.campo}>

                    <label>
                      Ubicación
                    </label>

                    <select
                      name="location"
                      value={formulario.location}
                      onChange={cambiarCampo}
                      required
                    >

                      <option value="">
                        Selecciona una ubicación
                      </option>

                      <option value="Refrigerador">
                        Refrigerador
                      </option>

                      <option value="Congelador">
                        Congelador
                      </option>

                      <option value="Despensa">
                        Despensa
                      </option>

                      <option value="Alacena">
                        Alacena
                      </option>

                    </select>

                  </div>


                  {/* Estado */}

                  <div style={estilos.campo}>

                    <label>
                      Estado
                    </label>

                    <select
                      name="status"
                      value={formulario.status}
                      onChange={cambiarCampo}
                    >

                      <option value="Disponible">
                        Disponible
                      </option>

                      <option value="Por caducar">
                        Por caducar
                      </option>

                      <option value="Agotado">
                        Agotado
                      </option>

                    </select>

                  </div>


                  {/* Notas */}

                  <div style={estilos.campoCompleto}>

                    <label>
                      Notas
                    </label>

                    <textarea
                      name="notes"
                      value={formulario.notes}
                      onChange={cambiarCampo}
                      placeholder="Notas adicionales..."
                      rows="3"
                    />

                  </div>

                </div>


                {/* Botones */}

                <div style={estilos.botonesFormulario}>

                  <button
                    type="button"
                    style={estilos.botonCancelar}
                    onClick={cerrarFormulario}
                    disabled={guardando}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    style={estilos.botonGuardar}
                    disabled={guardando}
                  >
                    {guardando
                      ? "Guardando..."
                      : "Guardar producto"}
                  </button>

                </div>

              </form>

            </div>

          )}


          {/* ==================================
              CARGANDO
          ================================== */}

          {cargando && (

            <div style={estilos.mensaje}>
              🔄 Cargando productos...
            </div>

          )}


          {/* ==================================
              ERROR
          ================================== */}

          {error && (

            <div style={estilos.error}>
              ❌ {error}
            </div>

          )}


          {/* ==================================
              SIN PRODUCTOS
          ================================== */}

          {!cargando &&
            !error &&
            productos.length === 0 && (

              <div style={estilos.vacio}>

                <div style={estilos.iconoVacio}>
                  📦
                </div>

                <h3>
                  No hay productos registrados
                </h3>

                <p>
                  Todavía no tienes alimentos
                  registrados en tu despensa.
                </p>

                <button
                  style={estilos.botonVacio}
                  onClick={abrirFormulario}
                >
                  + Agregar primer producto
                </button>

              </div>

            )}


          {/* ==================================
              PRODUCTOS
          ================================== */}

          {!cargando &&
            !error &&
            productos.length > 0 && (

              <div style={estilos.productos}>

                {productos.map((producto) => (

                  <div
                    key={producto.id}
                    style={estilos.producto}
                  >

                    <h3>
                      {producto.name}
                    </h3>


                    <p>
                      <strong>
                        Cantidad:
                      </strong>{" "}
                      {producto.quantity}{" "}
                      {producto.unit}
                    </p>


                    <p>
                      <strong>
                        Caducidad:
                      </strong>{" "}
                      {formatearFecha(
                        producto.expiration_date
                      )}
                    </p>


                    <p>
                      <strong>
                        Ubicación:
                      </strong>{" "}
                      {producto.location}
                    </p>


                    {producto.status && (

                      <span style={estilos.estado}>
                        {producto.status}
                      </span>

                    )}

                  </div>

                ))}

              </div>

            )}

        </section>

      </main>

    </div>
  );
}


// ==========================================
// ESTILOS
// ==========================================

const estilos = {

  contenedor: {
    minHeight: "100vh",
    backgroundColor: "#f4f7f5",
    fontFamily: "Arial, sans-serif",
    color: "#263238",
  },

  encabezado: {
    backgroundColor: "#2e7d32",
    color: "white",
    padding: "30px",
    textAlign: "center",
  },

  contenido: {
    maxWidth: "1100px",
    margin: "40px auto",
    padding: "0 20px",
  },

  tarjeta: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "30px",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
  },

  tituloSeccion: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },

  boton: {
    backgroundColor: "#2e7d32",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "12px 20px",
    fontSize: "15px",
    cursor: "pointer",
  },

  mensaje: {
    padding: "20px",
    textAlign: "center",
    color: "#555",
  },

  error: {
    backgroundColor: "#ffebee",
    color: "#c62828",
    padding: "15px",
    borderRadius: "8px",
  },

  vacio: {
    textAlign: "center",
    padding: "60px 20px",
    border: "2px dashed #ddd",
    borderRadius: "10px",
  },

  iconoVacio: {
    fontSize: "50px",
    marginBottom: "15px",
  },

  botonVacio: {
    backgroundColor: "#2e7d32",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "12px 20px",
    fontSize: "15px",
    cursor: "pointer",
    marginTop: "15px",
  },

  productos: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
  },

  producto: {
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "20px",
    backgroundColor: "#fafafa",
  },

  estado: {
    display: "inline-block",
    marginTop: "10px",
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "13px",
  },

  formularioContenedor: {
    backgroundColor: "#f8faf8",
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "25px",
    marginBottom: "30px",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
  },

  campo: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  campoCompleto: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    gridColumn: "1 / -1",
  },

  botonesFormulario: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "25px",
  },

  botonCancelar: {
    backgroundColor: "#eeeeee",
    color: "#333",
    border: "none",
    borderRadius: "8px",
    padding: "12px 20px",
    fontSize: "15px",
    cursor: "pointer",
  },

  botonGuardar: {
    backgroundColor: "#2e7d32",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "12px 20px",
    fontSize: "15px",
    cursor: "pointer",
  },
};


export default App;