import { useState, useEffect } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { orderService } from "../services/orderService";
import { couponService } from "../services/couponService";

// Importación de activos locales como respaldo
import botas from "../assets/shopping.webp";
import chaquetaindus from "../assets/chaquetaindus.jfif";
import casco from "../assets/casco2.webp";
import guantes from "../assets/guantes2.jpg";

function Carrito({
  carrito,
  eliminarDelCarrito,
  actualizarCantidad,
  vaciarCarrito,
  usuario,
  setPagina,
}) {
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  // Datos de Facturación y Envío
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [cedula, setCedula] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("Bogotá D.C.");

  // Cupones de descuento
  const [codigoCupon, setCodigoCupon] = useState("");
  const [cuponAplicado, setCuponAplicado] = useState(null);
  const [validandoCupon, setValidandoCupon] = useState(false);

  // Forma de Pago
  const [metodoPago, setMetodoPago] = useState("mercadopago"); // "mercadopago" o "pse"

  // PSE States
  const [bancos, setBancos] = useState([
    { codigo: "1007", nombre: "Bancolombia" },
    { codigo: "1001", nombre: "Banco de Bogotá" },
    { codigo: "1013", nombre: "BBVA Colombia" },
    { codigo: "1006", nombre: "Banco Davivienda" },
    { codigo: "1009", nombre: "Citibank Colombia" },
    { codigo: "1040", nombre: "Banco Agrario" },
    { codigo: "1062", nombre: "Banco Falabella" },
    { codigo: "1032", nombre: "Banco Caja Social" },
  ]);
  const [selectedBanco, setSelectedBanco] = useState("");
  const [tipoPersona, setTipoPersona] = useState("natural");

  // Cargar datos del usuario logueado
  useEffect(() => {
    if (usuario) {
      setNombre(
        usuario.nombre ||
          `${usuario.Nombres || usuario.nombres || ""} ${usuario.Apellidos || usuario.apellidos || ""}`.trim()
      );
      setCorreo(usuario.correo || usuario.Correo || "");
      setTelefono(usuario.telefono || usuario.Telefono || "");
      setDireccion(usuario.direccion || usuario.Direccion || "");
      setCiudad(usuario.ciudad || usuario.Ciudad || "Bogotá D.C.");
    }
  }, [usuario]);

  const resolverImagen = (p) => {
    const name = (p.Nombre_Producto || "").toLowerCase();
    if (name.includes("chaqueta")) return chaquetaindus;
    if (name.includes("bota")) return botas;
    if (name.includes("guante")) return guantes;
    if (name.includes("casco")) return casco;
    if (p.Imagen && (p.Imagen.startsWith("http") || p.Imagen.startsWith("/src"))) return p.Imagen;
    return chaquetaindus;
  };

  const subtotal = carrito.reduce(
    (acc, item) => acc + Number(item.Precio || 0) * Number(item.cantidad || 1),
    0
  );

  const descuento = cuponAplicado ? cuponAplicado.descuento : 0;
  const total = Math.max(0, subtotal - descuento);

  // Validar Cupón
  const handleAplicarCupon = async (e) => {
    e.preventDefault();
    if (!codigoCupon.trim()) return;
    setValidandoCupon(true);
    try {
      const res = await couponService.validarCupon(codigoCupon, subtotal);
      setCuponAplicado(res);
      Swal.fire({
        icon: "success",
        title: "¡Cupón Aplicado!",
        text: res.mensaje,
        confirmButtonColor: "#20B2AA",
        timer: 2000,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Cupón no válido",
        text: err.message || "El cupón no existe o no cumple el monto mínimo.",
        confirmButtonColor: "#0047AB",
      });
    } finally {
      setValidandoCupon(false);
    }
  };

  const procesarCompra = async (e) => {
    e.preventDefault();

    if (!usuario) {
      Swal.fire({
        icon: "warning",
        title: "Inicio de sesión requerido",
        text: "Debes iniciar sesión para realizar la compra.",
        confirmButtonColor: "#0047AB",
      });
      setPagina("login");
      return;
    }

    if (carrito.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Carrito vacío",
        text: "Agrega productos a tu carrito antes de proceder.",
        confirmButtonColor: "#0047AB",
      });
      return;
    }

    if (!cedula || !telefono) {
      Swal.fire({
        icon: "warning",
        title: "Datos incompletos",
        text: "Por favor diligencia tu Cédula y Teléfono de contacto.",
        confirmButtonColor: "#0047AB",
      });
      return;
    }

    if (metodoPago === "pse" && !selectedBanco) {
      Swal.fire({
        icon: "warning",
        title: "Selecciona un banco",
        text: "Debes seleccionar una entidad bancaria para pagar por PSE.",
        confirmButtonColor: "#0047AB",
      });
      return;
    }

    setLoadingCheckout(true);

    try {
      const userId = usuario?.id || usuario?.idUsuarios;
      const datosEnvio = {
        nombres: nombre,
        correo: correo,
        cedula: cedula,
        telefono: telefono,
        direccion: direccion || "Entrega en obra / Bodega",
        ciudad: ciudad,
      };

      // 1. Crear el pedido directamente en Supabase
      const pedidoResult = await orderService.crearPedido({
        idUsuario: userId,
        total: total,
        productos: carrito,
        datosEnvio: datosEnvio,
        metodoPago: metodoPago === "mercadopago" ? "Mercado Pago (Tarjeta/Saldo)" : `PSE (${selectedBanco})`,
        codigoCupon: cuponAplicado?.codigo || null,
        descuento: descuento,
      });

      vaciarCarrito();

      if (metodoPago === "pse") {
        Swal.fire({
          icon: "success",
          title: "¡Pago PSE Aprobado!",
          html: `
            <p>Tu pedido <strong>#${pedidoResult.idFactura}</strong> ha sido registrado con éxito en <strong>Supabase</strong>.</p>
            <p class="text-muted small">Hemos generado tu guía de envío y número de seguimiento.</p>
          `,
          confirmButtonColor: "#20B2AA",
          confirmButtonText: "Ver mis pedidos",
        }).then(() => {
          setPagina("misPedidos");
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "¡Compra Exitosa en Supabase!",
          html: `
            <p>Factura <strong>#${pedidoResult.idFactura}</strong> generada correctamente.</p>
            <p class="text-muted small">El inventario se ha actualizado en tiempo real.</p>
          `,
          confirmButtonColor: "#20B2AA",
          confirmButtonText: "Ver Seguimiento de Entrega",
        }).then(() => {
          setPagina("misPedidos");
        });
      }
    } catch (err) {
      console.error("Error al procesar compra:", err);
      Swal.fire({
        icon: "error",
        title: "Error al procesar",
        text: err.message || "Ocurrió un inconveniente al registrar la compra.",
        confirmButtonColor: "#0047AB",
      });
    } finally {
      setLoadingCheckout(false);
    }
  };

  return (
    <Motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container py-5"
    >
      <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: "#0047AB" }}>
            🛒 Carrito de Compras Industrial
          </h3>
          <p className="text-muted" style={{ fontSize: "14px" }}>
            Revisa tus artículos de dotación, aplica cupones y procesa tu pedido en Supabase.
          </p>
        </div>
        {carrito.length > 0 && (
          <button
            className="btn btn-outline-danger btn-sm rounded-pill px-3"
            onClick={vaciarCarrito}
          >
            <i className="bi bi-trash me-1"></i> Vaciar Carrito
          </button>
        )}
      </div>

      {carrito.length === 0 ? (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-5 shadow-sm bg-white rounded-4"
          style={{ border: "1px solid rgba(0,0,0,0.04)" }}
        >
          <i
            className="bi bi-cart-x text-muted"
            style={{ fontSize: "3.2rem" }}
          ></i>
          <h5 className="fw-bold mt-3" style={{ color: "#0047AB" }}>
            Tu carrito está vacío
          </h5>
          <p className="text-muted small px-3">
            Parece que aún no has añadido ningún elemento de dotación a tu carrito.
          </p>
          <button
            className="btn mt-2 text-white fw-bold shadow-sm"
            style={{
              backgroundColor: "#20B2AA",
              borderRadius: "12px",
              padding: "10px 24px",
            }}
            onClick={() => setPagina("productos")}
          >
            Explorar Catálogo EPP
          </button>
        </Motion.div>
      ) : (
        <div className="row g-4">
          {/* COLUMNA IZQUIERDA: DETALLES DE PRODUCTOS */}
          <div className="col-lg-7">
            <div
              className="card border-0 shadow-sm p-4"
              style={{ borderRadius: "20px" }}
            >
              <h5
                className="fw-bold mb-3"
                style={{ color: "#0047AB", fontSize: "16px" }}
              >
                <i className="bi bi-bag-check me-2"></i> Artículos Seleccionados ({carrito.length})
              </h5>

              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr className="text-muted small">
                      <th>Producto</th>
                      <th>Talla/Color</th>
                      <th>Cantidad</th>
                      <th>Precio</th>
                      <th className="text-end">Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {carrito.map((item) => (
                      <tr key={`${item.idProductos}-${item.Talla}-${item.Color}`}>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <img
                              src={resolverImagen(item)}
                              alt={item.Nombre_Producto}
                              className="rounded-3 shadow-sm object-fit-cover"
                              style={{ width: 48, height: 48 }}
                            />
                            <div>
                              <div className="fw-bold text-dark small">
                                {item.Nombre_Producto}
                              </div>
                              <small className="text-muted">
                                {item.Tipo || item.Categoria}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {item.Talla || "M"}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-1">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary py-0 px-2 rounded-circle"
                              onClick={() =>
                                actualizarCantidad(
                                  item.idProductos,
                                  item.Talla || "M",
                                  item.Color || "Único",
                                  Math.max(1, item.cantidad - 1)
                                )
                              }
                            >
                              -
                            </button>
                            <span className="fw-bold px-2">{item.cantidad}</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary py-0 px-2 rounded-circle"
                              onClick={() =>
                                actualizarCantidad(
                                  item.idProductos,
                                  item.Talla || "M",
                                  item.Color || "Único",
                                  item.cantidad + 1
                                )
                              }
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="small text-muted">
                          ${Number(item.Precio).toLocaleString("es-CO")}
                        </td>
                        <td className="text-end fw-bold text-dark">
                          ${(Number(item.Precio) * item.cantidad).toLocaleString("es-CO")}
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-link text-danger p-0 border-0"
                            onClick={() =>
                              eliminarDelCarrito(
                                item.idProductos,
                                item.Talla || "M",
                                item.Color || "Único"
                              )
                            }
                            title="Eliminar artículo"
                          >
                            <i className="bi bi-x-circle-fill"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Formulario de Cupón de Descuento */}
              <div
                className="p-3 rounded-4 mt-3"
                style={{ background: "rgba(32, 178, 170, 0.06)", border: "1px dashed #20B2AA" }}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small fw-bold text-dark">
                    🎟️ ¿Tienes un cupón de descuento?
                  </span>
                  <small className="text-muted">Prueba: <code>TECNOMATIC10</code> o <code>BIENVENIDO</code></small>
                </div>
                <form onSubmit={handleAplicarCupon} className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control form-control-sm text-uppercase fw-bold"
                    placeholder="Código de cupón"
                    value={codigoCupon}
                    onChange={(e) => setCodigoCupon(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="btn btn-sm text-white fw-bold px-3 text-nowrap"
                    style={{ backgroundColor: "#20B2AA" }}
                    disabled={validandoCupon}
                  >
                    {validandoCupon ? "Validando..." : "Aplicar"}
                  </button>
                </form>

                {cuponAplicado && (
                  <div className="mt-2 small text-success fw-bold d-flex align-items-center justify-content-between">
                    <span>✓ Cupón {cuponAplicado.codigo} activo (-${cuponAplicado.descuento.toLocaleString("es-CO")})</span>
                    <button
                      type="button"
                      className="btn btn-link text-danger btn-sm p-0"
                      onClick={() => setCuponAplicado(null)}
                    >
                      Remover
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: DATOS DE ENVÍO Y FACTURACIÓN */}
          <div className="col-lg-5">
            <div
              className="card border-0 shadow-sm p-4"
              style={{ borderRadius: "20px", borderLeft: "5px solid #20B2AA" }}
            >
              <h5
                className="fw-bold mb-4"
                style={{ color: "#0047AB", fontSize: "16px" }}
              >
                <i className="bi bi-truck me-2"></i> Datos de Envío y Facturación
              </h5>

              {!usuario ? (
                <div className="text-center py-4 bg-light rounded-4 px-3">
                  <i
                    className="bi bi-person-lock text-warning mb-2"
                    style={{ fontSize: "2rem" }}
                  ></i>
                  <h6 className="fw-bold text-dark">Inicio de Sesión Requerido</h6>
                  <p className="text-muted small mb-3">
                    Debes estar registrado o iniciar sesión para completar tu orden en Supabase.
                  </p>
                  <button
                    className="btn btn-primary btn-sm w-100 rounded-pill"
                    style={{ backgroundColor: "#0047AB", border: "none" }}
                    onClick={() => setPagina("login")}
                  >
                    Iniciar Sesión Ahora
                  </button>
                </div>
              ) : (
                <form onSubmit={procesarCompra}>
                  {/* Nombre */}
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-muted">Nombre Completo / Razón Social</label>
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
                    <label className="form-label fw-bold small text-muted">Correo Electrónico</label>
                    <input
                      type="email"
                      className="form-control"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-sm-6">
                      <label className="form-label fw-bold small text-muted">Cédula / NIT</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej. 10203040"
                        value={cedula}
                        onChange={(e) => setCedula(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label fw-bold small text-muted">Teléfono / WhatsApp</label>
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

                  {/* Dirección y Ciudad */}
                  <div className="row g-2 mb-4">
                    <div className="col-sm-7">
                      <label className="form-label fw-bold small text-muted">Dirección de Entrega</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Calle / Carrera / Obra"
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-sm-5">
                      <label className="form-label fw-bold small text-muted">Ciudad</label>
                      <input
                        type="text"
                        className="form-control"
                        value={ciudad}
                        onChange={(e) => setCiudad(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Selector de Método de Pago */}
                  <div className="mb-4">
                    <label className="form-label fw-bold small text-muted d-block mb-2">
                      Método de Pago Seguro
                    </label>
                    <div className="d-flex gap-2">
                      <label
                        className="flex-fill p-2.5 border rounded-3 text-center cursor-pointer position-relative d-flex flex-column align-items-center justify-content-center"
                        style={{
                          backgroundColor:
                            metodoPago === "mercadopago"
                              ? "rgba(32, 178, 170, 0.08)"
                              : "#fff",
                          borderColor:
                            metodoPago === "mercadopago" ? "#20B2AA" : "#e2e8f0",
                          cursor: "pointer",
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
                        <i className="bi bi-credit-card text-primary mb-1" style={{ fontSize: "1.3rem" }}></i>
                        <span className="fw-bold small text-dark">Mercado Pago</span>
                      </label>

                      <label
                        className="flex-fill p-2.5 border rounded-3 text-center cursor-pointer position-relative d-flex flex-column align-items-center justify-content-center"
                        style={{
                          backgroundColor:
                            metodoPago === "pse"
                              ? "rgba(32, 178, 170, 0.08)"
                              : "#fff",
                          borderColor:
                            metodoPago === "pse" ? "#20B2AA" : "#e2e8f0",
                          cursor: "pointer",
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
                        <i className="bi bi-bank text-info mb-1" style={{ fontSize: "1.3rem" }}></i>
                        <span className="fw-bold small text-dark">PSE Débito</span>
                      </label>
                    </div>
                  </div>

                  {/* PSE Fields */}
                  {metodoPago === "pse" && (
                    <Motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="p-3 rounded-3 bg-light mb-4 border"
                    >
                      <label className="form-label fw-bold small text-muted">Selecciona tu Banco</label>
                      <select
                        className="form-select form-select-sm"
                        value={selectedBanco}
                        onChange={(e) => setSelectedBanco(e.target.value)}
                        required={metodoPago === "pse"}
                      >
                        <option value="">Elegir banco...</option>
                        {bancos.map((b) => (
                          <option key={b.codigo} value={b.nombre}>
                            {b.nombre}
                          </option>
                        ))}
                      </select>
                    </Motion.div>
                  )}

                  {/* Resumen de costos */}
                  <div className="py-3 border-top border-bottom mb-4">
                    <div className="d-flex justify-content-between text-muted mb-1.5 small">
                      <span>Subtotal</span>
                      <span>${subtotal.toLocaleString("es-CO")}</span>
                    </div>
                    {descuento > 0 && (
                      <div className="d-flex justify-content-between text-success mb-1.5 small fw-bold">
                        <span>Descuento cupón</span>
                        <span>-${descuento.toLocaleString("es-CO")}</span>
                      </div>
                    )}
                    <div className="d-flex justify-content-between text-muted mb-2 small">
                      <span>Envío asegurado nacional</span>
                      <span className="text-success fw-bold">Gratis</span>
                    </div>
                    <div className="d-flex justify-content-between fw-bold text-dark pt-1.5 fs-5">
                      <span>Total</span>
                      <span style={{ color: "#0047AB" }}>
                        ${total.toLocaleString("es-CO")}
                      </span>
                    </div>
                  </div>

                  {/* Botón Pagar */}
                  <button
                    type="submit"
                    className="btn w-100 text-white fw-bold py-3 shadow d-flex align-items-center justify-content-center"
                    style={{
                      background: "linear-gradient(135deg, #0047AB 0%, #20B2AA 100%)",
                      border: "none",
                      borderRadius: "14px",
                      fontSize: "15px",
                    }}
                    disabled={loadingCheckout}
                  >
                    {loadingCheckout ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Guardando orden en Supabase...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-shield-check me-2" style={{ fontSize: "18px" }}></i>
                        Confirmar y Finalizar Pedido
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </Motion.div>
  );
}

export default Carrito;
