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

  const URL_PEDIDOS = `http://localhost:3001/mis-pedidos/${usuario?.idUsuarios}`;
  const URL_DEVOLUCIONES = `http://localhost:3001/mis-devoluciones/${usuario?.idUsuarios}`;

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
    if (!usuario) return;
    setLoadingPedidos(true);
    fetch(URL_PEDIDOS)
      .then((res) => {
        if (!res.ok) throw new Error("Error al obtener pedidos");
        return res.json();
      })
      .then((data) => {
        setPedidos(data);
        setLoadingPedidos(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingPedidos(false);
      });
  };

  const cargarDevoluciones = () => {
    if (!usuario) return;
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

  // Solicitar devolución de un producto específico
  const solicitarDevolucion = async (producto) => {
    const { value: form } = await Swal.fire({
      title: '<h5 class="fw-bold" style="color: #0047AB">Solicitar Devolución</h5>',
      html: `
        <div class="text-start px-2">
          <p class="small text-muted mb-3">Estás solicitando la devolución de <strong>${producto.Nombre_Producto}</strong> del pedido #${pedidoSeleccionado.idFacturas}.</p>
          
          <label class="form-label fw-bold">Cantidad a devolver (Máx: ${producto.Cantidad})</label>
          <input id="cantDev" type="number" class="form-control" min="1" max="${producto.Cantidad}" value="${producto.Cantidad}">
          
          <label class="form-label fw-bold mt-3">Motivo de Devolución</label>
          <textarea id="motivoDev" class="form-control" rows="3" placeholder="Describe brevemente por qué devuelves el producto..."></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Enviar Solicitud",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#20B2AA",
      cancelButtonColor: "#6c757d",
      customClass: { popup: 'rounded-4' },
      preConfirm: () => {
        const cantidad = Number(document.getElementById("cantDev").value);
        const motivo = document.getElementById("motivoDev").value.trim();

        if (isNaN(cantidad) || cantidad <= 0 || cantidad > producto.Cantidad) {
          Swal.showValidationMessage(`Ingresa una cantidad válida entre 1 y ${producto.Cantidad}`);
          return false;
        }
        if (!motivo) {
          Swal.showValidationMessage("El motivo de devolución es obligatorio");
          return false;
        }

        return { cantidad, motivo };
      }
    });

    if (form) {
      try {
        const response = await fetch("http://localhost:3001/devoluciones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            facturaId: pedidoSeleccionado.idFacturas,
            productoId: producto.idProductos,
            usuarioId: usuario.idUsuarios,
            cantidad: form.cantidad,
            motivo: form.motivo
          })
        });

        if (!response.ok) throw new Error("Error al enviar devolución");

        Swal.fire({
          icon: "success",
          title: "Solicitud Enviada",
          text: "El equipo revisará tu solicitud de devolución a la brevedad.",
          confirmButtonColor: "#20B2AA"
        });

        // Ocultar modal de detalles e ir a la pestaña devoluciones
        setPedidoSeleccionado(null);
        setSeccion("devoluciones");
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo registrar la solicitud de devolución.",
          confirmButtonColor: "#0047AB"
        });
      }
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
        {/* TABPEDIDOS */}
        {seccion === "pedidos" && (
          <div className={pedidoSeleccionado ? "col-lg-7" : "col-12"}>
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

        {/* DETALLE LATERAL (para tab pedidos) */}
        <AnimatePresence>
          {seccion === "pedidos" && pedidoSeleccionado && (
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
                    <i className="bi bi-info-circle me-2"></i> Artículos del Pedido #{pedidoSeleccionado.idFacturas}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setPedidoSeleccionado(null)}
                    style={{ fontSize: "12px" }}
                  />
                </div>

                <div className="d-flex flex-column gap-3 mb-4 small text-muted">
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
                  <div className="d-flex flex-column gap-2.5" style={{ maxHeight: "280px", overflowY: "auto" }}>
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
                          
                          {pedidoSeleccionado.Estado === "Entregado" && (
                            <button
                              className="btn btn-sm btn-outline-warning text-dark py-1 px-2.5"
                              style={{ borderRadius: "20px", fontSize: "10.5px" }}
                              onClick={() => solicitarDevolucion(d)}
                            >
                              Devolver
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TAB DEVOLUCIONES */}
        {seccion === "devoluciones" && (
          <div className="col-12">
            <div className="tm-table-container">
              <h5 className="fw-bold mb-4" style={{ color: "#0047AB" }}>
                <i className="bi bi-arrow-left-right me-2"></i> Solicitudes de Devolución
              </h5>

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
                        <th>Estado de Solicitud</th>
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

    </motion.div>
  );
}

export default MisPedidos;
