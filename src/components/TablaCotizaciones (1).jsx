import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import ResumenAdmin from "./ResumenAdmin";

function TablaCotizaciones() {
  const [facturas, setFacturas] = useState([]);
  const [devoluciones, setDevoluciones] = useState([]);
  const [seccion, setSeccion] = useState("pedidos"); // "pedidos" o "devoluciones"
  
  // Pedidos states
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [loadingTable, setLoadingTable] = useState(true);
  const [detalles, setDetalles] = useState([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  // Devoluciones states
  const [loadingDevoluciones, setLoadingDevoluciones] = useState(false);

  const URL_FACTURAS = "http://localhost:3001/facturas";
  const URL_DEVOLUCIONES = "http://localhost:3001/devoluciones";

  // Cargar facturas
  const cargarFacturas = () => {
    setLoadingTable(true);
    fetch(URL_FACTURAS)
      .then((res) => {
        if (!res.ok) throw new Error("Error cargando facturas");
        return res.json();
      })
      .then((data) => {
        setFacturas(data);
        setLoadingTable(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingTable(false);
      });
  };

  // Cargar devoluciones
  const cargarDevoluciones = () => {
    setLoadingDevoluciones(true);
    fetch(URL_DEVOLUCIONES)
      .then((res) => {
        if (!res.ok) throw new Error("Error cargando devoluciones");
        return res.json();
      })
      .then((data) => {
        setDevoluciones(data);
        setLoadingDevoluciones(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingDevoluciones(false);
      });
  };

  useEffect(() => {
    cargarFacturas();
  }, []);

  useEffect(() => {
    if (seccion === "devoluciones") {
      cargarDevoluciones();
    }
  }, [seccion]);

  // Cargar detalles de un pedido específico
  const verDetalle = (factura) => {
    setFacturaSeleccionada(factura);
    setLoadingDetalle(true);
    setDetalles([]);

    fetch(`http://localhost:3001/pedido-detalle/${factura.idFacturas}`)
      .then((res) => {
        if (!res.ok) throw new Error("Error cargando detalles del pedido");
        return res.json();
      })
      .then((data) => {
        setDetalles(data);
        setLoadingDetalle(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingDetalle(false);
      });
  };

  // Cambiar estado del pedido
  const cambiarEstado = async (factura) => {
    const estadosValidos = ["Pendiente", "Preparando", "Enviado", "Entregado", "Cancelado"];

    const { value: nuevoEstado } = await Swal.fire({
      title: '<h5 class="fw-bold" style="color: #0047AB">Actualizar Estado</h5>',
      text: `Selecciona el nuevo estado para el pedido #${factura.idFacturas}:`,
      input: "select",
      inputOptions: estadosValidos.reduce((acc, est) => {
        acc[est] = est;
        return acc;
      }, {}),
      inputValue: factura.Estado || "Pendiente",
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#20B2AA",
      cancelButtonColor: "#6c757d",
      customClass: {
        popup: 'rounded-4'
      }
    });

    if (nuevoEstado) {
      try {
        const res = await fetch(`http://localhost:3001/facturas/${factura.idFacturas}/estado`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: nuevoEstado }),
        });

        if (!res.ok) throw new Error("Error al cambiar estado");

        Swal.fire({
          icon: "success",
          title: "Estado Actualizado",
          text: `El pedido #${factura.idFacturas} ahora está ${nuevoEstado}.`,
          confirmButtonColor: "#20B2AA",
          timer: 1500,
          showConfirmButton: false
        });

        // Actualizar estados locales
        setFacturas((prev) =>
          prev.map((f) => (f.idFacturas === factura.idFacturas ? { ...f, Estado: nuevoEstado } : f))
        );

        if (facturaSeleccionada?.idFacturas === factura.idFacturas) {
          setFacturaSeleccionada((prev) => ({ ...prev, Estado: nuevoEstado }));
        }

      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo actualizar el estado del pedido.",
          confirmButtonColor: "#0047AB"
        });
      }
    }
  };

  // Eliminar un pedido (cruce cascading delete)
  const eliminarFactura = async (id) => {
    const ok = await Swal.fire({
      title: "¿Eliminar pedido?",
      text: "Esta acción eliminará de forma permanente el pedido, sus detalles, entregas y devoluciones relacionadas.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      customClass: {
        popup: 'rounded-4'
      }
    });

    if (ok.isConfirmed) {
      try {
        const res = await fetch(`http://localhost:3001/facturas/${id}`, {
          method: "DELETE"
        });

        if (!res.ok) throw new Error("Error al eliminar pedido");

        Swal.fire({
          icon: "success",
          title: "Pedido Eliminado",
          text: "El registro ha sido removido de MySQL.",
          confirmButtonColor: "#20B2AA",
          timer: 1500,
          showConfirmButton: false
        });

        if (facturaSeleccionada?.idFacturas === id) {
          setFacturaSeleccionada(null);
        }

        cargarFacturas();
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo eliminar el pedido.",
          confirmButtonColor: "#0047AB"
        });
      }
    }
  };

  // Gestionar devoluciones (Aprobar / Rechazar)
  const resolverDevolucion = async (id, accion) => {
    const titulo = accion === "aprobar" ? "Aprobar Devolución" : "Rechazar Devolución";
    const texto = accion === "aprobar" ? "¿Estás seguro de aprobar esta devolución?" : "¿Estás seguro de rechazar esta devolución?";
    const confirmColor = accion === "aprobar" ? "#20B2AA" : "#d33";

    const ok = await Swal.fire({
      title: `<h5 class="fw-bold" style="color: #0047AB">${titulo}</h5>`,
      text: texto,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: confirmColor,
      cancelButtonColor: "#6c757d",
      customClass: { popup: 'rounded-4' }
    });

    if (ok.isConfirmed) {
      try {
        const res = await fetch(`http://localhost:3001/devoluciones/${id}/${accion}`, {
          method: "PUT"
        });

        if (!res.ok) throw new Error(`Error al ${accion} devolución`);

        Swal.fire({
          icon: "success",
          title: "Procesado",
          text: `Solicitud de devolución ${accion === "aprobar" ? "aprobada" : "rechazada"} correctamente.`,
          confirmButtonColor: "#20B2AA",
          timer: 1500,
          showConfirmButton: false
        });

        cargarDevoluciones();
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Ocurrió un error al procesar la solicitud.",
          confirmButtonColor: "#0047AB"
        });
      }
    }
  };

  // Filtrado de facturas
  const facturasFiltradas = facturas.filter((f) => {
    const nombreCompleto = `${f.Nombres || ""} ${f.Apellidos || ""}`.toLowerCase();
    const coincideBusqueda =
      nombreCompleto.includes(busqueda.toLowerCase()) ||
      String(f.idFacturas).includes(busqueda);
    const coincideEstado = filtroEstado === "" || (f.Estado || "Pendiente") === filtroEstado;
    return coincideBusqueda && coincideEstado;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container py-5"
    >
      <div className="mb-4">
        <h3 className="fw-bold mb-1" style={{ color: "#0047AB" }}>📋 Panel Logístico y de Pedidos</h3>
        <p className="text-muted" style={{ fontSize: "14px" }}>Gestiona los pedidos de compra de los clientes y aprueba solicitudes de devoluciones.</p>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4">
        <button
          className="btn fw-bold px-4 py-2.5"
          style={{
            borderRadius: "12px",
            backgroundColor: seccion === "pedidos" ? "#0047AB" : "transparent",
            color: seccion === "pedidos" ? "#fff" : "#4a5568",
            border: seccion === "pedidos" ? "none" : "1px solid #dcdfe6",
            transition: "all 0.3s ease"
          }}
          onClick={() => {
            setSeccion("pedidos");
            setFacturaSeleccionada(null);
          }}
        >
          <i className="bi bi-receipt me-2"></i> Pedidos Recibidos
        </button>
        <button
          className="btn fw-bold px-4 py-2.5"
          style={{
            borderRadius: "12px",
            backgroundColor: seccion === "devoluciones" ? "#0047AB" : "transparent",
            color: seccion === "devoluciones" ? "#fff" : "#4a5568",
            border: seccion === "devoluciones" ? "none" : "1px solid #dcdfe6",
            transition: "all 0.3s ease"
          }}
          onClick={() => {
            setSeccion("devoluciones");
            setFacturaSeleccionada(null);
          }}
        >
          <i className="bi bi-arrow-left-right me-2"></i> Devoluciones Solicitadas
        </button>
      </div>

      {/* Resumen ejecutivo de estadísticas */}
      {seccion === "pedidos" && <ResumenAdmin facturas={facturas} />}

      <div className="row g-4 mt-1">
        
        {/* SECCIÓN PEDIDOS */}
        {seccion === "pedidos" && (
          <div className={facturaSeleccionada ? "col-lg-7" : "col-12"}>
            <div className="tm-table-container">
              
              {/* Buscador e Hilo de Filtros */}
              <div className="row g-3 justify-content-between align-items-center mb-4">
                <div className="col-md-5">
                  <div style={{ position: "relative" }}>
                    <input
                      className="form-control ps-4"
                      placeholder="Buscar por cliente o factura..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      style={{ borderRadius: "10px", paddingLeft: "35px" }}
                    />
                    <i className="bi bi-search text-muted" style={{ position: "absolute", left: "12px", top: "11px" }}></i>
                  </div>
                </div>

                <div className="col-md-7 d-flex justify-content-md-end gap-1.5 flex-wrap">
                  {["", "Pendiente", "Preparando", "Enviado", "Entregado", "Cancelado"].map((est) => (
                    <button
                      key={est}
                      className="btn btn-sm"
                      style={{
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "600",
                        padding: "5px 12px",
                        backgroundColor: filtroEstado === est ? "#0047AB" : "#f1f5f9",
                        color: filtroEstado === est ? "#fff" : "#475569",
                        border: "none"
                      }}
                      onClick={() => setFiltroEstado(est)}
                    >
                      {est === "" ? "Todos" : est}
                    </button>
                  ))}
                  <button 
                    className="btn btn-sm btn-outline-primary ms-2" 
                    onClick={cargarFacturas}
                    style={{ borderRadius: "10px" }}
                    title="Actualizar datos"
                  >
                    <i className="bi bi-arrow-clockwise"></i>
                  </button>
                </div>
              </div>

              {loadingTable ? (
                <div className="text-center py-5">
                  <span className="spinner-border spinner-border text-primary" role="status" />
                  <p className="text-muted mt-2 mb-0" style={{ fontSize: "13.5px" }}>Conectando a MySQL...</p>
                </div>
              ) : facturasFiltradas.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-inbox" style={{ fontSize: "2rem" }}></i>
                  <p className="mt-2 mb-0" style={{ fontSize: "14px" }}>No hay facturas registradas en el sistema.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="tm-table">
                    <thead>
                      <tr>
                        <th>Factura #</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facturasFiltradas.map((f) => (
                        <tr 
                          key={f.idFacturas}
                          style={{
                            backgroundColor: facturaSeleccionada?.idFacturas === f.idFacturas ? "rgba(32, 178, 170, 0.04)" : "transparent"
                          }}
                        >
                          <td className="fw-bold text-dark">#{f.idFacturas}</td>
                          <td className="fw-semibold">{f.Nombres} {f.Apellidos}</td>
                          <td>{f.Fecha ? new Date(f.Fecha).toLocaleDateString() : ""}</td>
                          <td className="fw-bold" style={{ color: "#0047AB" }}>${f.Total?.toLocaleString()}</td>
                          <td>
                            <span
                              className="badge px-3 py-2"
                              style={{
                                borderRadius: "30px",
                                fontSize: "11px",
                                backgroundColor: 
                                  f.Estado === "Entregado" ? "#ecfdf5" : 
                                  f.Estado === "Cancelado" ? "#fef2f2" : 
                                  f.Estado === "Enviado" ? "#eff6ff" : 
                                  f.Estado === "Preparando" ? "#fffbeb" : "#f8fafc",
                                color: 
                                  f.Estado === "Entregado" ? "#047857" : 
                                  f.Estado === "Cancelado" ? "#b91c1c" : 
                                  f.Estado === "Enviado" ? "#1d4ed8" : 
                                  f.Estado === "Preparando" ? "#b45309" : "#475569",
                                border: 
                                  f.Estado === "Entregado" ? "1px solid #a7f3d0" : 
                                  f.Estado === "Cancelado" ? "1px solid #fca5a5" : 
                                  f.Estado === "Enviado" ? "1px solid #bfdbfe" : 
                                  f.Estado === "Preparando" ? "1px solid #fde68a" : "1px solid #e2e8f0"
                              }}
                            >
                              {f.Estado || "Pendiente"}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-sm text-white"
                                style={{
                                  backgroundColor: "#0047AB",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  padding: "6px 12px"
                                }}
                                onClick={() => verDetail(f)}
                              >
                                Ver
                              </button>
                              <button
                                className="btn btn-sm btn-outline-warning text-dark"
                                style={{
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  padding: "6px 12px",
                                  border: "1px solid #fde68a"
                                }}
                                onClick={() => cambiarEstado(f)}
                              >
                                Estado
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                style={{
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  padding: "6px 12px"
                                }}
                                onClick={() => eliminarFactura(f.idFacturas)}
                                title="Eliminar factura"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DETALLE DEL PEDIDO LATERAL */}
        <AnimatePresence>
          {seccion === "pedidos" && facturaSeleccionada && (
            <motion.div 
              className="col-lg-5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div 
                className="card border-0 shadow-sm p-4"
                style={{ 
                  borderRadius: "20px", 
                  backgroundColor: "#ffffff",
                  borderLeft: "5px solid #20B2AA",
                  position: "sticky",
                  top: "90px"
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                  <h5 className="fw-bold mb-0" style={{ color: "#0047AB" }}>
                    <i className="bi bi-info-circle me-2"></i> Detalles de Compra #{facturaSeleccionada.idFacturas}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setFacturaSeleccionada(null)}
                    style={{ fontSize: "12px" }}
                  />
                </div>

                <div className="d-flex flex-column gap-3 mb-4">
                  <div>
                    <label className="text-muted small mb-0">Cliente</label>
                    <div className="fw-bold text-dark">{facturaSeleccionada.Nombres} {facturaSeleccionada.Apellidos}</div>
                  </div>
                  <div className="row g-2">
                    <div className="col-sm-6">
                      <label className="text-muted small mb-0">Fecha de Compra</label>
                      <div className="text-dark">{facturaSeleccionada.Fecha ? new Date(facturaSeleccionada.Fecha).toLocaleDateString() : ""}</div>
                    </div>
                    <div className="col-sm-6">
                      <label className="text-muted small mb-0">Estado de Envío</label>
                      <div>
                        <span 
                          className="badge"
                          style={{
                            backgroundColor: 
                              facturaSeleccionada.Estado === "Entregado" ? "#ecfdf5" : 
                              facturaSeleccionada.Estado === "Cancelado" ? "#fef2f2" : "#fffbeb",
                            color: 
                              facturaSeleccionada.Estado === "Entregado" ? "#047857" : 
                              facturaSeleccionada.Estado === "Cancelado" ? "#b91c1c" : "#b45309",
                            border: 
                              facturaSeleccionada.Estado === "Entregado" ? "1px solid #a7f3d0" : 
                              facturaSeleccionada.Estado === "Cancelado" ? "1px solid #fca5a5" : "1px solid #fde68a",
                            fontSize: "10.5px"
                          }}
                        >
                          {facturaSeleccionada.Estado || "Pendiente"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-muted small mb-0">Total Recaudado</label>
                    <div className="fw-extrabold text-primary" style={{ fontSize: "18px" }}>
                      ${facturaSeleccionada.Total?.toLocaleString()} COP
                    </div>
                  </div>
                </div>

                <h6 className="fw-bold mb-3" style={{ color: "#0047AB" }}>
                  <i className="bi bi-cart3 me-1.5"></i> Artículos Comprados:
                </h6>

                {loadingDetalle ? (
                  <div className="text-center py-4">
                    <span className="spinner-border spinner-border-sm text-secondary" role="status" />
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: "250px", overflowY: "auto" }}>
                    {detalles.map((d, i) => (
                      <div 
                        key={i}
                        className="d-flex justify-content-between align-items-center p-3 rounded-4" 
                        style={{ 
                          backgroundColor: "#f8fafc",
                          border: "1px solid rgba(0,0,0,0.03)"
                        }}
                      >
                        <div>
                          <span className="fw-bold text-dark d-block" style={{ fontSize: "13.5px" }}>{d.Nombre_Producto}</span>
                          <span className="text-muted" style={{ fontSize: "11.5px" }}>Precio unitario: ${d.Precio_Unitario?.toLocaleString()}</span>
                        </div>
                        <span className="badge bg-secondary-subtle text-secondary px-3 py-1.5" style={{ borderRadius: "20px", fontSize: "11px" }}>
                          Cantidad: {d.Cantidad}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SECCIÓN DEVOLUCIONES */}
        {seccion === "devoluciones" && (
          <div className="col-12">
            <div className="tm-table-container">
              <h5 className="fw-bold mb-4" style={{ color: "#0047AB" }}>
                <i className="bi bi-arrow-left-right me-2"></i> Solicitudes de Devoluciones
              </h5>

              {loadingDevoluciones ? (
                <div className="text-center py-5">
                  <span className="spinner-border spinner-border text-primary" role="status" />
                  <p className="text-muted mt-2 mb-0" style={{ fontSize: "13px" }}>Cargando solicitudes...</p>
                </div>
              ) : devoluciones.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-shield-check" style={{ fontSize: "2.5rem" }}></i>
                  <p className="mt-2 mb-0" style={{ fontSize: "14px" }}>No hay solicitudes de devolución pendientes.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="tm-table">
                    <thead>
                      <tr>
                        <th>Pedido #</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Producto</th>
                        <th>Cant.</th>
                        <th>Motivo</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {devoluciones.map((dev) => {
                        let badgeColor = "#fffbeb"; // Yellow
                        let textColor = "#b45309";
                        let borderColor = "#fde68a";
                        if (dev.Estado === "Aprobada") {
                          badgeColor = "#ecfdf5";
                          textColor = "#047857";
                          borderColor = "#a7f3d0";
                        } else if (dev.Estado === "Rechazada") {
                          badgeColor = "#fef2f2";
                          textColor = "#b91c1c";
                          borderColor = "#fca5a5";
                        }
                        
                        return (
                          <tr key={dev.idDevoluciones}>
                            <td className="fw-bold text-dark">#{dev.Facturas_idFacturas}</td>
                            <td className="fw-semibold">{dev.Nombres} {dev.Apellidos}</td>
                            <td>{dev.Fecha ? new Date(dev.Fecha).toLocaleDateString() : ""}</td>
                            <td className="fw-semibold text-dark">{dev.Nombre_Producto}</td>
                            <td>{dev.Cantidad}</td>
                            <td style={{ fontSize: "13px", color: "#475569" }}>{dev.Motivo}</td>
                            <td>
                              <span
                                className="badge px-3 py-1.5"
                                style={{
                                  borderRadius: "20px",
                                  fontSize: "11px",
                                  backgroundColor: badgeColor,
                                  color: textColor,
                                  border: `1px solid ${borderColor}`
                                }}
                              >
                                {dev.Estado || "Pendiente"}
                              </span>
                            </td>
                            <td>
                              {dev.Estado === "Pendiente" ? (
                                <div className="d-flex gap-2">
                                  <button
                                    className="btn btn-sm btn-success"
                                    style={{ borderRadius: "8px", fontSize: "11.5px" }}
                                    onClick={() => resolverDevolucion(dev.idDevoluciones, "aprobar")}
                                  >
                                    Aprobar
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    style={{ borderRadius: "8px", fontSize: "11.5px" }}
                                    onClick={() => resolverDevolucion(dev.idDevoluciones, "rechazar")}
                                  >
                                    Rechazar
                                  </button>
                                </div>
                              ) : (
                                <span className="text-muted small">Resuelta</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default TablaCotizaciones;