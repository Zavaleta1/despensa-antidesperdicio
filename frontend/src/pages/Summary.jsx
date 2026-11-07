
import { Fragment, useEffect, useState } from "react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import AppLayout from "../components/layout/AppLayout";

import {
  obtenerHistorialMovimientos,
  obtenerHistorialAuditoria,
} from "../services/productService";

import "../styles/summary.css";

// ==========================================
// COLORES
// ==========================================

const COLORES = {
  consumed: "#16a34a",
  wasted: "#ef4444",
};

// ==========================================
// FUNCIONES DE FECHAS
// ==========================================

function obtenerClaveFecha(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function generarDatosSemanales(movimientos) {
  const hoy = new Date();
  const dias = [];

  for (let i = 6; i >= 0; i--) {
    const fecha = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate() - i
    );

    dias.push({
      clave: obtenerClaveFecha(fecha),
      fecha: fecha.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
      }),
      consumidos: 0,
      desperdiciados: 0,
    });
  }

  movimientos.forEach((movimiento) => {
    const fechaMovimiento = new Date(movimiento.created_at);

    if (Number.isNaN(fechaMovimiento.getTime())) {
      return;
    }

    const clave = obtenerClaveFecha(fechaMovimiento);
    const dia = dias.find((item) => item.clave === clave);

    if (!dia) return;

    if (movimiento.movement_type === "consumed") {
      dia.consumidos += 1;
    }

    if (movimiento.movement_type === "wasted") {
      dia.desperdiciados += 1;
    }
  });

  return dias;
}

// ==========================================
// CAMPOS DEL HISTORIAL DE AUDITORÍA
// ==========================================

const CAMPOS_AUDITORIA = [
  { clave: "name", etiqueta: "Nombre" },
  { clave: "category_id", etiqueta: "Categoría (ID)" },
  { clave: "quantity", etiqueta: "Cantidad" },
  { clave: "unit", etiqueta: "Unidad" },
  { clave: "expiration_date", etiqueta: "Caducidad" },
  { clave: "location", etiqueta: "Ubicación" },
  { clave: "notes", etiqueta: "Notas" },
  { clave: "status", etiqueta: "Estado" },
];

// ==========================================
// FORMATEAR VALORES DE AUDITORÍA
// ==========================================

function formatearValorAuditoria(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return "Sin información";
  }

  if (typeof valor === "object") {
    return JSON.stringify(valor);
  }

  return String(valor);
}

// ==========================================
// COMPARAR DATOS DE AUDITORÍA
// ==========================================

