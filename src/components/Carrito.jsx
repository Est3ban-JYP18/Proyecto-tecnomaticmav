import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";

// Importación de activos locales como respaldo
import botas from "../assets/shopping.webp";
import chaquetaindus from "../assets/chaquetaindus.jfif";
import casco from "../assets/casco2.webp";
import guantes from "../assets/guantes2.jpg";

function Carrito({ carrito, eliminarDelCarrito, actualizarCantidad, vaciarCarrito, usuario, setPagina }) {
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  
  // Datos de Facturación
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [cedula, setCedula] = useState("");
  
  // Forma de Pago
  const [metodoPago, setMetodoPago] = useState("mercadopago"); // "mercadopago" o "pse"
  
  // PSE States
  const [bancos, setBancos] = useState([]);
  const [selectedBanco, setSelectedBanco] = useState("");
  const [tipoPersona, setTipoPersona] = useState("natural"); // "natural" o "juridica"

  // Cargar datos del usuario logueado
  useEffect(() => {
    if (usuario) {
      setNombre(`${usuario.Nombres || ""} ${usuario.Apellidos || ""}`.trim());
      setCorreo(usuario.Correo || "");
    }
  }, [usuario]);

  // Cargar bancos de PSE si se selecciona ese método
  useEffect(() => {
    if (metodoPago === "pse") {
      fetch("http://localhost:3001/bancos-pse")
        .then((res) => res.json())
        .then((data) => setBancos(data))
        .catch((err) => console.error("Error cargando bancos:", err));
    }
  }, [metodoPago]);

  const resolverImagen = (p) => {
    const name = (p.Nombre_Producto || "").toLowerCase();
    if (name.includes("chaqueta")) return chaquetaindus;
    if (name.includes("bota")) return botas;
    if (name.includes("guante")) return guantes;
    if (name.includes("casco")) return casco;
    
    if (p.Imagen && p.Imagen.startsWith("http")) return p.Imagen;
    return chaquetaindus;
  };

  const total = carrito.reduce((acc, item) => acc + item.Precio * item.cantidad, 0);

  const procesarCompra = async (e) => {
    e.preventDefault();

    if (!usuario) {
      Swal.fire({
        icon: "warning",
        title: "Inicio de sesión requerido",
        text: "Debes iniciar sesión para realizar la compra.",
        confirmButtonColor: "#0047AB"
      });
      setPagina("login");
      return;
    }

    if (carrito.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Carrito vacío",
        text: "Agrega productos a tu carrito antes de proceder.",
        confirmButtonColor: "#0047AB"
      });
      return;
    }

    if (!cedula || !telefono) {
      Swal.fire({
        icon: "warning",
        title: "Datos incompletos",
        text: "Por favor diligencia tu Cédula y Teléfono.",
        confirmButtonColor: "#0047AB"
      });
      return;
    }

    setLoadingCheckout(true);

    try {
      // 1. Guardar el pedido en MySQL llamando a POST /pedidos
      const pedidoData = {
        idUsuario: usuario.idUsuarios,
        total: total,
        productos: carrito.map((item) => ({
          idProducto: item.idProductos,
          cantidad: item.cantidad,
          precioUnitario: item.Precio
        }))
      };

      const responsePedido = await fetch("http://localhost:3001/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedidoData),
      });

      if (!responsePedido.ok) throw new Error("Error registrando el pedido en la BD");
      const pedResult = await responsePedido.json();

      // 2. Procesar según método seleccionado
      if (metodoPago === "mercadopago") {
        // Mercado Pago Checkout
        const responseMP = await fetch("http://localhost:3001/crear-pago", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ carrito })
        });

        if (!responseMP.ok) throw new Error("Error creando preferencia de Mercado Pago");
        const mpResult = await responseMP.json();

        // Vaciar carrito antes de redirigir
        vaciarCarrito();

        Swal.fire({
          icon: "success",
          title: "Redireccionando...",
          text: "Te enviaremos a la plataforma segura de Mercado Pago.",
          confirmButtonColor: "#20B2AA",
          timer: 2000,
          showConfirmButton: false
        });

        setTimeout(() => {
          window.location.href = mpResult.init_point;
        }, 1500);

      } else if (metodoPago === "pse") {
        if (!selectedBanco) {
          Swal.fire({
            icon: "warning",
            title: "Selecciona un banco",
            text: "Debes seleccionar una institución financiera para PSE.",
            confirmButtonColor: "#0047AB"
          });
          setLoadingCheckout(false);
          return;
        }

        // PSE Checkout
        const pseData = {
          total: total,
          correo: correo,
          nombres: usuario.Nombres,
          apellidos: usuario.Apellidos,
          numeroCedula: cedula,
          banco: selectedBanco,
          tipoCuenta: "Ahorros",
          tipoPersona: tipoPersona === "natural" ? "0" : "1", // 0 Natural, 1 Jurídica
          telefono: telefono // 👈 Enviamos la variable de estado 'telefono' al backend
        };

const responsePSE = await fetch("http://localhost:3001/pagar-pse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pseData)
        });

