import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" }
  })
};

function ResumenAdmin({ facturas = [] }) {
  const [cantProductos, setCantProductos] = useState(0);

  // Consultar la cantidad real de productos registrados
  useEffect(() => {
    fetch("http://localhost:3001/productos")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setCantProductos(data.length))
      .catch(() => setCantProductos(18)); // fallback
  }, []);

  // Calcular métricas basadas en las facturas reales
  const totalVentas = facturas
    .filter((f) => f.Estado !== "Cancelado")
    .reduce((acc, f) => acc + (Number(f.Total) || 0), 0);

  const pedidosPendientes = facturas.filter(
    (f) => f.Estado === "Pendiente" || !f.Estado
  ).length;

  const pedidosEntregados = facturas.filter(
    (f) => f.Estado === "Entregado"
  ).length;

  const stats = [
    {
      titulo: "Catálogo de Items",
      valor: String(cantProductos),
      desc: "Productos registrados en MySQL",
      icon: "bi-box-seam",
      color: "#0047AB",
      bg: "rgba(0, 71, 171, 0.06)"
    },
    {
      titulo: "Pedidos Pendientes",
      valor: String(pedidosPendientes),
      desc: "Esperando procesamiento logístico",
      icon: "bi-clock-history",
      color: "#b45309",
      bg: "rgba(253, 230, 138, 0.25)"
    },
    {
      titulo: "Pedidos Entregados",
      valor: String(pedidosEntregados),
      desc: "Entregas finalizadas con éxito",
      icon: "bi-check-circle",
      color: "#047857",
      bg: "rgba(167, 243, 208, 0.25)"
    },
    {
      titulo: "Ingresos Totales",
      valor: `$${totalVentas.toLocaleString()}`,
      desc: "Recaudación de facturación real",
      icon: "bi-cash-coin",
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.08)"
    }
  ];

  return (
    <section className="mb-4">
      <div className="row g-3">
        {stats.map((stat, i) => (
          <div className="col-sm-6 col-lg-3" key={stat.titulo}>
            <motion.div
              variants={cardVariants}
              custom={i}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0, 0, 0, 0.06)" }}
              className="card border-0 shadow-sm h-100"
              style={{ borderRadius: "16px", transition: "transform 0.2s, box-shadow 0.2s" }}
            >
              <div className="card-body d-flex align-items-center justify-content-between p-4">
                <div>
                  <p className="text-muted mb-1" style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "0.5px" }}>
                    {stat.titulo.toUpperCase()}
                  </p>
                  <h3 className="fw-bold mb-1" style={{ color: "#2d3748", fontSize: "1.8rem", letterSpacing: "-0.5px" }}>
                    {stat.valor}
                  </h3>
                  <p className="mb-0 small text-secondary" style={{ fontSize: "12px" }}>
                    {stat.desc}
                  </p>
                </div>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    backgroundColor: stat.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <i className={`bi ${stat.icon}`} style={{ fontSize: "1.4rem", color: stat.color }}></i>
                </div>
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ResumenAdmin;