function obtenerCambiosAuditoria(registro) {
  const anterior = registro.previous_data || {};
  const nuevo = registro.new_data || {};

  return CAMPOS_AUDITORIA
    .filter(({ clave }) => {
      if (registro.action_type === "deleted") {
        return Object.prototype.hasOwnProperty.call(
          anterior,
          clave
        );
      }

      return (
        JSON.stringify(anterior[clave] ?? null) !==
        JSON.stringify(nuevo[clave] ?? null)
      );
    })
    .map(({ clave, etiqueta }) => ({
      clave,
      etiqueta,
      anterior: formatearValorAuditoria(anterior[clave]),
      nuevo: formatearValorAuditoria(nuevo[clave]),
    }));
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

function Summary({
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
  // ESTADOS DEL HISTORIAL DE MOVIMIENTOS
  // ==========================================

  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [periodo, setPeriodo] = useState("30");

  // ==========================================
  // ESTADOS DEL HISTORIAL DE AUDITORÍA
  // ==========================================

  const [auditoria, setAuditoria] = useState([]);
  const [cargandoAuditoria, setCargandoAuditoria] =
    useState(true);
  const [errorAuditoria, setErrorAuditoria] = useState("");
  const [filtroAuditoria, setFiltroAuditoria] =
    useState("todos");

  // ==========================================
  // PASO 95 - DETALLES DE AUDITORÍA
  // ==========================================

  const [detalleAbierto, setDetalleAbierto] =
    useState(null);

  const alternarDetalle = (id) => {
    setDetalleAbierto((actual) =>
      actual === id ? null : id
    );
  };

  // ==========================================
  // CARGAR HISTORIAL DE MOVIMIENTOS
  // ==========================================

  useEffect(() => {
    let activo = true;

    const cargarHistorial = async () => {
      setCargando(true);
      setError("");

      try {
        const datos = await obtenerHistorialMovimientos(token);

        if (activo) {
          setMovimientos(
            Array.isArray(datos) ? datos : []
          );
        }
      } catch (err) {
        if (!activo) return;

        console.error(
          "Error al cargar historial:",
          err
        );

        if (err.status === 401) {
          onLogout();
          return;
        }

        setError(
          err.message ||
            "No se pudo cargar el historial."
        );
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    cargarHistorial();

    return () => {
      activo = false;
    };
  }, [token, onLogout]);

  // ==========================================
  // CARGAR HISTORIAL DE AUDITORÍA
  // ==========================================

  useEffect(() => {
    let activo = true;

    const cargarAuditoria = async () => {
      setCargandoAuditoria(true);
      setErrorAuditoria("");

      try {
        const datos = await obtenerHistorialAuditoria(token);

        if (activo) {
          setAuditoria(
            Array.isArray(datos) ? datos : []
          );
        }
      } catch (err) {
        if (!activo) return;

        console.error(
          "Error al cargar auditoría:",
          err
        );

        if (err.status === 401) {
          onLogout();
          return;
        }

        setErrorAuditoria(
          err.message ||
            "No se pudo cargar el historial de actividad."
        );
      } finally {
        if (activo) {
          setCargandoAuditoria(false);
        }
      }
    };

    cargarAuditoria();

    return () => {
      activo = false;
    };
  }, [token, onLogout]);

  // ==========================================
  // FILTRAR POR PERÍODO
  // ==========================================

  const ahora = new Date();

  const inicioPeriodo = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate()
  );

  if (periodo !== "todos") {
    inicioPeriodo.setDate(
      inicioPeriodo.getDate() -
        Number(periodo) +
        1
    );
  }

  const estaEnPeriodo = (fechaValor) => {
    if (periodo === "todos") {
      return true;
    }

    const fecha = new Date(fechaValor);

    return (
      !Number.isNaN(fecha.getTime()) &&
      fecha >= inicioPeriodo
    );
  };

  const movimientosPeriodo = movimientos.filter(
    (movimiento) =>
      estaEnPeriodo(movimiento.created_at)
  );

  // ==========================================
  // ESTADÍSTICAS GENERALES
  // ==========================================

  const consumidos = movimientosPeriodo.filter(
    (movimiento) =>
      movimiento.movement_type === "consumed"
  );

  const desperdiciados = movimientosPeriodo.filter(
    (movimiento) =>
      movimiento.movement_type === "wasted"
  );

  const totalMovimientos =
    consumidos.length + desperdiciados.length;

  // ==========================================
  // INDICADORES DE APROVECHAMIENTO
  // ==========================================

  const porcentajeConsumo =
    totalMovimientos > 0
      ? (consumidos.length / totalMovimientos) * 100
      : 0;

  const porcentajeDesperdicio =
    totalMovimientos > 0
      ? (desperdiciados.length / totalMovimientos) * 100
      : 0;

  // ==========================================
  // PRODUCTOS CON MAYOR DESPERDICIO
  // ==========================================

  const frecuenciaDesperdicio = desperdiciados.reduce(
    (acumulado, movimiento) => {
      const nombre =
        String(
          movimiento.product_name || "Sin nombre"
        ).trim() || "Sin nombre";

      const clave = nombre.toLocaleLowerCase("es-MX");

      if (!acumulado[clave]) {
        acumulado[clave] = {
          nombre,
          registros: 0,
        };
      }

      acumulado[clave].registros += 1;

      return acumulado;
    },
    {}
  );

  const productosMasDesperdiciados =
    Object.values(frecuenciaDesperdicio)
      .sort(
        (a, b) =>
          b.registros - a.registros ||
          a.nombre.localeCompare(b.nombre, "es-MX")
      )
      .slice(0, 5);

  const maximoDesperdicios =
    productosMasDesperdiciados[0]?.registros || 0;

  // ==========================================
  // DATOS DE LAS GRÁFICAS
  // ==========================================

  const datosGraficaCircular = [
    {
      nombre: "Consumidos",
      cantidad: consumidos.length,
      color: COLORES.consumed,
    },
    {
      nombre: "Desperdiciados",
      cantidad: desperdiciados.length,
      color: COLORES.wasted,
    },
  ];

  const datosGraficaSemanal =
    generarDatosSemanales(movimientosPeriodo);

  // ==========================================
  // FILTROS DEL HISTORIAL DE MOVIMIENTOS
  // ==========================================

  const movimientosFiltrados =
    movimientosPeriodo.filter(
      (movimiento) =>
        filtro === "todos" ||
        movimiento.movement_type === filtro
    );

  // ==========================================
  // FILTROS DEL HISTORIAL DE AUDITORÍA
  // ==========================================

  const auditoriaFiltrada = auditoria.filter(
    (registro) =>
      (filtroAuditoria === "todos" ||
        registro.action_type === filtroAuditoria) &&
      estaEnPeriodo(registro.created_at)
  );

  // ==========================================
  // FORMATEAR FECHA
  // ==========================================

  const formatearFecha = (fecha) => {
    if (!fecha) {
      return "Sin fecha";
    }

    const fechaMovimiento = new Date(fecha);

    if (Number.isNaN(fechaMovimiento.getTime())) {
      return "Fecha no disponible";
    }

    return fechaMovimiento.toLocaleString("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // ==========================================
  // EXPORTAR HISTORIAL DE MOVIMIENTOS A CSV
  // ==========================================

  const exportarHistorialCSV = () => {
    if (movimientosFiltrados.length === 0) {
      return;
    }

    const escaparCSV = (valor) => {
      const texto = String(valor ?? "");

      const seguro = /^[\s]*[=+\-@\t\r]/.test(texto)
        ? `'${texto}`
        : texto;

      return `"${seguro.replace(/"/g, '""')}"`;
    };

    const encabezados = [
      "Fecha",
      "Producto",
      "Tipo",
      "Cantidad",
      "Unidad",
    ];

    const filas = movimientosFiltrados.map(
      (movimiento) => [
        formatearFecha(movimiento.created_at),
        movimiento.product_name,
        movimiento.movement_type === "consumed"
          ? "Consumido"
          : "Desperdiciado",
        movimiento.quantity,
        movimiento.unit,
      ]
    );

    const contenido = [encabezados, ...filas]
      .map((fila) =>
        fila.map(escaparCSV).join(";")
      )
      .join("\r\n");

    const blob = new Blob(
      ["\uFEFF", contenido],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");

    enlace.href = url;

    enlace.download = `historial-despensa-${periodo}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    setTimeout(
      () => URL.revokeObjectURL(url),
      1000
    );
  };

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <AppLayout
      usuario={usuario}
      fotoPerfilUrl={fotoPerfilUrl}
      paginaActual="summary"
      titulo="Resumen"
      onCambiarPagina={onCambiarPagina}
      onLogout={onLogout}
      notificaciones={notificaciones}
      cargandoNotificaciones={cargandoNotificaciones}
      onRecargarNotificaciones={onRecargarNotificaciones}
      onNotificacionLeida={onNotificacionLeida}
      onMarcarTodasLeidas={onMarcarTodasLeidas}
    >
      <section className="summary-page">

        {/* ======================================
            ENCABEZADO
        ====================================== */}

        <h1>📊 Resumen de tu despensa</h1>

        <p>
          Consulta tus movimientos de consumo
          y desperdicio de alimentos.
        </p>

        {/* ======================================
            SELECTOR DE PERÍODO
        ====================================== */}

        <section
          className="summary-period"
          aria-label="Período de análisis"
        >
          <h2>📅 Período de análisis</h2>

          <div
            className="summary-period-options"
            role="group"
            aria-label="Seleccionar período"
          >
            {[
              { value: "7", label: "7 días" },
              { value: "30", label: "30 días" },
              { value: "90", label: "90 días" },
              {
                value: "todos",
                label: "Todo el historial",
              },
            ].map((opcion) => (
              <button
                key={opcion.value}
                type="button"
                className={
                  periodo === opcion.value
                    ? "active"
                    : ""
                }
                aria-pressed={
                  periodo === opcion.value
                }
                onClick={() =>
                  setPeriodo(opcion.value)
                }
              >
                {opcion.label}
              </button>
            ))}
          </div>

          <small>
            {periodo === "todos"
              ? "Mostrando todo el historial registrado."
              : `Mostrando los últimos ${periodo} días, incluido hoy.`}
          </small>
        </section>

        {/* ======================================
            TARJETAS DE ESTADÍSTICAS
        ====================================== */}

        {!cargando && !error && (
          <div className="summary-stats">
            <article>
              <h3>Movimientos registrados</h3>
              <strong>
                {movimientosPeriodo.length}
              </strong>
            </article>

            <article>
              <h3>Consumos registrados</h3>
              <strong>{consumidos.length}</strong>
            </article>

            <article>
              <h3>Desperdicios registrados</h3>
              <strong>
                {desperdiciados.length}
              </strong>
            </article>
          </div>
        )}

        {/* ======================================
            INDICADORES DE APROVECHAMIENTO
        ====================================== */}

        {!cargando && !error && (
          <section
            className="summary-efficiency"
            aria-label="Indicadores de aprovechamiento"
          >
            <h2>
              Indicadores de aprovechamiento
            </h2>

            <p>
              Porcentaje de registros de consumo
              y desperdicio en el período
              seleccionado.
            </p>

            {totalMovimientos === 0 ? (
              <p className="summary-empty">
                Aún no hay movimientos para
                calcular los porcentajes.
              </p>
            ) : (
              <>
                <div className="summary-efficiency-stats">
                  <div>
                    <span>
                      🍽️ Movimientos de consumo
                    </span>

                    <strong className="summary-efficiency-consumed">
                      {porcentajeConsumo.toFixed(1)}%
                    </strong>
                  </div>

                  <div>
                    <span>
                      🗑️ Movimientos de desperdicio
                    </span>

                    <strong className="summary-efficiency-wasted">
                      {porcentajeDesperdicio.toFixed(1)}%
                    </strong>
                  </div>
                </div>

                <div
                  className="summary-efficiency-bar"
                  role="img"
                  aria-label={`Consumo: ${porcentajeConsumo.toFixed(
                    1
                  )}%. Desperdicio: ${porcentajeDesperdicio.toFixed(
                    1
                  )}%.`}
                >
                  <div
                    className="summary-efficiency-bar-consumed"
                    style={{
                      width: `${porcentajeConsumo}%`,
                    }}
                  />

                  <div
                    className="summary-efficiency-bar-wasted"
                    style={{
                      width: `${porcentajeDesperdicio}%`,
                    }}
                  />
                </div>

                <small>
                  Estos porcentajes representan
                  movimientos, no cantidades de
                  alimentos.
                </small>
              </>
            )}
          </section>
        )}

        {/* ======================================
            GRÁFICAS
        ====================================== */}

        {!cargando && !error && (
          <div className="summary-charts">

            {/* GRÁFICA CIRCULAR */}

            <article className="summary-chart-card">
              <h2>Consumo vs. desperdicio</h2>

              <p>
                Proporción de movimientos
                registrados.
              </p>

              {totalMovimientos === 0 ? (
                <div className="summary-chart-empty">
                  No hay datos para mostrar.
                </div>
              ) : (
                <div className="summary-chart-container">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>
                      <Pie
                        data={datosGraficaCircular}
                        dataKey="cantidad"
                        nameKey="nombre"
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                      >
                        {datosGraficaCircular.map(
                          (item) => (
                            <Cell
                              key={item.nombre}
                              fill={item.color}
                            />
                          )
                        )}
                      </Pie>

                      <Tooltip
                        formatter={(valor) => [
                          valor,
                          "Movimientos",
                        ]}
                      />

                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>

            {/* GRÁFICA DE BARRAS */}

            <article className="summary-chart-card">
              <h2>Movimientos por día</h2>

              <p>
                Consumos y desperdicios de los
                últimos 7 días.
              </p>

              {movimientosPeriodo.length === 0 ? (
                <div className="summary-chart-empty">
                  No hay datos para mostrar.
                </div>
              ) : (
                <div className="summary-chart-container">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={datosGraficaSemanal}
                      margin={{
                        top: 15,
                        right: 15,
                        left: -15,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="fecha"
                        tick={{
                          fontSize: 12,
                        }}
                      />

                      <YAxis
                        allowDecimals={false}
                        tick={{
                          fontSize: 12,
                        }}
                      />

                      <Tooltip />
                      <Legend />

                      <Bar
                        dataKey="consumidos"
                        name="Consumidos"
                        fill={COLORES.consumed}
                        radius={[5, 5, 0, 0]}
                      />

                      <Bar
                        dataKey="desperdiciados"
                        name="Desperdiciados"
                        fill={COLORES.wasted}
                        radius={[5, 5, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>
          </div>
        )}

        {/* ======================================
            PRODUCTOS CON MAYOR DESPERDICIO
        ====================================== */}

        {!cargando && !error && (
          <section
            className="summary-top-waste"
            aria-label="Productos con mayor desperdicio"
          >
            <h2>
              🗑️ Productos con mayor desperdicio
            </h2>

            <p>
              Productos ordenados por número de
              registros de desperdicio. Se
              muestran hasta cinco.
            </p>

            {productosMasDesperdiciados.length === 0 ? (
              <p className="summary-empty">
                Aún no hay desperdicios registrados
                en este período.
              </p>
            ) : (
              <div className="summary-top-waste-list">
                {productosMasDesperdiciados.map(
                  (producto) => (
                    <div
                      className="summary-top-waste-item"
                      key={producto.nombre.toLocaleLowerCase(
                        "es-MX"
                      )}
                    >
                      <div className="summary-top-waste-row">
                        <strong>
                          {producto.nombre}
                        </strong>

                        <span>
                          {producto.registros}{" "}
                          {producto.registros === 1
                            ? "registro"
                            : "registros"}
                        </span>
                      </div>

                      <div
                        className="summary-top-waste-track"
                        aria-hidden="true"
                      >
                        <div
                          className="summary-top-waste-fill"
                          style={{
                            width: `${
                              (producto.registros /
                                maximoDesperdicios) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            <small>
              Este ranking cuenta movimientos,
              no suma cantidades ni compara
              unidades.
            </small>
          </section>
        )}

        {/* ======================================
            HISTORIAL DE MOVIMIENTOS
        ====================================== */}

        <div className="summary-history">
          <h2>Historial de movimientos</h2>

          {/* EXPORTAR CSV */}

          <div className="summary-export">
            <button
              type="button"
              onClick={exportarHistorialCSV}
              disabled={
                cargando ||
                Boolean(error) ||
                movimientosFiltrados.length === 0
              }
            >
              📥 Exportar historial CSV
            </button>
          </div>

          {/* FILTROS */}

          <div
            className="summary-filters"
            role="group"
            aria-label="Filtrar movimientos"
          >
            <button
              type="button"
              className={
                filtro === "todos" ? "active" : ""
              }
              aria-pressed={filtro === "todos"}
              onClick={() => setFiltro("todos")}
            >
              Todos
            </button>

            <button
              type="button"
              className={
                filtro === "consumed"
                  ? "active"
                  : ""
              }
              aria-pressed={filtro === "consumed"}
              onClick={() => setFiltro("consumed")}
            >
              🍽️ Consumidos
            </button>

            <button
              type="button"
              className={
                filtro === "wasted" ? "active" : ""
              }
              aria-pressed={filtro === "wasted"}
              onClick={() => setFiltro("wasted")}
            >
              🗑️ Desperdiciados
            </button>
          </div>

          {/* ESTADO DE CARGA */}

          {cargando && (
            <p>Cargando historial...</p>
          )}

          {/* ERROR */}

          {!cargando && error && (
            <p
              role="alert"
              className="summary-error"
            >
              ❌ {error}
            </p>
          )}

          {/* SIN MOVIMIENTOS */}

          {!cargando &&
            !error &&
            movimientosPeriodo.length === 0 && (
              <p className="summary-empty">
                No hay movimientos registrados
                en el período seleccionado.
              </p>
            )}

          {/* FILTRO SIN RESULTADOS */}

          {!cargando &&
            !error &&
            movimientosPeriodo.length > 0 &&
            movimientosFiltrados.length === 0 && (
              <p className="summary-empty">
                No hay movimientos registrados
                para el filtro seleccionado.
              </p>
            )}

          {/* TABLA DE MOVIMIENTOS */}

          {!cargando &&
            !error &&
            movimientosFiltrados.length > 0 && (
              <div className="summary-table-container">
                <table className="summary-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Producto</th>
                      <th>Tipo</th>
                      <th>Cantidad</th>
                      <th>Unidad</th>
                    </tr>
                  </thead>

                  <tbody>
                    {movimientosFiltrados.map(
                      (movimiento) => (
                        <tr key={movimiento.id}>
                          <td>
                            {formatearFecha(
                              movimiento.created_at
                            )}
                          </td>

                          <td>
                            {movimiento.product_name}
                          </td>

                          <td>
                            <span
                              className={
                                movimiento.movement_type ===
                                "consumed"
                                  ? "summary-type-consumed"
                                  : "summary-type-wasted"
                              }
                            >
                              {movimiento.movement_type ===
                              "consumed"
                                ? "🍽️ Consumido"
                                : "🗑️ Desperdiciado"}
                            </span>
                          </td>

                          <td>
                            {movimiento.quantity}
                          </td>

                          <td>
                            {movimiento.unit}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
        </div>

        {/* ======================================
            HISTORIAL DE ACTIVIDAD
        ====================================== */}

        <section
          className="summary-history summary-audit"
          aria-label="Historial de actividad"
        >
          <h2>📝 Historial de actividad</h2>

          <p>
            Consulta las ediciones y eliminaciones
            realizadas en tu despensa. Estas
            acciones no se cuentan como consumo
            ni desperdicio.
          </p>

          {/* FILTROS DE AUDITORÍA */}

          <div
            className="summary-filters"
            role="group"
            aria-label="Filtrar historial de actividad"
          >
            <button
              type="button"
              className={
                filtroAuditoria === "todos"
                  ? "active"
                  : ""
              }
              aria-pressed={
                filtroAuditoria === "todos"
              }
              onClick={() =>
                setFiltroAuditoria("todos")
              }
            >
              Todas
            </button>

            <button
              type="button"
              className={
                filtroAuditoria === "updated"
                  ? "active"
                  : ""
              }
              aria-pressed={
                filtroAuditoria === "updated"
              }
              onClick={() =>
                setFiltroAuditoria("updated")
              }
            >
              ✏️ Ediciones
            </button>

            <button
              type="button"
              className={
                filtroAuditoria === "deleted"
                  ? "active"
                  : ""
              }
              aria-pressed={
                filtroAuditoria === "deleted"
              }
              onClick={() =>
                setFiltroAuditoria("deleted")
              }
            >
              🗑️ Eliminaciones
            </button>
          </div>

          {/* ESTADO DE CARGA */}

          {cargandoAuditoria && (
            <p>
              Cargando historial de actividad...
            </p>
          )}

          {/* ERROR DE AUDITORÍA */}

          {!cargandoAuditoria && errorAuditoria && (
            <p
              role="alert"
              className="summary-error"
            >
              ❌ {errorAuditoria}
            </p>
          )}

          {/* SIN ACTIVIDADES */}

          {!cargandoAuditoria &&
            !errorAuditoria &&
            auditoriaFiltrada.length === 0 && (
              <p className="summary-empty">
                No hay actividades registradas
                para los filtros seleccionados.
              </p>
            )}

          {/* ======================================
              TABLA DE AUDITORÍA CON DETALLES
          ====================================== */}

          {!cargandoAuditoria &&
            !errorAuditoria &&
            auditoriaFiltrada.length > 0 && (
              <div className="summary-table-container">
                <table className="summary-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Producto</th>
                      <th>Acción</th>
                      <th>Detalles</th>
                    </tr>
                  </thead>

                  <tbody>
                    {auditoriaFiltrada.map((registro) => {
                      const abierto =
                        detalleAbierto === registro.id;

                      const cambios =
                        obtenerCambiosAuditoria(registro);

                      return (
                        <Fragment key={registro.id}>
                          <tr>
                            <td>
                              {formatearFecha(
                                registro.created_at
                              )}
                            </td>

                            <td>
                              {registro.product_name ||
                                "Producto sin nombre"}
                            </td>

                            <td>
                              <span
                                className={
                                  registro.action_type ===
                                  "updated"
                                    ? "summary-audit-updated"
                                    : "summary-audit-deleted"
                                }
                              >
                                {registro.action_type ===
                                "updated"
                                  ? "✏️ Editado"
                                  : "🗑️ Eliminado"}
                              </span>
                            </td>

                            <td>
                              <button
                                type="button"
                                className="summary-audit-detail-button"
                                aria-expanded={abierto}
                                onClick={() =>
                                  alternarDetalle(
                                    registro.id
                                  )
                                }
                              >
                                {abierto
                                  ? "Ocultar detalles"
                                  : "Ver detalles"}
                              </button>
                            </td>
                          </tr>

                          {/* DETALLES EXPANDIBLES */}

                          {abierto && (
                            <tr className="summary-audit-detail-row">
                              <td colSpan={4}>
                                <div className="summary-audit-detail-content">
                                  <h3>
                                    {registro.action_type ===
                                    "updated"
                                      ? "Cambios realizados"
                                      : "Información del producto eliminado"}
                                  </h3>

                                  {cambios.length === 0 ? (
                                    <p>
                                      No se detectaron
                                      cambios en los
                                      campos mostrados.
                                    </p>
                                  ) : (
                                    <div className="summary-audit-detail-scroll">
                                      <table className="summary-audit-comparison">
                                        <thead>
                                          <tr>
                                            <th>Campo</th>

                                            <th>
                                              {registro.action_type ===
                                              "deleted"
                                                ? "Información anterior"
                                                : "Antes"}
                                            </th>

                                            {registro.action_type ===
                                              "updated" && (
                                              <th>
                                                Después
                                              </th>
                                            )}
                                          </tr>
                                        </thead>

                                        <tbody>
                                          {cambios.map(
                                            (cambio) => (
                                              <tr
                                                key={
                                                  cambio.clave
                                                }
                                              >
                                                <td>
                                                  {
                                                    cambio.etiqueta
                                                  }
                                                </td>

                                                <td>
                                                  {
                                                    cambio.anterior
                                                  }
                                                </td>

                                                {registro.action_type ===
                                                  "updated" && (
                                                  <td>
                                                    {
                                                      cambio.nuevo
                                                    }
                                                  </td>
                                                )}
                                              </tr>
                                            )
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </section>
      </section>
    </AppLayout>
  );
}

export default Summary;
