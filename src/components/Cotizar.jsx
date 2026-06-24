import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";

function Cotizar({ productoSeleccionado }) {
  const [cargando, setCargando] = useState(false);

  // Productos disponibles
  const productosDisponibles = [
    "Chaqueta Industrial",
    "Botas de Seguridad",
    "Guantes Anticorte",
    "Casco Industrial",
  ];

  // Lista dinámica de productos
  const [productosSeleccionados, setProductosSeleccionados] = useState([
    { producto: "", cantidad: 1 },
  ]);

  // Inicializar con el producto seleccionado de la navegación
  useEffect(() => {
    if (productoSeleccionado) {
      setProductosSeleccionados([{ producto: productoSeleccionado, cantidad: 1 }]);
    }
  }, [productoSeleccionado]);

  // Agregar producto
  const agregarProducto = () => {
    setProductosSeleccionados([
      ...productosSeleccionados,
      { producto: "", cantidad: 1 },
    ]);
  };

  // Eliminar producto
  const eliminarProducto = (index) => {
    if (productosSeleccionados.length === 1) {
      Swal.fire({
        icon: "warning",
        title: "Operación no válida",
        text: "Debes incluir al menos un producto en tu cotización.",
        confirmButtonColor: "#0047AB"
      });
      return;
    }
    const nuevos = [...productosSeleccionados];
    nuevos.splice(index, 1);
    setProductosSeleccionados(nuevos);
  };

  // Cambios en inputs
  const handleChange = (index, campo, valor) => {
    const nuevos = [...productosSeleccionados];
    nuevos[index][campo] = campo === "cantidad" ? Math.max(1, Number(valor)) : valor;
    setProductosSeleccionados(nuevos);
  };

  // Enviar cotización
  const cotizar = async (e) => {
    e.preventDefault();

    if (productosSeleccionados.some(p => !p.producto)) {
      Swal.fire({
        icon: "error",
        title: "Campos incompletos",
        text: "Por favor selecciona un producto válido en todas las líneas de cotización.",
        confirmButtonColor: "#0047AB"
      });
      return;
    }

    setCargando(true);

    const data = {
      Cliente: e.target.cliente.value,
      Correo: e.target.correo.value,
      Telefono: e.target.telefono.value,
      Productos: productosSeleccionados,
      Estado: "Pendiente",
      Fecha: new Date().toLocaleDateString(),
    };

    try {
      const respuesta = await fetch(
        "https://69c55e5e8a5b6e2dec2c4b3c.mockapi.io/cotizaciones",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!respuesta.ok) throw new Error("Error en la petición");

      Swal.fire({
        icon: "success",
        title: "¡Cotización Enviada!",
        text: "Hemos recibido tu solicitud de cotización. Nos contactaremos pronto.",
        confirmButtonColor: "#20B2AA",
        customClass: {
          popup: 'rounded-4'
        }
      });

      e.target.reset();
      setProductosSeleccionados([{ producto: "", cantidad: 1 }]);

    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "Hubo un error al enviar la cotización. Inténtalo de nuevo.",
        confirmButtonColor: "#0047AB"
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container py-5 d-flex justify-content-center"
    >
      <div
        className="card border-0 shadow-lg p-4 p-md-5 tm-glass-card"
        style={{ maxWidth: "750px", width: "100%" }}
      >
        <div className="text-center mb-5">
          <i className="bi bi-file-earmark-spreadsheet-fill text-primary" style={{ fontSize: "2.8rem" }}></i>
          <h3 className="fw-bold mt-2" style={{ color: "#0047AB" }}>
            Solicitar Cotización
          </h3>
          <p className="text-muted" style={{ fontSize: "14px" }}>
            Completa tus datos y selecciona los productos que requieres cotizar.
          </p>
        </div>

        <form onSubmit={cotizar}>
          <div className="row g-3">
            {/* Nombre */}
            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold"><i className="bi bi-person me-1"></i> Nombre Completo</label>
              <input
                name="cliente"
                type="text"
                className="form-control"
                placeholder="Ej. Juan Pérez"
                required
              />
            </div>

            {/* Teléfono */}
            <div className="col-md-6 mb-3">
              <label className="form-label fw-bold"><i className="bi bi-telephone me-1"></i> Teléfono de Contacto</label>
              <input
                type="tel"
                name="telefono"
                className="form-control"
                placeholder="Ej. +57 300 123 4567"
                required
              />
            </div>
          </div>

          {/* Correo */}
          <div className="mb-4">
            <label className="form-label fw-bold"><i className="bi bi-envelope me-1"></i> Correo Electrónico</label>
            <input
              type="email"
              name="correo"
              className="form-control"
              placeholder="correo@empresa.com"
              required
            />
          </div>

          {/* Productos */}
          <div className="mb-4 p-3 rounded-4" style={{ backgroundColor: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.05)" }}>
            <label className="form-label fw-bold mb-3 d-flex justify-content-between align-items-center">
              <span><i className="bi bi-cart3 me-1"></i> Productos Seleccionados</span>
              <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: "12px" }}>
                {productosSeleccionados.length} {productosSeleccionados.length === 1 ? "línea" : "líneas"}
              </span>
            </label>

            <AnimatePresence initial={false}>
              {productosSeleccionados.map((item, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="d-flex gap-2 mb-2 align-items-center"
                  style={{ overflow: "hidden" }}
                >
                  {/* Select */}
                  <div className="flex-grow-1">
                    <select
                      className="form-select"
                      value={item.producto}
                      onChange={(e) =>
                        handleChange(index, "producto", e.target.value)
                      }
                      required
                    >
                      <option value="">Seleccionar producto</option>
                      {productosDisponibles.map((p, i) => (
                        <option key={i} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cantidad */}
                  <div style={{ width: "90px" }}>
                    <input
                      type="number"
                      min="1"
                      className="form-control text-center"
                      value={item.cantidad}
                      onChange={(e) =>
                        handleChange(index, "cantidad", e.target.value)
                      }
                      title="Cantidad"
                      placeholder="Cant."
                      required
                    />
                  </div>

                  {/* Eliminar */}
                  <button
                    type="button"
                    className="btn btn-outline-danger d-flex align-items-center justify-content-center"
                    style={{ borderRadius: "12px", width: "42px", height: "42px" }}
                    onClick={() => eliminarProducto(index)}
                    title="Eliminar línea"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Agregar línea */}
            <button
              type="button"
              className="btn btn-link text-decoration-none fw-bold mt-2 ps-1 hover-teal d-flex align-items-center gap-1.5"
              style={{ color: "#20B2AA", fontSize: "14px" }}
              onClick={agregarProducto}
            >
              <i className="bi bi-plus-circle-fill"></i> Agregar otro producto
            </button>
          </div>

          {/* Botón enviar */}
          <div className="d-grid mt-4">
            <button
              type="submit"
              className="btn text-white fw-bold py-3"
              style={{
                background: "linear-gradient(135deg, #0047AB 0%, #20B2AA 100%)",
                border: "none",
                borderRadius: "14px",
                fontSize: "15px",
                boxShadow: "0 4px 20px rgba(32, 178, 170, 0.3)",
                transition: "all 0.3s"
              }}
              disabled={cargando}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(32, 178, 170, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(32, 178, 170, 0.3)";
              }}
            >
              {cargando ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Enviando cotización...
                </>
              ) : (
                <>
                  <i className="bi bi-send-check me-2"></i>
                  Enviar solicitud de cotización
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

export default Cotizar;