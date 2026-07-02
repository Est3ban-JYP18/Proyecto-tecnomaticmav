import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";

const URL = "http://localhost:3001/devoluciones";

function Devoluciones() {
  const [devoluciones, setDevoluciones] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [loading, setLoading] = useState(true);

  // Estados para la inspección y resolución
  const [devolucionSeleccionada, setDevolucionSeleccionada] = useState(null);
  const [comentariosAdmin, setComentariosAdmin] = useState("");
  const [codigoCupon, setCodigoCupon] = useState("");
  const [procesandoResolucion, setProcesandoResolucion] = useState(false);

  // Estados para creación manual de devolución por el admin
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [listaFacturas, setListaFacturas] = useState([]);
  const [loadingFacturas, setLoadingFacturas] = useState(false);
  const [idFacturaSeleccionada, setIdFacturaSeleccionada] = useState("");
  const [articulosFactura, setArticulosFactura] = useState([]);
  const [loadingArticulos, setLoadingArticulos] = useState(false);
  
  const [idProductoSeleccionado, setIdProductoSeleccionado] = useState("");
  const [cantidadDev, setCantidadDev] = useState(1);
  const [motivoCat, setMotivoCat] = useState("Defectuoso");
  const [metodoReem, setMetodoReem] = useState("MetodoOriginal");
  const [metodoRet, setMetodoRet] = useState("EntregaSucursal");
  const [dirRetorno, setDirRetorno] = useState("");
  const [notasDev, setNotasDev] = useState("");
  const [guardandoDevolucion, setGuardandoDevolucion] = useState(false);

  const abrirModalCreacionManual = async () => {
    setMostrarModalCrear(true);
    setLoadingFacturas(true);
    setListaFacturas([]);
    setIdFacturaSeleccionada("");
    setArticulosFactura([]);
    setIdProductoSeleccionado("");
    setCantidadDev(1);
    setNotasDev("");
    setDirRetorno("");

    try {
      const res = await fetch("http://localhost:3001/facturas");
      if (!res.ok) throw new Error("Error cargando facturas");
      const data = await res.json();
      const facturasEntregadas = data.filter(f => f.Estado === "Entregado" || f.Estado === "Enviado");
      setListaFacturas(facturasEntregadas.length > 0 ? facturasEntregadas : data);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudieron obtener las facturas para registrar la devolución", "error");
    } finally {
      setLoadingFacturas(false);
    }
  };

  const handleFacturaChange = async (idFactura) => {
    setIdFacturaSeleccionada(idFactura);
    setArticulosFactura([]);
    setIdProductoSeleccionado("");
    setCantidadDev(1);

    if (!idFactura) return;

    setLoadingArticulos(true);
    try {
      const res = await fetch(`http://localhost:3001/pedido-detalle/${idFactura}`);
      if (!res.ok) throw new Error("Error al obtener artículos");
      const data = await res.json();
      setArticulosFactura(data);
      if (data.length > 0) {
        setIdProductoSeleccionado(data[0].idProductos);
        setCantidadDev(1);
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudieron cargar los artículos de esta factura", "error");
    } finally {
      setLoadingArticulos(false);
    }
  };

  const guardarDevolucionManual = async () => {
    if (!idFacturaSeleccionada) {
      Swal.fire("Atención", "Por favor selecciona un pedido/factura.", "warning");
      return;
    }
    if (!idProductoSeleccionado) {
      Swal.fire("Atención", "Por favor selecciona un producto.", "warning");
      return;
    }
    if (!notasDev.trim()) {
      Swal.fire("Atención", "Por favor describe el motivo de la devolución.", "warning");
      return;
    }
    if (metodoRet === "RetiroDomicilio" && !dirRetorno.trim()) {
      Swal.fire("Atención", "Por favor ingresa la dirección de retiro.", "warning");
      return;
    }

    const factura = listaFacturas.find(f => String(f.idFacturas) === String(idFacturaSeleccionada));
    if (!factura) {
      Swal.fire("Error", "No se encontró la factura seleccionada.", "error");
      return;
    }

    setGuardandoDevolucion(true);
    try {
      const res = await fetch("http://localhost:3001/devoluciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facturaId: idFacturaSeleccionada,
          productoId: idProductoSeleccionado,
          usuarioId: factura.Usuarios_idUsuarios,
          cantidad: cantidadDev,
          motivo: notasDev,
          motivoCategoria: motivoCat,
          metodoReembolso: metodoReem,
          metodoRetorno: metodoRet,
          direccionRetorno: dirRetorno,
          evidenciaUrl: null
        })
      });

      if (!res.ok) throw new Error("Error al registrar devolución");

      Swal.fire({
        icon: "success",
        title: "Devolución Registrada",
        text: "La devolución ha sido creada exitosamente.",
        confirmButtonColor: "#20B2AA",
        timer: 2000
      });

      setMostrarModalCrear(false);
      cargarDevoluciones();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo registrar la devolución.", "error");
    } finally {
      setGuardandoDevolucion(false);
    }
  };

  const productoActual = articulosFactura.find(p => String(p.idProductos) === String(idProductoSeleccionado));
  const maxCantidad = productoActual ? productoActual.Cantidad : 1;

  // Cargar devoluciones de la base de datos
  const cargarDevoluciones = () => {
    setLoading(true);
    fetch(URL)
      .then((res) => {
        if (!res.ok) throw new Error("Error cargando devoluciones");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          const formated = data.map((d) => ({
            ...d,
            Estado: d.Estado || "Pendiente",
          }));
          setDevoluciones(formated);
        } else {
          setDevoluciones([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    cargarDevoluciones();
  }, []);

  // Procesar devolución (Aprobar o Rechazar con comentarios y cupón opcional)
  const resolverDevolucion = async (id, accion, comentarios, cupon) => {
    try {
      setProcesandoResolucion(true);
      const res = await fetch(`${URL}/${id}/${accion}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comentariosAdmin: comentarios,
          codigoCupon: cupon
        })
      });

      if (!res.ok) throw new Error(`Error al ${accion} la devolución`);

      Swal.fire({
        icon: "success",
        title: "Procesado",
        text: `Solicitud de devolución ${accion === "aprobar" ? "aprobada" : "rechazada"} correctamente.`,
        confirmButtonColor: "#20B2AA",
        timer: 1500,
        showConfirmButton: false
      });

      setDevolucionSeleccionada(null);
      cargarDevoluciones();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un error al procesar la solicitud.",
        confirmButtonColor: "#0047AB"
      });
    } finally {
      setProcesandoResolucion(false);
    }
  };

  // Actualizar tracking logístico de la devolución
  const actualizarTracking = async (id, nuevoEstado) => {
    try {
      const res = await fetch(`${URL}/${id}/tracking`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estadoTracking: nuevoEstado })
      });

      if (!res.ok) throw new Error("Error al actualizar tracking");

      // Actualizar estado localmente
      setDevolucionSeleccionada(prev => prev ? { ...prev, Estado_Tracking: nuevoEstado } : null);
      cargarDevoluciones();

      Swal.fire({
        icon: "success",
        title: "Tracking Actualizado",
        text: `Estado cambiado a ${nuevoEstado}`,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar el estado del tracking.",
        confirmButtonColor: "#0047AB"
      });
    }
  };

  // Mapear color de badge de estado
  const obtenerBadgeEstilo = (estado) => {
    if (estado === "Aprobada") {
      return { backgroundColor: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" };
    }
    if (estado === "Rechazada") {
      return { backgroundColor: "#fef2f2", color: "#b91c1c", border: "1px solid #fca5a5" };
    }
    return { backgroundColor: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" }; // Pendiente
  };

  // Filtrar
  const devolucionesFiltradas = devoluciones.filter((d) => {
    const cliente = `${d.Nombres || ""} ${d.Apellidos || ""}`.toLowerCase();
    const coincideBusqueda = 
      cliente.includes(busqueda.toLowerCase()) ||
      (d.Nombre_Producto || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      String(d.Facturas_idFacturas).includes(busqueda);
    const coincideEstado = filtroEstado === "" || d.Estado === filtroEstado;

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
        <h3 className="fw-bold mb-1" style={{ color: "#0047AB" }}>↩️ Gestión de Devoluciones (MySQL)</h3>
        <p className="text-muted" style={{ fontSize: "14px" }}>Administra y autoriza las solicitudes de devoluciones enviadas por los clientes.</p>
      </div>

      <div className="tm-table-container">
        {/* Filtros */}
        <div className="row g-3 justify-content-between align-items-center mb-4">
          <div className="col-md-8 d-flex gap-2 flex-wrap">
            {/* Buscador */}
            <div style={{ position: "relative", minWidth: "260px" }}>
              <input
                className="form-control ps-4"
                placeholder="Buscar por cliente, producto o pedido..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{ borderRadius: "10px", paddingLeft: "35px" }}
              />
              <i className="bi bi-search text-muted" style={{ position: "absolute", left: "12px", top: "11px" }}></i>
            </div>
            
            {/* Filtro Estado */}
            <div style={{ position: "relative", minWidth: "180px" }}>
              <select
                className="form-select"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                style={{ borderRadius: "10px" }}
              >
                <option value="">Todos los estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Aprobada">Aprobada</option>
                <option value="Rechazada">Rechazada</option>
              </select>
            </div>
          </div>

          <div className="col-md-4 text-md-end d-flex gap-2 justify-content-end">
            <button 
              className="btn btn-primary fw-bold text-white" 
              style={{ borderRadius: "10px", backgroundColor: "#20B2AA", borderColor: "#20B2AA" }}
              onClick={abrirModalCreacionManual}
            >
              <i className="bi bi-plus-circle me-1"></i> Registrar Devolución
            </button>
            <button 
              className="btn btn-outline-primary fw-bold" 
              style={{ borderRadius: "10px" }}
              onClick={cargarDevoluciones}
            >
              <i className="bi bi-arrow-clockwise me-1"></i> Actualizar
            </button>
          </div>
        </div>

        {/* TABLA */}
        {loading ? (
          <div className="text-center py-5">
            <span className="spinner-border spinner-border text-primary" role="status" />
            <p className="text-muted mt-2 mb-0" style={{ fontSize: "13.5px" }}>Conectando a MySQL...</p>
          </div>
        ) : devolucionesFiltradas.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-arrow-left-right" style={{ fontSize: "2rem" }}></i>
            <p className="mt-2 mb-0" style={{ fontSize: "14px" }}>No se encontraron solicitudes de devolución.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="tm-table">
              <thead>
                <tr>
                  <th>Pedido #</th>
                  <th>Cliente</th>
                  <th>Producto</th>
                  <th className="text-center">Cant.</th>
                  <th>Motivo / Cat.</th>
                  <th>Fecha Solicitud</th>
                  <th>Envío / Pago</th>
                  <th>Tracking</th>
                  <th>Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {devolucionesFiltradas.map((d) => {
                  let catText = "General";
                  if (d.Motivo_Categoria === "Defectuoso") catText = "Defectuoso";
                  else if (d.Motivo_Categoria === "DiferenteFoto") catText = "Dif. Foto";
                  else if (d.Motivo_Categoria === "TallaMedidaIncorrecta") catText = "Talla/Medida";
                  else if (d.Motivo_Categoria === "DañadoEnvio") catText = "Dañado Envío";
                  else if (d.Motivo_Categoria === "Arrepentido") catText = "Arrepentido";
                  else if (d.Motivo_Categoria === "Otro") catText = "Otro";

                  return (
                    <tr key={d.idDevoluciones}>
                      <td className="fw-bold text-dark">#{d.Facturas_idFacturas}</td>
                      <td className="fw-semibold">{d.Nombres} {d.Apellidos}</td>
                      <td className="fw-semibold text-dark">{d.Nombre_Producto}</td>
                      <td className="text-center">{d.Cantidad}</td>
                      <td>
                        <span className="badge bg-secondary bg-opacity-10 text-secondary-emphasis mb-1" style={{ fontSize: "10.5px" }}>{catText}</span>
                        <div className="text-truncate small text-muted" style={{ maxWidth: "150px" }}>{d.Motivo}</div>
                      </td>
                      <td>{d.Fecha ? new Date(d.Fecha).toLocaleDateString() : ""}</td>
                      <td style={{ fontSize: "12px", color: "#475569" }}>
                        <div><strong>Reembolso:</strong> {d.Metodo_Reembolso === "CreditoTienda" ? "Cupón" : "Original"}</div>
                        <div><strong>Retorno:</strong> {d.Metodo_Retorno === "RetiroDomicilio" ? "Pick-up" : "Sucursal"}</div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border px-2 py-1 font-monospace" style={{ fontSize: "10.5px" }}>
                          {d.Estado_Tracking || "Solicitada"}
                        </span>
                      </td>
                      <td>
                        <span
                          className="badge px-3 py-1.5"
                          style={{
                            borderRadius: "20px",
                            fontSize: "11px",
                            ...obtenerBadgeEstilo(d.Estado)
                          }}
                        >
                          {d.Estado}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-primary text-white fw-semibold"
                          style={{ borderRadius: "8px", fontSize: "11.5px", padding: "6px 12px" }}
                          onClick={() => {
                            setDevolucionSeleccionada(d);
                            setComentariosAdmin(d.Comentarios_Admin || "");
                            setCodigoCupon(d.Codigo_Cupon || (d.Metodo_Reembolso === "CreditoTienda" ? `CRED-MAV-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : ""));
                          }}
                        >
                          {d.Estado === "Pendiente" ? "Revisar" : "Ver Detalle"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE REVISIÓN Y RESOLUCIÓN PARA EL ADMINISTRADOR */}
      <AnimatePresence>
        {devolucionSeleccionada && (
          <div 
            className="modal show d-block" 
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(6px)", zIndex: 1050 }}
            onClick={() => setDevolucionSeleccionada(null)}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="modal-content border-0 overflow-hidden"
                style={{ borderRadius: "24px", boxShadow: "0 10px 45px rgba(0,0,0,0.15)" }}
              >
                {/* Cabecera */}
                <div 
                  className="p-4 text-white d-flex justify-content-between align-items-center"
                  style={{ background: "linear-gradient(135deg, #002B73 0%, #0047AB 100%)" }}
                >
                  <h5 className="modal-title fw-bold mb-0">
                    <i className="bi bi-shield-lock me-2"></i>
                    Revisión de Solicitud #{devolucionSeleccionada.idDevoluciones}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={() => setDevolucionSeleccionada(null)}
                  />
                </div>

                <div className="modal-body p-4 bg-light" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                  <div className="row g-4">
                    {/* Panel izquierdo: Datos y Evidencia */}
                    <div className="col-md-6 border-end">
                      <h6 className="fw-bold text-secondary mb-3">Información de la Solicitud</h6>
                      
                      <div className="mb-2.5">
                        <span className="small text-muted d-block">Cliente:</span>
                        <strong className="text-dark">{devolucionSeleccionada.Nombres} {devolucionSeleccionada.Apellidos}</strong>
                      </div>

                      <div className="mb-2.5">
                        <span className="small text-muted d-block">Producto:</span>
                        <strong className="text-dark">{devolucionSeleccionada.Nombre_Producto}</strong>
                        <span className="badge bg-secondary ms-2">Cant: {devolucionSeleccionada.Cantidad}</span>
                      </div>

                      <div className="mb-2.5">
                        <span className="small text-muted d-block">Categoría de Devolución:</span>
                        <span className="badge bg-info bg-opacity-25 text-info-emphasis">{devolucionSeleccionada.Motivo_Categoria || "General"}</span>
                      </div>

                      <div className="mb-2.5">
                        <span className="small text-muted d-block">Comentarios del Cliente:</span>
                        <div className="p-2 border rounded-3 bg-white small text-dark" style={{ minHeight: "50px" }}>
                          {devolucionSeleccionada.Motivo}
                        </div>
                      </div>

                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <span className="small text-muted d-block">Reembolso solicitado:</span>
                          <span className="small fw-bold text-primary">
                            {devolucionSeleccionada.Metodo_Reembolso === "CreditoTienda" ? "Cupón de Crédito" : "Método de Pago Original"}
                          </span>
                        </div>
                        <div className="col-6">
                          <span className="small text-muted d-block">Método de retorno:</span>
                          <span className="small fw-bold text-primary">
                            {devolucionSeleccionada.Metodo_Retorno === "RetiroDomicilio" ? "Retiro a domicilio" : "Entrega en Oficina"}
                          </span>
                        </div>
                      </div>

                      {devolucionSeleccionada.Direccion_Retorno && (
                        <div className="mb-3">
                          <span className="small text-muted d-block">Dirección de Recogida:</span>
                          <span className="small text-dark">{devolucionSeleccionada.Direccion_Retorno}</span>
                        </div>
                      )}

                      {devolucionSeleccionada.Evidencia_Url && (
                        <div className="mb-3">
                          <span className="small text-muted d-block mb-1">Foto de Evidencia:</span>
                          <img 
                            src={devolucionSeleccionada.Evidencia_Url} 
                            alt="Evidencia" 
                            className="img-fluid img-thumbnail rounded-3 shadow-sm" 
                            style={{ maxHeight: "150px", cursor: "pointer" }}
                            onClick={() => {
                              Swal.fire({
                                imageUrl: devolucionSeleccionada.Evidencia_Url,
                                imageAlt: "Foto de evidencia completa",
                                confirmButtonColor: "#0047AB"
                              });
                            }}
                          />
                          <span className="d-block small text-muted mt-1">(Haz click para agrandar la imagen)</span>
                        </div>
                      )}
                    </div>

                    {/* Panel derecho: Acciones del Administrador */}
                    <div className="col-md-6">
                      <h6 className="fw-bold text-secondary mb-3">Control de Estado y Resolución</h6>

                      {/* Dropdown de Estado de Tracking */}
                      <div className="mb-4">
                        <label className="form-label small fw-semibold text-muted mb-1">Estado del Tracking de Devolución:</label>
                        <select 
                          className="form-select font-monospace" 
                          value={devolucionSeleccionada.Estado_Tracking || "Solicitada"} 
                          onChange={(e) => actualizarTracking(devolucionSeleccionada.idDevoluciones, e.target.value)}
                          style={{ borderRadius: "10px" }}
                        >
                          <option value="Solicitada">1. Solicitada (Recibida en sistema)</option>
                          <option value="En Tránsito">2. En Tránsito (Transportadora en ruta)</option>
                          <option value="En Inspección">3. En Inspección (Bodega Tecnomatic)</option>
                          <option value="Resuelta">4. Resuelta (Aprobado reembolso)</option>
                          <option value="Rechazada">5. Rechazada (No califica)</option>
                        </select>
                      </div>

                      <hr />

                      {devolucionSeleccionada.Estado === "Pendiente" ? (
                        <div>
                          <h6 className="fw-bold mb-3" style={{ color: "#0047AB" }}>Procesar Resolución Oficial</h6>
                          
                          <div className="mb-3">
                            <label className="form-label small fw-semibold text-muted mb-1">Retroalimentación / Mensaje al Cliente:</label>
                            <textarea 
                              className="form-control" 
                              rows="3" 
                              placeholder="Escribe el motivo de la aprobación o rechazo..."
                              value={comentariosAdmin}
                              onChange={(e) => setComentariosAdmin(e.target.value)}
                              style={{ borderRadius: "10px", fontSize: "13px" }}
                            />
                          </div>

                          {devolucionSeleccionada.Metodo_Reembolso === "CreditoTienda" && (
                            <div className="mb-4 p-3 bg-warning bg-opacity-10 border border-warning rounded-4">
                              <label className="form-label small fw-bold text-warning-emphasis mb-1">Código de Cupón de Crédito a Generar:</label>
                              <div className="d-flex gap-2">
                                <input 
                                  type="text" 
                                  className="form-control font-monospace fw-bold" 
                                  value={codigoCupon}
                                  onChange={(e) => setCodigoCupon(e.target.value.toUpperCase())}
                                  style={{ borderRadius: "8px" }}
                                />
                                <button 
                                  className="btn btn-outline-warning btn-sm"
                                  onClick={() => setCodigoCupon(`CRED-MAV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`)}
                                  style={{ borderRadius: "8px" }}
                                >
                                  Generar
                                </button>
                              </div>
                              <span className="small text-muted mt-1 d-block" style={{ fontSize: "11px" }}>Este cupón le dará saldo a favor al cliente.</span>
                            </div>
                          )}

                          <div className="d-flex gap-2 mt-4">
                            <button 
                              className="btn btn-success text-white fw-bold flex-fill py-2.5"
                              style={{ borderRadius: "12px" }}
                              disabled={procesandoResolucion}
                              onClick={() => resolverDevolucion(devolucionSeleccionada.idDevoluciones, "aprobar", comentariosAdmin, codigoCupon)}
                            >
                              <i className="bi bi-check-circle me-1"></i> Aprobar Reembolso
                            </button>
                            <button 
                              className="btn btn-danger text-white fw-bold flex-fill py-2.5"
                              style={{ borderRadius: "12px" }}
                              disabled={procesandoResolucion}
                              onClick={() => resolverDevolucion(devolucionSeleccionada.idDevoluciones, "rechazar", comentariosAdmin)}
                            >
                              <i className="bi bi-x-circle me-1"></i> Rechazar Solicitud
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={`p-3 rounded-4 border ${devolucionSeleccionada.Estado === "Aprobada" ? "bg-success bg-opacity-10 border-success" : "bg-danger bg-opacity-10 border-danger"}`}>
                          <h6 className="fw-bold mb-2">
                            {devolucionSeleccionada.Estado === "Aprobada" ? "✓ Solicitud Aprobada" : "✗ Solicitud Rechazada"}
                          </h6>
                          <p className="small mb-2 text-dark">
                            <strong>Mensaje del Admin:</strong> {devolucionSeleccionada.Comentarios_Admin || "Sin mensaje adicional."}
                          </p>
                          {devolucionSeleccionada.Estado === "Aprobada" && devolucionSeleccionada.Codigo_Cupon && (
                            <div className="p-2 bg-white rounded-3 border border-dashed border-success mt-2 text-center">
                              <span className="small text-muted d-block font-monospace" style={{ fontSize: "10px" }}>CUPÓN GENERADO</span>
                              <strong className="fs-5 text-success font-monospace">{devolucionSeleccionada.Codigo_Cupon}</strong>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3 border-top text-end bg-white">
                  <button 
                    className="btn btn-secondary px-4" 
                    style={{ borderRadius: "10px" }}
                    onClick={() => setDevolucionSeleccionada(null)}
                  >
                    Cerrar
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE CREACIÓN MANUAL */}
      <AnimatePresence>
        {mostrarModalCrear && (
          <div 
            className="modal show d-block" 
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(6px)", zIndex: 1050 }}
            onClick={() => setMostrarModalCrear(false)}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="modal-content border-0 overflow-hidden"
                style={{ borderRadius: "24px", boxShadow: "0 10px 45 rgba(0,0,0,0.15)" }}
              >
                {/* Cabecera */}
                <div 
                  className="p-4 text-white d-flex justify-content-between align-items-center"
                  style={{ background: "linear-gradient(135deg, #002B73 0%, #0047AB 100%)" }}
                >
                  <h5 className="modal-title fw-bold mb-0">
                    <i className="bi bi-plus-circle me-2"></i>
                    Registrar Devolución Manual
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={() => setMostrarModalCrear(false)}
                  />
                </div>

                <div className="modal-body p-4 bg-light" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                  {loadingFacturas ? (
                    <div className="text-center py-5">
                      <span className="spinner-border spinner-border text-primary" role="status" />
                      <p className="text-muted mt-2 mb-0">Cargando facturas disponibles...</p>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {/* Seleccionar Factura */}
                      <div className="col-md-6">
                        <label className="form-label fw-bold text-secondary">Seleccionar Pedido / Factura</label>
                        <select 
                          className="form-select" 
                          value={idFacturaSeleccionada}
                          onChange={(e) => handleFacturaChange(e.target.value)}
                          style={{ borderRadius: "10px" }}
                        >
                          <option value="">-- Selecciona una Factura --</option>
                          {listaFacturas.map((f) => (
                            <option key={f.idFacturas} value={f.idFacturas}>
                              Pedido #{f.idFacturas} - {f.Nombres} {f.Apellidos} (${f.Total?.toLocaleString()})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Seleccionar Producto */}
                      <div className="col-md-6">
                        <label className="form-label fw-bold text-secondary">Seleccionar Producto</label>
                        {loadingArticulos ? (
                          <div className="d-flex align-items-center gap-2 mt-2">
                            <span className="spinner-border spinner-border-sm text-primary" />
                            <span className="text-muted small">Cargando productos...</span>
                          </div>
                        ) : (
                          <select 
                            className="form-select"
                            value={idProductoSeleccionado}
                            disabled={!idFacturaSeleccionada || articulosFactura.length === 0}
                            onChange={(e) => {
                              setIdProductoSeleccionado(e.target.value);
                              setCantidadDev(1);
                            }}
                            style={{ borderRadius: "10px" }}
                          >
                            {articulosFactura.length === 0 ? (
                              <option value="">-- Selecciona primero una factura --</option>
                            ) : (
                              <>
                                <option value="">-- Selecciona un Producto --</option>
                                {articulosFactura.map((p) => (
                                  <option key={p.idProductos} value={p.idProductos}>
                                    {p.Nombre_Producto} (Comprado: {p.Cantidad})
                                  </option>
                                ))}
                              </>
                            )}
                          </select>
                        )}
                      </div>

                      {idProductoSeleccionado && productoActual && (
                        <>
                          {/* Cantidad a devolver */}
                          <div className="col-md-4">
                            <label className="form-label fw-bold text-secondary">Cantidad a Devolver</label>
                            <div className="d-flex align-items-center gap-2">
                              <button 
                                className="btn btn-outline-secondary btn-sm px-3"
                                onClick={() => setCantidadDev(Math.max(1, cantidadDev - 1))}
                                style={{ borderRadius: "8px" }}
                              >
                                -
                              </button>
                              <input 
                                type="number" 
                                className="form-control text-center fw-bold" 
                                value={cantidadDev} 
                                readOnly
                                style={{ width: "70px", borderRadius: "8px" }} 
                              />
                              <button 
                                className="btn btn-outline-secondary btn-sm px-3"
                                onClick={() => setCantidadDev(Math.min(maxCantidad, cantidadDev + 1))}
                                style={{ borderRadius: "8px" }}
                              >
                                +
                              </button>
                              <span className="text-muted small ms-2">Máx: {maxCantidad}</span>
                            </div>
                          </div>

                          {/* Categoría del Motivo */}
                          <div className="col-md-8">
                            <label className="form-label fw-bold text-secondary">Categoría del Motivo</label>
                            <select 
                              className="form-select" 
                              value={motivoCat} 
                              onChange={(e) => setMotivoCat(e.target.value)}
                              style={{ borderRadius: "10px" }}
                            >
                              <option value="Defectuoso">Producto defectuoso o no funciona</option>
                              <option value="DiferenteFoto">Producto es diferente a la foto o descripción</option>
                              <option value="TallaMedidaIncorrecta">Talla, color o medida incorrecta</option>
                              <option value="DañadoEnvio">El producto llegó roto o dañado por la paquetería</option>
                              <option value="Arrepentido">Ya no lo quiere / Se arrepintió de la compra</option>
                              <option value="Otro">Otro motivo</option>
                            </select>
                          </div>

                          {/* Métodos de reembolso y retorno */}
                          <div className="col-md-6">
                            <label className="form-label fw-bold text-secondary">Método de Reembolso</label>
                            <select 
                              className="form-select" 
                              value={metodoReem} 
                              onChange={(e) => setMetodoReem(e.target.value)}
                              style={{ borderRadius: "10px" }}
                            >
                              <option value="MetodoOriginal">Método Original de Pago</option>
                              <option value="CreditoTienda">Cupón de Crédito en Tienda (+10% extra) 🎁</option>
                            </select>
                          </div>

                          <div className="col-md-6">
                            <label className="form-label fw-bold text-secondary">Método de Retorno</label>
                            <select 
                              className="form-select" 
                              value={metodoRet} 
                              onChange={(e) => setMetodoRet(e.target.value)}
                              style={{ borderRadius: "10px" }}
                            >
                              <option value="EntregaSucursal">Llevar a Sucursal de Paquetería</option>
                              <option value="RetiroDomicilio">Recolección a Domicilio</option>
                            </select>
                          </div>

                          {metodoRet === "RetiroDomicilio" && (
                            <div className="col-12">
                              <label className="form-label fw-bold text-secondary">Dirección de Recolección</label>
                              <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Indica calle, número, apto, barrio y ciudad..." 
                                value={dirRetorno}
                                onChange={(e) => setDirRetorno(e.target.value)}
                                style={{ borderRadius: "8px" }}
                              />
                            </div>
                          )}

                          {/* Notas / Comentarios */}
                          <div className="col-12">
                            <label className="form-label fw-bold text-secondary">Notas / Comentarios Internos</label>
                            <textarea 
                              className="form-control" 
                              rows="3" 
                              placeholder="Explica brevemente los detalles del acuerdo de devolución..."
                              value={notasDev}
                              onChange={(e) => setNotasDev(e.target.value)}
                              style={{ borderRadius: "10px" }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-white border-top d-flex justify-content-between">
                  <button 
                    className="btn btn-outline-secondary px-4 fw-bold"
                    style={{ borderRadius: "12px" }}
                    onClick={() => setMostrarModalCrear(false)}
                  >
                    Cancelar
                  </button>

                  <button 
                    className="btn px-4 fw-bold text-white"
                    style={{ backgroundColor: "#20B2AA", borderRadius: "12px" }}
                    disabled={guardandoDevolucion || !idProductoSeleccionado}
                    onClick={guardarDevolucionManual}
                  >
                    {guardandoDevolucion ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Registrando...
                      </>
                    ) : (
                      "Registrar Devolución"
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Devoluciones;
