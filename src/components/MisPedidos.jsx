import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";

// Importación de activos locales
import botas from "../assets/shopping.webp";
import chaquetaindus from "../assets/chaquetaindus.jfif";
import casco from "../assets/casco2.webp";
import guantes from "../assets/guantes2.jpg";

function MisPedidos({ usuario, setPagina }) {
  const [seccion, setSeccion] = useState("pedidos"); // "pedidos" o "devoluciones"
  const [pedidos, setPedidos] = useState([]);
  const [devoluciones, setDevoluciones] = useState([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [loadingDevoluciones, setLoadingDevoluciones] = useState(false);

  // Estados de detalles y seguimiento
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const [seguimiento, setSeguimiento] = useState(null);
  const [loadingSeguimiento, setLoadingSeguimiento] = useState(false);
  const [mostrarSeguimientoModal, setMostrarSeguimientoModal] = useState(false);

  // Estados del asistente de devolución avanzada (Wizard)
  const [devolucionModalProducto, setDevolucionModalProducto] = useState(null);
  const [devolucionModalPedido, setDevolucionModalPedido] = useState(null);
  const [devolucionPaso, setDevolucionPaso] = useState(1);
  const [devCantidad, setDevCantidad] = useState(1);
  const [devMotivoCategoria, setDevMotivoCategoria] = useState("Defectuoso");
  const [devMetodoReembolso, setDevMetodoReembolso] = useState("MetodoOriginal");
  const [devMetodoRetorno, setDevMetodoRetorno] = useState("EntregaSucursal");
  const [devDireccion, setDevDireccion] = useState("");
  const [devNotas, setDevNotas] = useState("");
  const [devEvidencia, setDevEvidencia] = useState("");
  const [enviandoDevolucion, setEnviandoDevolucion] = useState(false);
  
// Estado para la devolución seleccionada a rastrear
  const [devolucionSeleccionada, setDevolucionSeleccionada] = useState(null);

  // 1. ID de usuario tolerante a ambos nombres de propiedad (idUsuarios o id)
  const userId = usuario?.idUsuarios || usuario?.id;

  // 2. Definición única de las URLs utilizando el userId dinámico
  const URL_PEDIDOS = `http://localhost:3001/mis-pedidos/${userId}`;
  const URL_DEVOLUCIONES = `http://localhost:3001/mis-devoluciones/${userId}`;

  const resolverImagen = (p) => {
    const name = (p.Nombre_Producto || "").toLowerCase();
    if (name.includes("chaqueta")) return chaquetaindus;
    if (name.includes("bota")) return botas;
    if (name.includes("guante")) return guantes;
    if (name.includes("casco")) return casco;
    
    if (p.Imagen && p.Imagen.startsWith("http")) return p.Imagen;
    return chaquetaindus;
  };

  const cargarPedidos = () => {
    if (!userId) return;
    setLoadingPedidos(true);

    // Leer pedidos simulados con la clave basada en userId
    const keyPedidos = `pedidos_simulados_${userId}`;
    const simulados = JSON.parse(localStorage.getItem(keyPedidos) || "[]");

    fetch(URL_PEDIDOS)
      .then((res) => {
        if (!res.ok) throw new Error("Error al obtener pedidos");
        return res.json();
      })
      .then((data) => {
        // Combinar pedidos reales con simulados (sin duplicar por idFacturas)
        const idsReales = new Set(data.map((p) => p.idFacturas));
        const simuladosFiltrados = simulados.filter((s) => !idsReales.has(s.idFacturas));
        setPedidos([...simuladosFiltrados, ...data]);
        setLoadingPedidos(false);
      })
      .catch(() => {
        // Sin servidor: mostrar solo los simulados
        setPedidos(simulados);
        setLoadingPedidos(false);
      });
  };

  const cargarDevoluciones = () => {
    if (!userId) return;
    setLoadingDevoluciones(true);
    fetch(URL_DEVOLUCIONES)
      .then((res) => {
        if (!res.ok) throw new Error("Error al obtener devoluciones");
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
    cargarPedidos();
  }, [usuario]);

  useEffect(() => {
    if (seccion === "devoluciones") {
      cargarDevoluciones();
    }
  }, [seccion]);

  // Cargar artículos del pedido
  const verArticulos = (pedido) => {
    setPedidoSeleccionado(pedido);
    setLoadingDetalle(true);
    setDetalles([]);

    // Si el pedido es simulado, leerlo del localStorage directamente
    if (pedido._simulado) {
      const keyDetalle = `pedido_detalle_simulado_${pedido.idFacturas}`;
      const detallesGuardados = JSON.parse(localStorage.getItem(keyDetalle) || "[]");
      setDetalles(detallesGuardados);
      setLoadingDetalle(false);
      return;
    }

    fetch(`http://localhost:3001/pedido-detalle/${pedido.idFacturas}`)
      .then((res) => {
        if (!res.ok) throw new Error("Error al obtener artículos");
        return res.json();
      })
      .then((data) => {
        setDetalles(data);
        setLoadingDetalle(false);
      })
      .catch((err) => {
        console.error(err);
        // Intentar con localStorage como fallback
        const keyDetalle = `pedido_detalle_simulado_${pedido.idFacturas}`;
        const detallesGuardados = JSON.parse(localStorage.getItem(keyDetalle) || "[]");
        setDetalles(detallesGuardados);
        setLoadingDetalle(false);
      });
  };

  // Cargar seguimiento logístico
  const verSeguimiento = (pedido) => {
    setLoadingSeguimiento(true);
    setSeguimiento(null);
    setPedidoSeleccionado(pedido);
    setMostrarSeguimientoModal(true);

    fetch(`http://localhost:3001/seguimiento/${pedido.idFacturas}`)
      .then((res) => {
        if (res.status === 404) {
          // No hay seguimiento registrado en la tabla Entregas
          return {
            idEntregas: null,
            Estado_Entrega: pedido.Estado || "Pendiente",
            Observaciones: "El pedido está siendo procesado en bodega."
          };
        }
        if (!res.ok) throw new Error("Error al obtener seguimiento");
        return res.json();
      })
      .then((data) => {
        setSeguimiento(data);
        setLoadingSeguimiento(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingSeguimiento(false);
      });
  };

  const mostrarInfoDevolucion = () => {
    Swal.fire({
      title: "Información de Devoluciones",
      html: `
        <div class="text-start" style="font-size: 14.5px; line-height: 1.6; color: #475569;">
          <p>En <strong>Tecnomatic MAV</strong>, las devoluciones no se pueden exigir de manera automatizada ni directa por el cliente.</p>
          <p>Si consideras que un producto de tu pedido tiene alguna inconformidad y deseas evaluar la posibilidad de realizar un cambio o retorno, contáctanos a soporte:</p>
          <ul style="padding-left: 20px;" class="my-3">
            <li class="mb-2"><strong>WhatsApp:</strong> <a href="https://wa.me/573001234567" target="_blank" style="color: #20B2AA; text-decoration: none; font-weight: bold;">+57 300 123 4567</a></li>
            <li><strong>Correo:</strong> <a href="mailto:soporte@tecnomaticmav.com" style="color: #20B2AA; text-decoration: none; font-weight: bold;">soporte@tecnomaticmav.com</a></li>
          </ul>
          <p class="mb-0 text-muted small" style="font-size: 12px;"><em>* Por favor indica tu número de pedido y adjunta evidencia fotográfica. Toda devolución queda sujeta a la aprobación de un asesor según nuestras políticas comerciales vigentes.</em></p>
        </div>
      `,
      icon: "info",
      confirmButtonText: "Entendido",
      confirmButtonColor: "#0047AB"
    });
  };

  // Funciones de devolución avanzada
  const abrirFormularioDevolucion = (producto) => {
    setDevolucionModalProducto(producto);
    setDevolucionModalPedido(pedidoSeleccionado);
    setDevolucionPaso(1);
    setDevCantidad(producto.Cantidad);
    setDevMotivoCategoria("Defectuoso");
    setDevMetodoReembolso("MetodoOriginal");
    setDevMetodoRetorno("EntregaSucursal");
    setDevDireccion("");
    setDevNotas("");
    setDevEvidencia("");
    
    // Cerrar modal de detalles del pedido
    setPedidoSeleccionado(null);
  };

  const enviarSolicitudDevolucion = async () => {
    if (!devNotas.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campo requerido",
        text: "Por favor describe el motivo detallado de tu devolución.",
        confirmButtonColor: "#0047AB"
      });
      return;
    }

    setEnviandoDevolucion(true);
    try {
      const response = await fetch("http://localhost:3001/devoluciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facturaId: devolucionModalPedido.idFacturas,
          productoId: devolucionModalProducto.idProductos,
          usuarioId: usuario.idUsuarios,
          cantidad: devCantidad,
          motivo: devNotas,
          motivoCategoria: devMotivoCategoria,
          metodoReembolso: "MetodoOriginal",
          metodoRetorno: "EntregaSucursal",
          direccionRetorno: "",
          evidenciaUrl: null
        })
      });

      if (!response.ok) throw new Error("Error al enviar devolución");

      Swal.fire({
        icon: "success",
        title: "Solicitud Enviada",
        text: "Tu solicitud de devolución ha sido registrada manualmente. Nuestro equipo la revisará.",
        confirmButtonColor: "#20B2AA"
      });

      setDevolucionModalProducto(null);
      setDevolucionModalPedido(null);
      
      // Recargar devoluciones e ir a la sección
      setSeccion("devoluciones");
      cargarDevoluciones();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo registrar la solicitud de devolución.",
        confirmButtonColor: "#0047AB"
      });
    } finally {
      setEnviandoDevolucion(false);
    }
  };

  // Mapear color según el estado
  const obtenerEstadoEstilo = (estado) => {
    const est = (estado || "Pendiente").toLowerCase();
    if (est === "entregado") {
      return { bg: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" };
    }
    if (est === "cancelado") {
      return { bg: "#fef2f2", color: "#b91c1c", border: "1px solid #fca5a5" };
    }
    if (est === "enviado") {
      return { bg: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" };
    }
    if (est === "preparando") {
      return { bg: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" };
    }
    return { bg: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }; // Pendiente / default
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container py-5"
    >
      <div className="mb-4">
        <h3 className="fw-bold mb-1" style={{ color: "#0047AB" }}>📦 Historial de Compras</h3>
        <p className="text-muted" style={{ fontSize: "14px" }}>Revisa tus pedidos anteriores, realiza seguimiento logístico y solicita devoluciones.</p>
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
            setPedidoSeleccionado(null);
          }}
        >
          <i className="bi bi-receipt me-2"></i> Mis Pedidos
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
            setPedidoSeleccionado(null);
          }}
        >
          <i className="bi bi-arrow-left-right me-2"></i> Mis Devoluciones
        </button>
      </div>

      <div className="row g-4">
        {/* TAB PEDIDOS */}
        {seccion === "pedidos" && (
          <div className="col-12">
            <div className="tm-table-container">
              <h5 className="fw-bold mb-4" style={{ color: "#0047AB" }}>
                <i className="bi bi-box-seam me-2"></i> Registro de Compras
              </h5>

              {loadingPedidos ? (
                <div className="text-center py-5">
                  <span className="spinner-border spinner-border text-primary" role="status" />
                  <p className="text-muted mt-2 mb-0" style={{ fontSize: "13px" }}>Consultando tu historial...</p>
                </div>
              ) : pedidos.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-basket-fill" style={{ fontSize: "2.5rem" }}></i>
                  <p className="mt-2 fw-semibold" style={{ fontSize: "15px" }}>Aún no has realizado ninguna compra.</p>
                  <button 
                    className="btn btn-sm text-white mt-1 fw-bold"
                    style={{ backgroundColor: "#20B2AA", borderRadius: "10px" }}
                    onClick={() => setPagina("productos")}
                  >
                    Ver Catálogo
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="tm-table">
                    <thead>
                      <tr>
                        <th>Pedido #</th>
                        <th>Fecha</th>
                        <th>Artículos</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidos.map((p) => {
                        const est = obtenerEstadoEstilo(p.Estado);
                        return (
                          <tr 
                            key={p.idFacturas}
                            style={{
                              backgroundColor: pedidoSeleccionado?.idFacturas === p.idFacturas ? "rgba(32, 178, 170, 0.04)" : "transparent"
                            }}
                          >
                            <td className="fw-bold text-dark">#{p.idFacturas}</td>
                            <td>{p.Fecha ? new Date(p.Fecha).toLocaleDateString() : ""}</td>
                            <td className="small text-muted text-truncate" style={{ maxWidth: "200px" }}>
                              {p.Productos || "Detalles en botón ver"}
                            </td>
                            <td className="fw-bold text-primary">${p.Total?.toLocaleString()}</td>
                            <td>
                              <span
                                className="badge px-3 py-1.5"
                                style={{
                                  borderRadius: "20px",
                                  fontSize: "10.5px",
                                  backgroundColor: est.bg,
                                  color: est.color,
                                  border: est.border
                                }}
                              >
                                {p.Estado || "Pendiente"}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex gap-1.5">
                                <button
                                  className="btn btn-sm text-white"
                                  style={{ backgroundColor: "#0047AB", borderRadius: "8px", fontSize: "11.5px", padding: "6px 12px" }}
                                  onClick={() => verArticulos(p)}
                                >
                                  Ver
                                </button>
                                {p.Estado !== "Cancelado" && (
                                  <button
                                    className="btn btn-sm btn-outline-secondary"
                                    style={{ borderRadius: "8px", fontSize: "11.5px", padding: "6px 12px" }}
                                    onClick={() => verSeguimiento(p)}
                                  >
                                    Seguimiento
                                  </button>
                                )}
                              </div>
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

        {/* MODAL DE DETALLE DEL PEDIDO */}
        <AnimatePresence>
          {seccion === "pedidos" && pedidoSeleccionado && !mostrarSeguimientoModal && (
            <div 
              className="modal show d-block" 
              style={{ backgroundColor: "rgba(0, 0, 0, 0.45)", backdropFilter: "blur(4px)", zIndex: 1040 }}
              onClick={() => setPedidoSeleccionado(null)}
            >
              <div className="modal-dialog modal-dialog-centered modal-md" onClick={(e) => e.stopPropagation()}>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="modal-content border-0 p-4"
                  style={{ borderRadius: "24px" }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                    <h5 className="fw-bold mb-0" style={{ color: "#0047AB" }}>
                      <i className="bi bi-info-circle me-2"></i> Artículos del Pedido #{pedidoSeleccionado.idFacturas}
                    </h5>
                    <button 
                      type="button" 
                      className="btn-close" 
                      onClick={() => setPedidoSeleccionado(null)}
                      style={{ fontSize: "12px" }}
                    />
                  </div>

                  <div className="d-flex flex-column gap-2 mb-4 small text-muted">
                    <div className="d-flex justify-content-between">
                      <span>Fecha de compra:</span>
                      <strong className="text-dark">{new Date(pedidoSeleccionado.Fecha).toLocaleDateString()}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Estado del Envío:</span>
                      <strong className="text-dark">{pedidoSeleccionado.Estado || "Pendiente"}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Total pagado:</span>
                      <strong className="text-primary fs-6">${pedidoSeleccionado.Total?.toLocaleString()} COP</strong>
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3" style={{ color: "#0047AB" }}>
                    <i className="bi bi-cart3 me-1.5"></i> Detalle de compra:
                  </h6>

                  {loadingDetalle ? (
                    <div className="text-center py-4">
                      <span className="spinner-border spinner-border-sm text-secondary" role="status" />
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2.5 mb-2" style={{ maxHeight: "300px", overflowY: "auto" }}>
                      {detalles.map((d, i) => (
                        <div 
                          key={i}
                          className="p-3 rounded-4 bg-light border d-flex justify-content-between align-items-center"
                        >
                          <div className="d-flex align-items-center gap-3">
                            <img 
                              src={resolverImagen(d)} 
                              alt={d.Nombre_Producto} 
                              style={{ width: "44px", height: "44px", objectFit: "cover", borderRadius: "8px" }}
                            />
                            <div>
                              <span className="fw-bold text-dark d-block" style={{ fontSize: "13px" }}>{d.Nombre_Producto}</span>
                              <span className="text-muted small">${d.Precio_Unitario?.toLocaleString()} x {d.Cantidad}</span>
                            </div>
                          </div>
                          
                          <div className="text-end">
                            <div className="fw-bold text-dark mb-1" style={{ fontSize: "13.5px" }}>
                              ${(d.Precio_Unitario * d.Cantidad).toLocaleString()}
                            </div>
                            
                            {(pedidoSeleccionado.Estado === "Entregado" || pedidoSeleccionado.Estado_Entrega === "Entregado") && (
                              <button
                                className="btn btn-sm btn-outline-warning text-dark py-1 px-2.5"
                                style={{ borderRadius: "20px", fontSize: "10.5px" }}
                                onClick={() => abrirFormularioDevolucion(d)}
                              >
                                Devolver
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 text-end">
                    <button 
                      className="btn btn-secondary px-4 fw-bold" 
                      style={{ borderRadius: "12px" }}
                      onClick={() => setPedidoSeleccionado(null)}
                    >
                      Cerrar
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* TAB DEVOLUCIONES */}
        {seccion === "devoluciones" && (
          <div className="col-12">
            <div className="tm-table-container">
              <h5 className="fw-bold mb-4" style={{ color: "#0047AB" }}>
                <i className="bi bi-arrow-left-right me-2"></i> Solicitudes de Devolución
              </h5>

              <div 
                className="p-3 mb-4 rounded-4 border-0 d-flex align-items-center gap-3"
                style={{ 
                  background: "linear-gradient(135deg, rgba(32, 178, 170, 0.1) 0%, rgba(0, 71, 171, 0.08) 100%)",
                  borderLeft: "5px solid #20B2AA",
                  color: "#0f365c"
                }}
              >
                <div 
                  className="d-flex align-items-center justify-content-center rounded-circle"
                  style={{ width: "38px", height: "38px", background: "rgba(32, 178, 170, 0.15)", color: "#20B2AA", flexShrink: 0 }}
                >
                  <i className="bi bi-info-circle-fill" style={{ fontSize: "1.1rem" }}></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-1" style={{ fontSize: "13.5px", color: "#0047AB" }}>Política de Devoluciones</h6>
                  <p className="mb-0 text-muted" style={{ fontSize: "12.5px", lineHeight: "1.4" }}>
                    Para exigir una devolución de un producto entregado, ingresa a la pestaña <strong>Mis Pedidos</strong>, haz clic en <strong>Ver</strong> sobre tu pedido y presiona el botón <strong>Devolver</strong>. Completa la cantidad y escribe tu motivo detallado. Nuestro equipo técnico evaluará tu solicitud manual y la resolverá a la brevedad.
                  </p>
                </div>
              </div>

              {loadingDevoluciones ? (
                <div className="text-center py-5">
                  <span className="spinner-border spinner-border text-primary" role="status" />
                  <p className="text-muted mt-2 mb-0" style={{ fontSize: "13px" }}>Cargando solicitudes...</p>
                </div>
              ) : devoluciones.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-shield-exclamation" style={{ fontSize: "2.5rem" }}></i>
                  <p className="mt-2 mb-0" style={{ fontSize: "14px" }}>No tienes ninguna solicitud de devolución registrada.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="tm-table">
                    <thead>
                      <tr>
                        <th>Pedido #</th>
                        <th>Fecha</th>
                        <th>Producto</th>
                        <th>Cant.</th>
                        <th>Motivo</th>
                        <th>Reembolso / Envío</th>
                        <th>Estado</th>
                        <th>Acción</th>
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
                        
                        let catText = "General";
                        if (dev.Motivo_Categoria === "Defectuoso") catText = "Defectuoso";
                        else if (dev.Motivo_Categoria === "DiferenteFoto") catText = "Dif. Foto";
                        else if (dev.Motivo_Categoria === "TallaMedidaIncorrecta") catText = "Medida/Talla";
                        else if (dev.Motivo_Categoria === "DañadoEnvio") catText = "Roto Envío";
                        else if (dev.Motivo_Categoria === "Arrepentido") catText = "Arrepentido";
                        else if (dev.Motivo_Categoria === "Otro") catText = "Otro";

                        return (
                          <tr key={dev.idDevoluciones}>
                            <td className="fw-bold text-dark">#{dev.Facturas_idFacturas}</td>
                            <td>{dev.Fecha ? new Date(dev.Fecha).toLocaleDateString() : ""}</td>
                            <td className="fw-semibold text-dark">{dev.Nombre_Producto}</td>
                            <td>{dev.Cantidad}</td>
                            <td style={{ fontSize: "13px", color: "#475569" }}>
                              <span className="badge bg-secondary-subtle text-secondary-emphasis mb-1" style={{ fontSize: "10.5px" }}>{catText}</span>
                              <div className="text-truncate" style={{ maxWidth: "150px" }}>{dev.Motivo}</div>
                            </td>
                            <td style={{ fontSize: "12px", color: "#475569" }}>
                              <div><strong>Reembolso:</strong> {dev.Metodo_Reembolso === "CreditoTienda" ? "Cupón" : "Original"}</div>
                              <div><strong>Retorno:</strong> {dev.Metodo_Retorno === "RetiroDomicilio" ? "Pick-up" : "Sucursal"}</div>
                            </td>
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
                              <button
                                className="btn btn-sm text-white"
                                style={{ backgroundColor: "#20B2AA", borderRadius: "8px", fontSize: "11.5px", padding: "6px 12px" }}
                                onClick={() => setDevolucionSeleccionada(dev)}
                              >
                                Ver Detalle
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
          </div>
        )}
      </div>

      {/* MODAL DE SEGUIMIENTO (TIMELINE) */}
      <AnimatePresence>
        {mostrarSeguimientoModal && pedidoSeleccionado && (
          <div 
            className="modal show d-block" 
            style={{ backgroundColor: "rgba(0, 0, 0, 0.45)", backdropFilter: "blur(4px)" }}
            onClick={() => setMostrarSeguimientoModal(false)}
          >
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="modal-content border-0 p-4"
                style={{ borderRadius: "24px" }}
              >
                <div className="d-flex justify-content-between align-items-center mb-4 pb-1 border-bottom">
                  <h5 className="modal-title fw-bold" style={{ color: "#0047AB" }}>
                    <i className="bi bi-geo-alt me-2"></i> Seguimiento Pedido #{pedidoSeleccionado.idFacturas}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setMostrarSeguimientoModal(false)}
                  />
                </div>

                {loadingSeguimiento ? (
                  <div className="text-center py-5">
                    <span className="spinner-border spinner-border-sm text-primary" />
                  </div>
                ) : (
                  <div>
                    {/* Visual Stepper */}
                    <div className="d-flex flex-column gap-4 py-2 position-relative">
                      {/* Vertical line behind steps */}
                      <div 
                        style={{
                          position: "absolute",
                          left: "17px",
                          top: "20px",
                          bottom: "20px",
                          width: "3px",
                          backgroundColor: "#edf2f7",
                          zIndex: 1
                        }}
                      />

                      {/* Step 1: Recibido */}
                      <div className="d-flex align-items-start gap-3 position-relative" style={{ zIndex: 2 }}>
                        <div 
                          className="d-flex align-items-center justify-content-center rounded-circle"
                          style={{
                            width: "36px",
                            height: "36px",
                            backgroundColor: "#ecfdf5",
                            color: "#047857",
                            border: "2px solid #a7f3d0",
                            fontSize: "14px",
                            fontWeight: "bold"
                          }}
                        >
                          ✓
                        </div>
                        <div>
                          <h6 className="fw-bold text-dark mb-0.5">Pedido Recibido</h6>
                          <p className="text-muted small mb-0">Hemos registrado tu compra y orden en la base de datos.</p>
                        </div>
                      </div>

                      {/* Step 2: Preparando */}
                      {(() => {
                        const status = (pedidoSeleccionado.Estado || "Pendiente").toLowerCase();
                        const isActive = status === "preparando" || status === "enviado" || status === "entregado";
                        return (
                          <div className="d-flex align-items-start gap-3 position-relative" style={{ zIndex: 2 }}>
                            <div 
                              className="d-flex align-items-center justify-content-center rounded-circle"
                              style={{
                                width: "36px",
                                height: "36px",
                                backgroundColor: isActive ? "#ecfdf5" : "#f8fafc",
                                color: isActive ? "#047857" : "#cbd5e1",
                                border: isActive ? "2px solid #a7f3d0" : "2px solid #e2e8f0",
                                fontSize: "14px",
                                fontWeight: "bold"
                              }}
                            >
                              {isActive ? "✓" : "2"}
                            </div>
                            <div>
                              <h6 className={`fw-bold mb-0.5 ${isActive ? "text-dark" : "text-muted"}`}>En Preparación</h6>
                              <p className="text-muted small mb-0">Seleccionando artículos en almacén y embalando.</p>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Step 3: Enviado */}
                      {(() => {
                        const status = (pedidoSeleccionado.Estado || "Pendiente").toLowerCase();
                        const isActive = status === "enviado" || status === "entregado";
                        return (
                          <div className="d-flex align-items-start gap-3 position-relative" style={{ zIndex: 2 }}>
                            <div 
                              className="d-flex align-items-center justify-content-center rounded-circle"
                              style={{
                                width: "36px",
                                height: "36px",
                                backgroundColor: isActive ? "#ecfdf5" : "#f8fafc",
                                color: isActive ? "#047857" : "#cbd5e1",
                                border: isActive ? "2px solid #a7f3d0" : "2px solid #e2e8f0",
                                fontSize: "14px",
                                fontWeight: "bold"
                              }}
                            >
                              {isActive ? "✓" : "3"}
                            </div>
                            <div>
                              <h6 className={`fw-bold mb-0.5 ${isActive ? "text-dark" : "text-muted"}`}>Enviado</h6>
                              <p className="text-muted small mb-0">El pedido está en tránsito a la dirección de destino.</p>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Step 4: Entregado */}
                      {(() => {
                        const status = (pedidoSeleccionado.Estado || "Pendiente").toLowerCase();
                        const isActive = status === "entregado";
                        return (
                          <div className="d-flex align-items-start gap-3 position-relative" style={{ zIndex: 2 }}>
                            <div 
                              className="d-flex align-items-center justify-content-center rounded-circle"
                              style={{
                                width: "36px",
                                height: "36px",
                                backgroundColor: isActive ? "#ecfdf5" : "#f8fafc",
                                color: isActive ? "#047857" : "#cbd5e1",
                                border: isActive ? "2px solid #a7f3d0" : "2px solid #e2e8f0",
                                fontSize: "14px",
                                fontWeight: "bold"
                              }}
                            >
                              {isActive ? "✓" : "4"}
                            </div>
                            <div>
                              <h6 className={`fw-bold mb-0.5 ${isActive ? "text-dark" : "text-muted"}`}>Entregado</h6>
                              <p className="text-muted small mb-0">Pedido recibido de conformidad.</p>
                            </div>
                          </div>
                        );
                      })()}

                    </div>

                    <div className="p-3 bg-light rounded-4 border mt-4">
                      <div className="small fw-semibold text-secondary mb-1">Observaciones Logísticas:</div>
                      <div className="text-dark small mb-3">
                        {seguimiento?.Observaciones || "El personal de logística está procesando este pedido. Pronto verás más novedades."}
                      </div>
                      
                      {seguimiento?.Fecha_entrega && (
                        <div className="small text-muted">
                          <i className="bi bi-calendar-event me-1"></i> Fecha tentativa de entrega: <strong>{new Date(seguimiento.Fecha_entrega).toLocaleDateString()}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE DEVOLUCIÓN MANUAL */}
      <AnimatePresence>
        {devolucionModalProducto && devolucionModalPedido && (
          <div 
            className="modal show d-block" 
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(6px)", zIndex: 1050 }}
            onClick={() => {
              setDevolucionModalProducto(null);
              setDevolucionModalPedido(null);
            }}
          >
            <div className="modal-dialog modal-dialog-centered modal-md" onClick={(e) => e.stopPropagation()}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                transition={{ duration: 0.3 }}
                className="modal-content border-0 overflow-hidden"
                style={{ borderRadius: "24px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}
              >
                {/* Encabezado */}
                <div 
                  className="p-4 text-white d-flex justify-content-between align-items-center"
                  style={{ background: "linear-gradient(135deg, #0047AB 0%, #20B2AA 100%)" }}
                >
                  <h5 className="modal-title fw-bold mb-0">
                    <i className="bi bi-arrow-left-right me-2"></i>
                    Solicitud de Devolución
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={() => {
                      setDevolucionModalProducto(null);
                      setDevolucionModalPedido(null);
                    }}
                  />
                </div>

                {/* Contenido */}
                <div className="p-4 bg-light">
                  <div className="card border-0 shadow-sm p-3 mb-4 bg-white rounded-4 d-flex flex-row align-items-center gap-3">
                    <img 
                      src={resolverImagen(devolucionModalProducto)} 
                      alt={devolucionModalProducto.Nombre_Producto} 
                      className="rounded-3"
                      style={{ width: "60px", height: "60px", objectFit: "contain" }}
                    />
                    <div>
                      <h6 className="fw-bold text-dark mb-1">{devolucionModalProducto.Nombre_Producto}</h6>
                      <p className="text-muted small mb-0">Precio unitario: ${devolucionModalProducto.Precio_Unitario?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="row g-3">
                    {/* Cantidad */}
                    <div className="col-md-5">
                      <label className="form-label fw-bold text-secondary mb-1">Cantidad a Devolver</label>
                      <div className="d-flex align-items-center gap-2">
                        <button 
                          className="btn btn-outline-secondary btn-sm px-2.5 py-1"
                          onClick={() => setDevCantidad(Math.max(1, devCantidad - 1))}
                          style={{ borderRadius: "8px" }}
                        >
                          -
                        </button>
                        <input 
                          type="number" 
                          className="form-control text-center fw-bold px-1" 
                          value={devCantidad} 
                          readOnly
                          style={{ width: "50px", borderRadius: "8px" }} 
                        />
                        <button 
                          className="btn btn-outline-secondary btn-sm px-2.5 py-1"
                          onClick={() => setDevCantidad(Math.min(devolucionModalProducto.Cantidad, devCantidad + 1))}
                          style={{ borderRadius: "8px" }}
                        >
                          +
                        </button>
                        <span className="text-muted small ms-1">Máx: {devolucionModalProducto.Cantidad}</span>
                      </div>
                    </div>

                    {/* Categoría del motivo */}
                    <div className="col-md-7">
                      <label className="form-label fw-bold text-secondary mb-1">Categoría del Motivo</label>
                      <select 
                        className="form-select" 
                        value={devMotivoCategoria} 
                        onChange={(e) => setDevMotivoCategoria(e.target.value)}
                        style={{ borderRadius: "10px" }}
                      >
                        <option value="Defectuoso">Defectuoso o no funciona</option>
                        <option value="DiferenteFoto">Diferente a la descripción</option>
                        <option value="TallaMedidaIncorrecta">Talla/Medida incorrecta</option>
                        <option value="DañadoEnvio">Dañado por la paquetería</option>
                        <option value="Arrepentido">Me arrepentí de la compra</option>
                        <option value="Otro">Otro motivo</option>
                      </select>
                    </div>

                    {/* Motivo escrito a mano */}
                    <div className="col-12">
                      <label className="form-label fw-bold text-secondary mb-1">Explica el Motivo (Manual)</label>
                      <textarea 
                        className="form-control" 
                        rows="4" 
                        placeholder="Escribe detalladamente por qué solicitas la devolución..."
                        value={devNotas}
                        onChange={(e) => setDevNotas(e.target.value)}
                        style={{ borderRadius: "10px" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Pie */}
                <div className="p-4 bg-white border-top d-flex justify-content-between">
                  <button 
                    className="btn btn-outline-secondary px-4 fw-bold"
                    style={{ borderRadius: "12px" }}
                    onClick={() => {
                      setDevolucionModalProducto(null);
                      setDevolucionModalPedido(null);
                    }}
                  >
                    Cancelar
                  </button>

                  <button 
                    className="btn px-4 fw-bold text-white"
                    style={{ backgroundColor: "#20B2AA", borderRadius: "12px" }}
                    disabled={enviandoDevolucion}
                    onClick={enviarSolicitudDevolucion}
                  >
                    {enviandoDevolucion ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar Solicitud"
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DETALLES DE DEVOLUCION (Línea de Tiempo) */}
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
                className="modal-content border-0"
                style={{ borderRadius: "24px" }}
              >
                <div className="p-4 border-bottom d-flex justify-content-between align-items-center bg-light">
                  <h5 className="fw-bold mb-0" style={{ color: "#0047AB" }}>
                    <i className="bi bi-clock-history me-2"></i>
                    Seguimiento Devolución #{devolucionSeleccionada.idDevoluciones}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setDevolucionSeleccionada(null)}
                  />
                </div>

                <div className="modal-body p-4 bg-light">
                  <div className="row g-4">
                    {/* Sección izquierda: Timeline */}
                    <div className="col-md-6 border-end">
                      <h6 className="fw-bold mb-4" style={{ color: "#0047AB" }}>Estado del Proceso</h6>
                      
                      {/* Timeline */}
                      <div className="d-flex flex-column gap-4 position-relative">
                        <div 
                          style={{
                            position: "absolute",
                            left: "17px",
                            top: "20px",
                            bottom: "20px",
                            width: "3px",
                            backgroundColor: "#edf2f7",
                            zIndex: 1
                          }}
                        />

                        {/* Paso 1: Recibido */}
                        <div className="d-flex align-items-start gap-3 position-relative" style={{ zIndex: 2 }}>
                          <div 
                            className="d-flex align-items-center justify-content-center rounded-circle"
                            style={{
                              width: "36px",
                              height: "36px",
                              backgroundColor: "#ecfdf5",
                              color: "#047857",
                              border: "2px solid #a7f3d0",
                              fontSize: "14px",
                              fontWeight: "bold"
                            }}
                          >
                            ✓
                          </div>
                          <div>
                            <h6 className="fw-bold text-dark mb-0.5">Solicitud Recibida</h6>
                            <p className="text-muted small mb-0">Hemos registrado tu solicitud de devolución en sistema.</p>
                          </div>
                        </div>

                        {/* Paso 2: En tránsito */}
                        {(() => {
                          const track = (devolucionSeleccionada.Estado_Tracking || "Solicitada").toLowerCase();
                          const isActive = track === "en tránsito" || track === "en inspección" || track === "resuelta" || track === "completado";
                          return (
                            <div className="d-flex align-items-start gap-3 position-relative" style={{ zIndex: 2 }}>
                              <div 
                                className="d-flex align-items-center justify-content-center rounded-circle"
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  backgroundColor: isActive ? "#ecfdf5" : "#f8fafc",
                                  color: isActive ? "#047857" : "#cbd5e1",
                                  border: isActive ? "2px solid #a7f3d0" : "2px solid #e2e8f0",
                                  fontSize: "14px",
                                  fontWeight: "bold"
                                }}
                              >
                                {isActive ? "✓" : "2"}
                              </div>
                              <div>
                                <h6 className={`fw-bold mb-0.5 ${isActive ? "text-dark" : "text-muted"}`}>En Tránsito</h6>
                                <p className="text-muted small mb-0">
                                  {devolucionSeleccionada.Metodo_Retorno === "RetiroDomicilio" 
                                    ? "La paquetería está en camino para retirar el paquete." 
                                    : "El paquete está en tránsito hacia nuestras bodegas."}
                                </p>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Paso 3: En Inspección */}
                        {(() => {
                          const track = (devolucionSeleccionada.Estado_Tracking || "Solicitada").toLowerCase();
                          const isActive = track === "en inspección" || track === "resuelta" || track === "completado";
                          return (
                            <div className="d-flex align-items-start gap-3 position-relative" style={{ zIndex: 2 }}>
                              <div 
                                className="d-flex align-items-center justify-content-center rounded-circle"
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  backgroundColor: isActive ? "#ecfdf5" : "#f8fafc",
                                  color: isActive ? "#047857" : "#cbd5e1",
                                  border: isActive ? "2px solid #a7f3d0" : "2px solid #e2e8f0",
                                  fontSize: "14px",
                                  fontWeight: "bold"
                                }}
                              >
                                {isActive ? "✓" : "3"}
                              </div>
                              <div>
                                <h6 className={`fw-bold mb-0.5 ${isActive ? "text-dark" : "text-muted"}`}>Inspección de Mercancía</h6>
                                <p className="text-muted small mb-0">Revisamos el estado físico del producto en nuestro almacén.</p>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Paso 4: Finalizada / Rechazada */}
                        {(() => {
                          const track = (devolucionSeleccionada.Estado_Tracking || "Solicitada").toLowerCase();
                          const est = (devolucionSeleccionada.Estado || "Pendiente").toLowerCase();
                          const isResolved = est === "aprobada" || est === "rechazada" || track === "resuelta" || track === "rechazada";
                          const isRejected = est === "rechazada";
                          return (
                            <div className="d-flex align-items-start gap-3 position-relative" style={{ zIndex: 2 }}>
                              <div 
                                className="d-flex align-items-center justify-content-center rounded-circle"
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  backgroundColor: isResolved ? (isRejected ? "#fef2f2" : "#ecfdf5") : "#f8fafc",
                                  color: isResolved ? (isRejected ? "#b91c1c" : "#047857") : "#cbd5e1",
                                  border: isResolved ? (isRejected ? "2px solid #fca5a5" : "2px solid #a7f3d0") : "2px solid #e2e8f0",
                                  fontSize: "14px",
                                  fontWeight: "bold"
                                }}
                              >
                                {isResolved ? "✓" : "4"}
                              </div>
                              <div>
                                <h6 className={`fw-bold mb-0.5 ${isResolved ? "text-dark" : "text-muted"}`}>
                                  {isRejected ? "Solicitud Rechazada" : "Resolución Final"}
                                </h6>
                                <p className="text-muted small mb-0">
                                  {isResolved 
                                    ? (isRejected ? "Tu solicitud no cumple los requisitos." : "Reembolso procesado de conformidad.") 
                                    : "Esperando inspección para resolución del reembolso."}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Sección derecha: Detalles */}
                    <div className="col-md-6">
                      <h6 className="fw-bold mb-3" style={{ color: "#0047AB" }}>Detalle del Producto</h6>
                      <div className="p-3 bg-white border rounded-4 d-flex align-items-center gap-3 mb-4">
                        <div className="flex-fill">
                          <span className="fw-bold text-dark d-block" style={{ fontSize: "14px" }}>
                            {devolucionSeleccionada.Nombre_Producto}
                          </span>
                          <span className="text-muted small">Cantidad: {devolucionSeleccionada.Cantidad} unidades</span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <span className="small text-secondary fw-semibold d-block">Categoría del Motivo:</span>
                        <span className="badge bg-secondary-subtle text-secondary-emphasis" style={{ fontSize: "12px" }}>
                          {devolucionSeleccionada.Motivo_Categoria || "General"}
                        </span>
                      </div>

                      <div className="mb-3">
                        <span className="small text-secondary fw-semibold d-block">Explicación del Cliente:</span>
                        <div className="p-2 bg-white rounded-3 border small text-dark" style={{ minHeight: "60px" }}>
                          {devolucionSeleccionada.Motivo}
                        </div>
                      </div>

                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <span className="small text-secondary fw-semibold d-block">Reembolso:</span>
                          <span className="small text-dark fw-bold">
                            {devolucionSeleccionada.Metodo_Reembolso === "CreditoTienda" ? "Cupón de Crédito 🎁" : "Método Original 💳"}
                          </span>
                        </div>
                        <div className="col-6">
                          <span className="small text-secondary fw-semibold d-block">Retorno:</span>
                          <span className="small text-dark fw-bold">
                            {devolucionSeleccionada.Metodo_Retorno === "RetiroDomicilio" ? "Pick-up Domicilio" : "Entrega en Oficina"}
                          </span>
                        </div>
                      </div>

                      {devolucionSeleccionada.Direccion_Retorno && (
                        <div className="mb-3">
                          <span className="small text-secondary fw-semibold d-block">Dirección de Recogida:</span>
                          <span className="small text-dark">{devolucionSeleccionada.Direccion_Retorno}</span>
                        </div>
                      )}

                      {/* Imagen de evidencia si existe */}
                      {devolucionSeleccionada.Evidencia_Url && (
                        <div className="mb-3">
                          <span className="small text-secondary fw-semibold d-block mb-1">Evidencia Adjunta:</span>
                          <img 
                            src={devolucionSeleccionada.Evidencia_Url} 
                            alt="Evidencia" 
                            className="img-thumbnail rounded-3" 
                            style={{ maxHeight: "100px", maxWidth: "150px", cursor: "pointer" }}
                            onClick={() => {
                              Swal.fire({
                                imageUrl: devolucionSeleccionada.Evidencia_Url,
                                imageAlt: "Evidencia de devolución",
                                confirmButtonColor: "#0047AB"
                              });
                            }}
                          />
                        </div>
                      )}

                      <hr />

                      {/* Resolución del administrador */}
                      {devolucionSeleccionada.Estado !== "Pendiente" && (
                        <div className={`p-3 rounded-4 border ${devolucionSeleccionada.Estado === "Aprobada" ? "bg-success bg-opacity-10 border-success" : "bg-danger bg-opacity-10 border-danger"}`}>
                          <h6 className="fw-bold mb-2">
                            {devolucionSeleccionada.Estado === "Aprobada" ? "✓ Aprobado por Administración" : "✗ Rechazado por Administración"}
                          </h6>
                          <p className="small mb-2 text-dark">
                            <strong>Comentario:</strong> {devolucionSeleccionada.Comentarios_Admin || "Sin comentarios."}
                          </p>

                          {devolucionSeleccionada.Estado === "Aprobada" && devolucionSeleccionada.Codigo_Cupon && (
                            <div className="p-2 bg-white rounded-3 border border-dashed border-success mt-2 text-center">
                              <span className="small text-muted d-block mb-1 font-monospace">CÓDIGO DE CUPÓN DE CRÉDITO</span>
                              <span className="fs-5 fw-bold text-success font-monospace d-block mb-2">{devolucionSeleccionada.Codigo_Cupon}</span>
                              <button 
                                className="btn btn-sm btn-success text-white px-3 fw-bold"
                                style={{ borderRadius: "8px", fontSize: "11px" }}
                                onClick={() => {
                                  navigator.clipboard.writeText(devolucionSeleccionada.Codigo_Cupon);
                                  Swal.fire({
                                    icon: "success",
                                    title: "Copiado",
                                    text: "El cupón se ha copiado al portapapeles",
                                    timer: 1000,
                                    showConfirmButton: false
                                  });
                                }}
                              >
                                Copiar Código
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3 border-top text-end bg-white">
                  <button 
                    className="btn btn-primary px-4" 
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

    </motion.div>
  );
}

export default MisPedidos;
