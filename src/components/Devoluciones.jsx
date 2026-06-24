import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";

const URL = "http://localhost:3001/devoluciones";

function Devoluciones() {
  const [devoluciones, setDevoluciones] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [loading, setLoading] = useState(true);

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

  // Procesar devolución (Aprobar o Rechazar)
  const resolverDevolucion = async (id, accion) => {
    const titulo = accion === "aprobar" ? "Aprobar Devolución" : "Rechazar Devolución";
    const texto = accion === "aprobar" 
      ? "¿Estás seguro de aprobar esta solicitud de devolución? Esto validará la mercancía devuelta." 
      : "¿Estás seguro de rechazar esta solicitud de devolución?";
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
        const res = await fetch(`${URL}/${id}/${accion}`, {
          method: "PUT"
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

          <div className="col-md-4 text-md-end">
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
                  <th>Motivo</th>
                  <th>Fecha Solicitud</th>
                  <th>Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {devolucionesFiltradas.map((d) => (
                  <tr key={d.idDevoluciones}>
                    <td className="fw-bold text-dark">#{d.Facturas_idFacturas}</td>
                    <td className="fw-semibold">{d.Nombres} {d.Apellidos}</td>
                    <td className="fw-semibold text-dark">{d.Nombre_Producto}</td>
                    <td className="text-center">{d.Cantidad}</td>
                    <td className="text-muted" style={{ fontSize: "13px", maxWidth: "200px" }}>{d.Motivo}</td>
                    <td>{d.Fecha ? new Date(d.Fecha).toLocaleDateString() : ""}</td>
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
                      {d.Estado === "Pendiente" ? (
                        <div className="d-flex gap-2 justify-content-center">
                          <button
                            className="btn btn-sm btn-success text-white fw-bold"
                            style={{ borderRadius: "8px", fontSize: "11.5px", padding: "6px 12px" }}
                            onClick={() => resolverDevolucion(d.idDevoluciones, "aprobar")}
                          >
                            Aprobar
                          </button>
                          <button
                            className="btn btn-sm btn-danger text-white fw-bold"
                            style={{ borderRadius: "8px", fontSize: "11.5px", padding: "6px 12px" }}
                            onClick={() => resolverDevolucion(d.idDevoluciones, "rechazar")}
                          >
                            Rechazar
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted small">Procesada</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default Devoluciones;
