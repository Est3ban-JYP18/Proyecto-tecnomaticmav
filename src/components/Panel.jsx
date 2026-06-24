import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";

function Panel({ usuario }) {
  const [productosBD, setProductosBD] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [cantidad, setCantidad] = useState(1);

  const [items, setItems] = useState([]);
  const [facturas, setFacturas] = useState([]);

  // Cargar productos de la base de datos
  useEffect(() => {
    fetch("http://localhost:3001/productos")
      .then((res) => res.json())
      .then((data) => setProductosBD(data))
      .catch((err) => console.error("Error cargando productos para facturación:", err));
  }, []);

  // Al seleccionar un producto, autocompletar el precio
  const handleSelectProducto = (e) => {
    const val = e.target.value;
    setNombre(val);
    const prod = productosBD.find((p) => p.Nombre_Producto === val);
    if (prod) {
      setProductoSeleccionado(prod);
      setPrecio(prod.Precio);
    } else {
      setProductoSeleccionado(null);
      setPrecio("");
    }
  };

  // AGREGAR PRODUCTO A LA FACTURA
  const agregarItem = () => {
    if (!nombre || !productoSeleccionado) {
      Swal.fire({
        icon: "warning",
        title: "Selecciona un producto",
        text: "Por favor elige un producto del listado.",
        confirmButtonColor: "#0047AB"
      });
      return;
    }
    if (!precio || Number(precio) <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Precio no válido",
        text: "Ingresa un valor numérico mayor a cero para el precio.",
        confirmButtonColor: "#0047AB"
      });
      return;
    }
    if (Number(cantidad) <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Cantidad no válida",
        text: "La cantidad debe ser mínimo 1.",
        confirmButtonColor: "#0047AB"
      });
      return;
    }

    const nuevo = {
      idProductos: productoSeleccionado.idProductos,
      nombre: productoSeleccionado.Nombre_Producto,
      precio: Number(precio),
      cantidad: Number(cantidad),
    };

    setItems([...items, nuevo]);

    // Reset fields
    setNombre("");
    setPrecio("");
    setCantidad(1);
    setProductoSeleccionado(null);
  };

  // ELIMINAR ITEM
  const eliminarItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // TOTAL ACTUAL
  const total = items.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0
  );

  // FINALIZAR FACTURA EN BASE DE DATOS
  const finalizarFactura = async () => {
    if (items.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Factura vacía",
        text: "Agrega productos a la factura antes de finalizarla.",
        confirmButtonColor: "#0047AB"
      });
      return;
    }

    // El contador que registra la factura
    const idUsuario = usuario?.idUsuarios || 1; // ID de respaldo en caso de sesión expuesta

    const dataPedido = {
      idUsuario,
      total,
      productos: items.map((item) => ({
        idProducto: item.idProductos,
        cantidad: item.cantidad,
        precioUnitario: item.precio
      }))
    };

    try {
      const res = await fetch("http://localhost:3001/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataPedido)
      });

      if (!res.ok) throw new Error("Error en base de datos al guardar la factura");
      const resData = await res.json();

      const nuevaFactura = {
        id: resData.idFactura || Date.now(),
        productos: items,
        total,
      };

      setFacturas([nuevaFactura, ...facturas]);
      setItems([]);

      Swal.fire({
        icon: "success",
        title: "Factura Registrada",
        text: `Factura #${nuevaFactura.id} guardada en MySQL y stock actualizado.`,
        confirmButtonColor: "#20B2AA",
        customClass: {
          popup: 'rounded-4'
        }
      });

    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error de registro",
        text: "No se pudo registrar la factura en la base de datos MySQL.",
        confirmButtonColor: "#0047AB"
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container py-5"
    >
      <div className="mb-4">
        <h3 className="fw-bold mb-1" style={{ color: "#0047AB" }}>📊 Panel de Facturación (POS)</h3>
        <p className="text-muted" style={{ fontSize: "14px" }}>Genera facturas oficiales y asienta las salidas directamente en la base de datos MySQL.</p>
      </div>

      <div className="row g-4">
        
        {/* PARTE IZQUIERDA: FORMULARIO Y TABLA DE PROCESO */}
        <div className="col-lg-8">
          
          {/* FORMULARIO AGREGAR */}
          <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: "20px" }}>
            <h5 className="fw-bold mb-3" style={{ color: "#0047AB", fontSize: "16px" }}>
              <i className="bi bi-cart-plus me-1.5"></i> Agregar Concepto
            </h5>
            
            <div className="row g-2 align-items-end">
              {/* Seleccionar Producto */}
              <div className="col-md-4">
                <label className="form-label fw-semibold">Producto en Base de Datos</label>
                <select
                  className="form-select"
                  value={nombre}
                  onChange={handleSelectProducto}
                >
                  <option value="">Seleccionar producto...</option>
                  {productosBD.map((p) => (
                    <option key={p.idProductos} value={p.Nombre_Producto}>
                      {p.Nombre_Producto}
                    </option>
                  ))}
                </select>
              </div>

              {/* Precio */}
              <div className="col-md-3">
                <label className="form-label fw-semibold">Precio Unitario ($)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Ej. 75000"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                />
              </div>

              {/* Cantidad */}
              <div className="col-md-2">
                <label className="form-label fw-semibold">Cantidad</label>
                <input
                  type="number"
                  className="form-control text-center"
                  placeholder="Cant."
                  value={cantidad}
                  min="1"
                  onChange={(e) => setCantidad(e.target.value)}
                />
              </div>

              {/* Botón */}
              <div className="col-md-3">
                <button 
                  className="btn text-white fw-semibold w-100 py-2.5" 
                  style={{
                    backgroundColor: "#20B2AA",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(32, 178, 170, 0.2)",
                    transition: "all 0.2s"
                  }}
                  onClick={agregarItem}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1a908a"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#20B2AA"}
                >
                  <i className="bi bi-plus-lg me-1"></i> Agregar
                </button>
              </div>
            </div>
          </div>

          {/* DETALLE DE FACTURA ACTUAL */}
          <div className="card border-0 shadow-sm p-4" style={{ borderRadius: "20px" }}>
            <h5 className="fw-bold mb-3" style={{ color: "#0047AB", fontSize: "16px" }}>
              <i className="bi bi-receipt me-1.5"></i> Factura en Proceso
            </h5>

            <div className="table-responsive mt-2">
              <table className="table align-middle">
                <thead style={{ backgroundColor: "#f8fafc" }}>
                  <tr>
                    <th className="border-0 px-3 py-2 text-secondary" style={{ fontSize: "12px" }}>PRODUCTO</th>
                    <th className="border-0 px-3 py-2 text-secondary" style={{ fontSize: "12px" }}>PRECIO</th>
                    <th className="border-0 px-3 py-2 text-secondary text-center" style={{ fontSize: "12px" }}>CANTIDAD</th>
                    <th className="border-0 px-3 py-2 text-secondary text-end" style={{ fontSize: "12px" }}>SUBTOTAL</th>
                    <th className="border-0 px-3 py-2" style={{ width: "50px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted" style={{ fontSize: "13.5px" }}>
                          No hay productos en la factura actual. Agrega conceptos arriba.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, i) => (
                        <motion.tr 
                          key={i}
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <td className="px-3 py-2.5 fw-semibold text-dark">{item.nombre}</td>
                          <td className="px-3 py-2.5">${item.precio.toLocaleString()}</td>
                          <td className="px-3 py-2.5 text-center">{item.cantidad}</td>
                          <td className="px-3 py-2.5 text-end fw-bold" style={{ color: "#0047AB" }}>
                            ${(item.precio * item.cantidad).toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <button
                              className="btn btn-sm btn-outline-danger border-0 rounded-circle"
                              onClick={() => eliminarItem(i)}
                              title="Remover"
                              style={{ width: "30px", height: "30px", padding: 0 }}
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* SECCIÓN TOTAL */}
            <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <h5 className="fw-bold mb-0 text-muted" style={{ fontSize: "15px" }}>Total a Facturar:</h5>
              <h4 className="fw-extrabold mb-0" style={{ color: "#0047AB" }}>${total.toLocaleString()}</h4>
            </div>

            <button
              className="btn text-white fw-bold py-3 mt-4"
              onClick={finalizarFactura}
              disabled={items.length === 0}
              style={{
                background: "linear-gradient(135deg, #0047AB 0%, #20B2AA 100%)",
                border: "none",
                borderRadius: "14px",
                fontSize: "15px",
                boxShadow: items.length > 0 ? "0 4px 18px rgba(32, 178, 170, 0.3)" : "none",
                transition: "all 0.3s"
              }}
              onMouseEnter={(e) => {
                if(items.length > 0) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 8px 22px rgba(32, 178, 170, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if(items.length > 0) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 18px rgba(32, 178, 170, 0.3)";
                }
              }}
            >
              <i className="bi bi-file-earmark-check me-1.5"></i> Finalizar y Registrar Factura
            </button>
          </div>
        </div>

        {/* PARTE DERECHA: HISTORIAL DE FACTURAS */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm p-4 h-100" style={{ borderRadius: "20px" }}>
            <h5 className="fw-bold mb-3" style={{ color: "#0047AB", fontSize: "16px" }}>
              <i className="bi bi-clock-history me-1.5"></i> Historial Reciente
            </h5>

            <div className="d-flex flex-column gap-3 mt-2" style={{ maxHeight: "490px", overflowY: "auto", paddingRight: "4px" }}>
              <AnimatePresence initial={false}>
                {facturas.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-receipt-cutoff" style={{ fontSize: "2rem" }}></i>
                    <p className="mt-2 mb-0" style={{ fontSize: "13px" }}>No se han generado facturas en esta sesión.</p>
                  </div>
                ) : (
                  facturas.map((factura) => (
                    <motion.div 
                      key={factura.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-3 rounded-4" 
                      style={{ 
                        backgroundColor: "#f8fafc",
                        border: "1px solid rgba(0,0,0,0.04)"
                      }}
                    >
                      <div className="d-flex justify-content-between mb-2 pb-1 border-bottom">
                        <span className="fw-bold text-secondary" style={{ fontSize: "12.5px" }}>
                          Factura #{factura.id}
                        </span>
                        <span className="small text-muted">
                          Facturado
                        </span>
                      </div>

                      <div className="d-flex flex-column gap-1 mb-2">
                        {factura.productos.map((p, i) => (
                          <div key={i} className="d-flex justify-content-between text-muted" style={{ fontSize: "13px" }}>
                            <span>{p.nombre} ({p.cantidad})</span>
                            <span>${(p.precio * p.cantidad).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <div className="d-flex justify-content-between pt-1 border-top fw-bold text-dark" style={{ fontSize: "13.5px" }}>
                        <span>TOTAL</span>
                        <span style={{ color: "#0047AB" }}>${factura.total.toLocaleString()}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

export default Panel;