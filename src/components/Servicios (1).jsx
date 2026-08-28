import { motion } from "framer-motion";

import camisa from "../assets/camisas.jpg";
import pantalon from "../assets/pantalon.jpg";
import chalecos from "../assets/chalecos.jpg";
import guantes from "../assets/guantes.jpg";
import casco from "../assets/casco.jpg";
import botas from "../assets/botas.jpg";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: "easeOut" } 
  }
};

const serviciosData = [
  { img: camisa, titulo: "Camisas" },
  { img: pantalon, titulo: "Pantalones" },
  { img: chalecos, titulo: "Chalecos" },
  { img: guantes, titulo: "Guantes" },
  { img: casco, titulo: "Cascos" },
  { img: botas, titulo: "Botas" }
];

function Servicios() {
  return (
    <section className="py-5" style={{ backgroundColor: "#ffffff" }}>
      <div className="container py-4">

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-5"
        >
          <span 
            className="fw-bold mb-2 d-inline-block" 
            style={{ color: "#20B2AA", letterSpacing: "1.5px", fontSize: "12px" }}
          >
            LÍNEA DE PRODUCCIÓN
          </span>
          <h2 className="fw-bold mb-3" style={{ color: "#0047AB", fontSize: "2rem" }}>
            Líneas de Dotación y Equipos
          </h2>
          <p className="text-muted mx-auto" style={{ maxWidth: "540px", fontSize: "14.5px" }}>
            Ofrecemos variedad de prendas de vestir y elementos certificados para cubrir todos los requerimientos de seguridad e imagen corporativa.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="row g-4"
        >
          {serviciosData.map((servicio, index) => (
            <div key={index} className="col-md-4">
              <motion.div
                variants={cardVariants}
                whileHover={{ 
                  y: -8, 
                  boxShadow: "0 16px 36px rgba(0, 71, 171, 0.12)",
                  borderColor: "rgba(32, 178, 170, 0.4)" 
                }}
                className="card h-100 border-0 shadow-sm"
                style={{ 
                  borderRadius: "20px",
                  overflow: "hidden",
                  cursor: "default",
                  border: "1px solid rgba(0, 0, 0, 0.04)",
                  transition: "box-shadow 0.3s, border-color 0.3s"
                }}
              >
                <div style={{ overflow: "hidden", position: "relative", height: "220px" }}>
                  <motion.img 
                    src={servicio.img}  
                    className="card-img-top w-100 h-100"
                    style={{ objectFit: "cover" }}
                    alt={servicio.titulo}
                    whileHover={{ scale: 1.06 }}
                    transition={{ duration: 0.4 }}
                  />
                  <div 
                    style={{ 
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.4) 100%)"
                    }} 
                  />
                </div>
                <div className="card-body text-center py-4" style={{ borderTop: "4px solid #20B2AA" }}>
                  <h5 className="card-title fw-bold mb-0" style={{ color: "#0047AB", fontSize: "17px" }}>
                    {servicio.titulo}
                  </h5>
                </div>
              </motion.div>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}

export default Servicios;