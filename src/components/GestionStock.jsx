import { useEffect, useState } from "react";
import Swal from "sweetalert2";

const URL = "http://localhost:3001";

function GestionStock() {
  const [stock, setStock] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [vista, setVista] = useState("stock"); // "stock" | "movimientos"
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  const cargarStock = () => {
    setCargando(true);
    Promise.all([
      fetch(`${URL}/stock`).then((r) => r.json()),
      fetch(`${URL}/stock/alertas/bajos`).then((r) => r.json()),
    ])
      .then(([stockData, alertasData]) => {
        setStock(stockData);
        setAlertas(alertasData);
        setCargando(false);
      })
      .catch(() => setCargando(false));
  };

  const cargarMovimientos = (idProducto) => {
    fetch(`${URL}/stock/movimientos/${idProducto}`)
      .then((r) => r.json())
      .then((data) => setMovimientos(data));
  };

  useEffect(() => {
    cargarStock();
  }, []);

  const actualizarStock = async (producto) => {
    const { value: form } = await Swal.fire({
      title: `Ajustar stock`,
      html: `
        <p style="color:#555; margin-bottom:16px;">
          <strong>${producto.Nombre_Producto}</strong><br/>
          Stock actual: <strong style="color:#4F7A96">${producto.Cantidad_Actual} unidades</strong>
        </p>
        <div style="display:flex; flex-direction:column; gap:12px;">
          <select id="tipo" class="swal2-input" style="border-radius:10px; padding:10px;">
            <option value="Entrada"> Entrada — agregar mercancía</option>
            <option value="Salida"> Salida — retirar mercancía</option>
          </select>
          <input id="cantidad" type="number" min="1" class="swal2-input"
            placeholder="Cantidad" style="border-radius:10px; padding:10px;" />
          <input id="observacion" class="swal2-input"
            placeholder="Observación (opcional)" style="border-radius:10px; padding:10px;" />
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#4F7A96",
      preConfirm: () => {
        const tipo = document.getElementById("tipo").value;
        const cantidad = document.getElementById("cantidad").value;
        const observacion = document.getElementById("observacion").value;
        if (!cantidad || Number(cantidad) <= 0) {
          Swal.showValidationMessage(" La cantidad debe ser mayor a 0");
          return false;
        }
        return { tipo, cantidad: Number(cantidad), observacion };
      },
    });

    if (!form) return;

    const res = await fetch(`${URL}/stock/${producto.idProducto}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      Swal.fire({ icon: "error", title: "Error", text: data.error, confirmButtonColor: "#4F7A96" });
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Stock actualizado",
      html: `
        <p>Stock anterior: <strong>${data.stockAnterior}</strong></p>
        <p>Stock nuevo: <strong style="color:#4F7A96">${data.stockNuevo}</strong></p>
      `,
      timer: 2000,
      showConfirmButton: false,
    });

    cargarStock();
    if (productoSeleccionado?.idProducto === producto.idProducto) {
      cargarMovimientos(producto.idProducto);
    }
  };

  const verMovimientos = (producto) => {
    setProductoSeleccionado(producto);
    setVista("movimientos");
    cargarMovimientos(producto.idProducto);
  };

  const stockFiltrado = stock.filter((p) =>
    p.Nombre_Producto.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.Categoria.toLowerCase().includes(busqueda.toLowerCase())
  );

  const badgeAlerta = (alerta) => {
    if (alerta === "Agotado") return "bg-danger";
    if (alerta === "Stock bajo") return "bg-warning text-dark";
    return "bg-success";
  };

  const badgeEstado = (estado) => {
    if (estado === "Activo") return "bg-success";
    if (estado === "Agotado") return "bg-danger";
    return "bg-secondary";
  };

  return (
    <div style={{ padding: "30px", background: "#f4f6f9", minHeight: "100vh" }}>

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 style={{ color: "#2c3e50", margin: 0 }}>
            <i className="bi bi-box-seam me-2"></i>Gestión de Stock
          </h2>
          <small className="text-muted">Control de inventario en tiempo real</small>
        </div>

        {vista === "movimientos" && (
          <button
            className="btn btn-outline-secondary"
            onClick={() => { setVista("stock"); setProductoSeleccionado(null); }}
          >
            <i className="bi bi-arrow-left me-1"></i>Volver al stock
          </button>
        )}
      </div>

      {/* TARJETAS RESUMEN */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm text-center p-3">
            <i className="bi bi-boxes" style={{ fontSize: "2rem", color: "#4F7A96" }}></i>
            <h4 className="fw-bold mt-1">{stock.length}</h4>
            <small className="text-muted">Total productos</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm text-center p-3">
            <i className="bi bi-check-circle" style={{ fontSize: "2rem", color: "#28a745" }}></i>
            <h4 className="fw-bold mt-1">{stock.filter((p) => p.Cantidad_Actual > 10).length}</h4>
            <small className="text-muted">Con stock suficiente</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm text-center p-3">
            <i className="bi bi-exclamation-triangle" style={{ fontSize: "2rem", color: "#ffc107" }}></i>
            <h4 className="fw-bold mt-1">{alertas.filter((p) => p.Alerta === "Stock bajo").length}</h4>
            <small className="text-muted">Stock bajo</small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm text-center p-3">
            <i className="bi bi-x-circle" style={{ fontSize: "2rem", color: "#dc3545" }}></i>
            <h4 className="fw-bold mt-1">{alertas.filter((p) => p.Alerta === "Agotado").length}</h4>
            <small className="text-muted">Agotados</small>
          </div>
        </div>
      </div>

      {/* ALERTAS */}
      {alertas.length > 0 && vista === "stock" && (
        <div className="alert alert-warning d-flex align-items-center mb-4 shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2" style={{ fontSize: "1.2rem" }}></i>
          <div>
            <strong>{alertas.length} producto{alertas.length > 1 ? "s" : ""} necesitan atención:</strong>{" "}
            {alertas.map((p) => p.Nombre_Producto).join(", ")}
          </div>
        </div>
      )}

      {/* VISTA: STOCK GENERAL */}
      {vista === "stock" && (
        <div className="card border-0 shadow-sm">
          <div className="card-header d-flex justify-content-between align-items-center"
            style={{ background: "#4F7A96", color: "#fff" }}>
            <h5 className="mb-0">Inventario actual</h5>
            <div className="d-flex gap-2">
              <input
                className="form-control form-control-sm"
                placeholder="Buscar producto o categoría..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{ width: "220px" }}
              />
            </div>
          </div>

          <div className="card-body p-0">
            {cargando ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" />
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead style={{ background: "#f8f9fa" }}>
                    <tr>
                      <th className="ps-3">Producto</th>
                      <th>Categoría</th>
                      <th>Estado</th>
                      <th className="text-center">Stock actual</th>
                      <th className="text-center">Alerta</th>
                      <th>Última actualización</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockFiltrado.length === 0 ? (
                      <tr><td colSpan="7" className="text-center text-muted py-4">No hay productos</td></tr>
                    ) : (
                      stockFiltrado.map((p) => (
                        <tr key={p.idProducto}>
                          <td className="ps-3">
                            <strong>{p.Nombre_Producto}</strong>
                            <br /><small className="text-muted">{p.Tipo}</small>
                          </td>
                          <td>{p.Categoria}</td>
                          <td><span className={`badge ${badgeEstado(p.Estado)}`}>{p.Estado}</span></td>
                          <td className="text-center">
                            <span style={{
                              fontSize: "1.3rem",
                              fontWeight: "bold",
                              color: p.Cantidad_Actual === 0 ? "#dc3545" : p.Cantidad_Actual <= 10 ? "#ffc107" : "#4F7A96"
                            }}>
                              {p.Cantidad_Actual}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className={`badge ${badgeAlerta(p.Alerta)}`}>{p.Alerta}</span>
                          </td>
                          <td>
                            <small className="text-muted">
                              {new Date(p.Ultima_Actualizacion).toLocaleDateString("es-CO")}
                            </small>
                          </td>
                          <td className="text-center">
                            <button
                              className="btn btn-sm btn-primary me-1"
                              style={{ background: "#4F7A96", border: "none", borderRadius: "8px" }}
                              onClick={() => actualizarStock(p)}
                              title="Ajustar stock"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              style={{ borderRadius: "8px" }}
                              onClick={() => verMovimientos(p)}
                              title="Ver historial"
                            >
                              <i className="bi bi-clock-history"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VISTA: HISTORIAL DE MOVIMIENTOS */}
      {vista === "movimientos" && productoSeleccionado && (
        <div className="card border-0 shadow-sm">
          <div className="card-header" style={{ background: "#4F7A96", color: "#fff" }}>
            <h5 className="mb-0">
              <i className="bi bi-clock-history me-2"></i>
              Historial — {productoSeleccionado.Nombre_Producto}
              <span className="ms-3 badge bg-light text-dark">
                Stock actual: {productoSeleccionado.Cantidad_Actual}
              </span>
            </h5>
          </div>
          <div className="card-body">
            <div className="d-flex justify-content-end mb-3">
              <button
                className="btn btn-primary btn-sm"
                style={{ background: "#4F7A96", border: "none", borderRadius: "8px" }}
                onClick={() => actualizarStock(productoSeleccionado)}
              >
                <i className="bi bi-pencil-square me-1"></i>Ajustar stock
              </button>
            </div>

            {movimientos.length === 0 ? (
              <p className="text-muted text-center py-4">No hay movimientos registrados</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead style={{ background: "#f8f9fa" }}>
                    <tr>
                      <th>#</th>
                      <th>Tipo</th>
                      <th className="text-center">Cantidad</th>
                      <th>Fecha</th>
                      <th>Observación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((m) => (
                      <tr key={m.idMovimiento}>
                        <td><small className="text-muted">#{m.idMovimiento}</small></td>
                        <td>
                          <span className={`badge ${m.Tipo_Movimiento === "Entrada" ? "bg-success" : "bg-danger"}`}>
                            <i className={`bi ${m.Tipo_Movimiento === "Entrada" ? "bi-box-arrow-in-down" : "bi-box-arrow-up"} me-1`}></i>
                            {m.Tipo_Movimiento}
                          </span>
                        </td>
                        <td className="text-center">
                          <strong style={{ color: m.Tipo_Movimiento === "Entrada" ? "#28a745" : "#dc3545" }}>
                            {m.Tipo_Movimiento === "Entrada" ? "+" : "-"}{m.Cantidad}
                          </strong>
                        </td>
                        <td><small>{new Date(m.Fecha).toLocaleString("es-CO")}</small></td>
                        <td><small className="text-muted">{m.Observacion || "—"}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionStock;