if (!responsePSE.ok) throw new Error("Error procesando pago PSE en Mercado Pago");
        const pseResult = await responsePSE.json();

        // Vaciar carrito
        vaciarCarrito();

if (pseResult.redirect_url) {
          Swal.fire({
            icon: "success",
            title: "Redireccionando a tu banco...",
            text: "Te enviaremos al portal de PSE de forma segura.",
            confirmButtonColor: "#20B2AA",
            timer: 2000,
            showConfirmButton: false
          });

setTimeout(() => {
            window.location.href = pseResult.redirect_url; // Redirige directamente a PSE
          }, 1500);
        } else {
          Swal.fire({
            icon: "info",
            title: "Pago PSE Iniciado",
            text: `Estado del pago: ${pseResult.status}. ID: ${pseResult.id}`,
            confirmButtonColor: "#20B2AA"
          });
          setPagina("home");
        }
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error al procesar",
        text: err.message || "Ocurrió un error en la pasarela de pagos.",
        confirmButtonColor: "#0047AB"
      });
    } finally {
      setLoadingCheckout(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container py-5"
    >
      <div className="mb-4">
        <h3 className="fw-bold mb-1" style={{ color: "#0047AB" }}>🛒 Carrito de Compras</h3>
        <p className="text-muted" style={{ fontSize: "14px" }}>Revisa tus artículos seleccionados y completa la transacción de forma segura.</p>
      </div>

      {carrito.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-5 shadow-sm bg-white rounded-4"
          style={{ border: "1px solid rgba(0,0,0,0.04)" }}
        >
          <i className="bi bi-cart-x text-muted" style={{ fontSize: "3.2rem" }}></i>
          <h5 className="fw-bold mt-3" style={{ color: "#0047AB" }}>Tu carrito está vacío</h5>
          <p className="text-muted small px-3">Parece que aún no has añadido ningún elemento de dotación a tu carrito.</p>
          <button 
            className="btn mt-2 text-white fw-bold"
            style={{ backgroundColor: "#20B2AA", borderRadius: "12px", padding: "10px 24px" }}
            onClick={() => setPagina("productos")}
          >
            Ver Catálogo de Productos
          </button>
        </motion.div>
      ) : (
        <div className="row g-4">
          
          {/* COLUMNA IZQUIERDA: DETALLES DE PRODUCTOS */}
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm p-4" style={{ borderRadius: "20px" }}>
              <h5 className="fw-bold mb-3" style={{ color: "#0047AB", fontSize: "16px" }}>
                <i className="bi bi-bag-check me-1.5"></i> Resumen de Artículos
              </h5>

              <div className="d-flex flex-column gap-3 mt-2">
                <AnimatePresence initial={false}>
                  {carrito.map((item) => (
                    <motion.div 
                      key={item.idProductos}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="d-flex align-items-center justify-content-between p-3 rounded-4"
                      style={{ backgroundColor: "#f8fafc", border: "1px solid rgba(0,0,0,0.03)" }}
                    >
                      {/* Imagen y nombre */}
                      <div className="d-flex align-items-center gap-3">
                        <img 
                          src={resolverImagen(item)} 
                          alt={item.Nombre_Producto} 
                          style={{ width: "56px", height: "56px", objectFit: "cover", borderRadius: "12px" }}
                        />
                        <div>
                          <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: "14.5px" }}>{item.Nombre_Producto}</h6>
                          <small className="text-muted">${item.Precio?.toLocaleString()} c/u</small>
                        </div>
                      </div>

                      {/* Controles cantidad */}
                      <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center border rounded-3 bg-white" style={{ height: "36px" }}>
                          <button 
                            type="button" 
                            className="btn btn-sm border-0 px-2.5 text-muted"
                            onClick={() => actualizarCantidad(item.idProductos, item.cantidad - 1)}
                          >
                            -
                          </button>
                          <span className="fw-bold text-dark px-1.5" style={{ fontSize: "14px", minWidth: "20px", textAlign: "center" }}>
                            {item.cantidad}
                          </span>
                          <button 
                            type="button" 
                            className="btn btn-sm border-0 px-2.5 text-muted"
                            onClick={() => actualizarCantidad(item.idProductos, item.cantidad + 1)}
                          >
                            +
                          </button>
                        </div>

                        {/* Subtotal e item eliminar */}
                        <div className="text-end" style={{ minWidth: "90px" }}>
                          <div className="fw-bold text-dark" style={{ fontSize: "14.5px" }}>
                            ${(item.Precio * item.cantidad).toLocaleString()}
                          </div>
                          <button 
                            type="button" 
                            className="btn btn-link text-danger p-0 text-decoration-none" 
                            style={{ fontSize: "12px" }}
                            onClick={() => eliminarDelCarrito(item.idProductos)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Botón vaciar */}
              <div className="text-start mt-3">
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline-secondary" 
                  style={{ borderRadius: "8px", fontSize: "12px" }}
                  onClick={vaciarCarrito}
                >
                  <i className="bi bi-trash"></i> Vaciar Carrito
                </button>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: DATOS DE ENVÍO Y PASARELA */}
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm p-4" style={{ borderRadius: "20px", borderLeft: "5px solid #20B2AA" }}>
              <h5 className="fw-bold mb-4" style={{ color: "#0047AB", fontSize: "16px" }}>
                <i className="bi bi-credit-card me-1.5"></i> Datos de Pago y Envío
              </h5>

              {!usuario ? (
                <div className="text-center py-4 bg-light rounded-4 px-3">
                  <i className="bi bi-exclamation-triangle-fill text-warning mb-2" style={{ fontSize: "1.8rem" }}></i>
                  <h6 className="fw-bold text-dark">Inicio de Sesión Requerido</h6>
                  <p className="text-muted small mb-3">Debes estar registrado e iniciar sesión con tu cuenta para poder facturar y procesar el pago de Mercado Pago.</p>
                  <button 
                    className="btn btn-primary btn-sm w-100" 
                    style={{ borderRadius: "10px", backgroundColor: "#0047AB", border: "none" }}
                    onClick={() => setPagina("login")}
                  >
                    Iniciar Sesión Ahora
                  </button>
                </div>
              ) : (
                <form onSubmit={procesarCompra}>
                  {/* Nombre */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Nombre Completo</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={nombre} 
                      onChange={(e) => setNombre(e.target.value)} 
                      required 
                    />
                  </div>

                  {/* Correo */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Correo Electrónico</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      value={correo} 
                      onChange={(e) => setCorreo(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="row g-2 mb-4">
                    {/* Cédula */}
                    <div className="col-sm-6">
                      <label className="form-label fw-bold">Cédula de Ciudadanía</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Ej. 10203040"
                        value={cedula} 
                        onChange={(e) => setCedula(e.target.value)} 
                        required 
                      />
                    </div>
                    {/* Teléfono */}
                    <div className="col-sm-6">
                      <label className="form-label fw-bold">Teléfono Celular</label>
                      <input 
                        type="tel" 
                        className="form-control" 
                        placeholder="Ej. 3001234567"
                        value={telefono} 
                        onChange={(e) => setTelefono(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>

                  {/* Selector de Método de Pago */}
                  <div className="mb-4">
                    <label className="form-label fw-bold d-block mb-2.5">Método de Pago Seguro</label>
                    <div className="d-flex gap-3">
                      <label 
                        className="flex-fill p-3 border rounded-4 text-center cursor-pointer position-relative d-flex flex-column align-items-center justify-content-center"
                        style={{
                          backgroundColor: metodoPago === "mercadopago" ? "rgba(32, 178, 170, 0.05)" : "#fff",
                          borderColor: metodoPago === "mercadopago" ? "#20B2AA" : "#edf2f7",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        <input 
                          type="radio" 
                          name="payment" 
                          value="mercadopago"
                          checked={metodoPago === "mercadopago"}
                          onChange={() => setMetodoPago("mercadopago")}
                          className="position-absolute opacity-0"
                        />
                        <i className="bi bi-wallet2 text-primary mb-1" style={{ fontSize: "1.5rem" }}></i>
                        <span className="fw-bold small text-dark">Mercado Pago</span>
                        <span className="text-muted" style={{ fontSize: "9.5px" }}>Tarjetas y Saldo</span>
                      </label>

                      <label 
                        className="flex-fill p-3 border rounded-4 text-center cursor-pointer position-relative d-flex flex-column align-items-center justify-content-center"
                        style={{
                          backgroundColor: metodoPago === "pse" ? "rgba(32, 178, 170, 0.05)" : "#fff",
                          borderColor: metodoPago === "pse" ? "#20B2AA" : "#edf2f7",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        <input 
                          type="radio" 
                          name="payment" 
                          value="pse"
                          checked={metodoPago === "pse"}
                          onChange={() => setMetodoPago("pse")}
                          className="position-absolute opacity-0"
                        />
                        <i className="bi bi-bank text-info mb-1" style={{ fontSize: "1.5rem" }}></i>
                        <span className="fw-bold small text-dark">PSE</span>
                        <span className="text-muted" style={{ fontSize: "9.5px" }}>Débito Bancario</span>
                      </label>
                    </div>
                  </div>

                  {/* PSE Fields */}
                  {metodoPago === "pse" && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="p-3 rounded-4 bg-light mb-4 border"
                      style={{ fontSize: "13.5px" }}
                    >
                      <div className="mb-2.5">
                        <label className="form-label fw-bold">Tipo de Persona</label>
                        <select 
                          className="form-select"
                          value={tipoPersona}
                          onChange={(e) => setTipoPersona(e.target.value)}
                        >
                          <option value="natural">Persona Natural</option>
                          <option value="juridica">Persona Jurídica</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label fw-bold">Selecciona tu Banco</label>
                        <select 
                          className="form-select"
                          value={selectedBanco}
                          onChange={(e) => setSelectedBanco(e.target.value)}
                          required={metodoPago === "pse"}
                        >
                          <option value="">Elegir banco...</option>
                          {bancos.map((b) => (
                            <option key={b.codigo} value={b.codigo}>{b.nombre}</option>
                          ))}
                        </select>
                      </div>
                    </motion.div>
                  )}

                  {/* Resumen costos */}
                  <div className="py-3 border-top border-bottom mb-4">
                    <div className="d-flex justify-content-between text-muted mb-1.5" style={{ fontSize: "13.5px" }}>
                      <span>Subtotal</span>
                      <span>${total.toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between text-muted mb-2" style={{ fontSize: "13.5px" }}>
                      <span>Envío nacional</span>
                      <span className="text-success fw-bold">Gratis</span>
                    </div>
                    <div className="d-flex justify-content-between fw-bold text-dark pt-1.5" style={{ fontSize: "15.5px" }}>
                      <span>Total de la Compra</span>
                      <span style={{ color: "#0047AB" }}>${total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Botón Pagar */}
                  <button
                    type="submit"
                    className="btn w-100 text-white fw-bold py-3 shadow-sm d-flex align-items-center justify-content-center"
                    style={{
                      background: "linear-gradient(135deg, #0047AB 0%, #20B2AA 100%)",
                      border: "none",
                      borderRadius: "14px",
                      fontSize: "15px"
                    }}
                    disabled={loadingCheckout}
                  >
                    {loadingCheckout ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Procesando pago seguro...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-shield-check me-2" style={{ fontSize: "17px" }}></i>
                        {metodoPago === "mercadopago" ? "Pagar con Mercado Pago" : "Iniciar Pago PSE"}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      )}
    </motion.div>
  );
}

export default Carrito;
