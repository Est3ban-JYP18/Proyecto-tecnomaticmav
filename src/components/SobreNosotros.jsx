import React from "react";
import { motion } from "framer-motion";

// 🖼️ Imágenes importadas
import imgQuienes from "../assets/imgQuienes.jpg";   
import imgMision from "../assets/mision.jpg";            
import imgVision from "../assets/vision.jpg";            

const slideLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.7, ease: "easeOut" } 
  }
};

const slideRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.7, ease: "easeOut" } 
  }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: "easeOut" } 
  }
};

function SobreNosotros() {
  return (
    <section id="sobrenosotros" className="py-5" style={{ backgroundColor: "#f8f9fa", overflowX: "hidden" }}>
      <div className="container py-4">

        {/* ───── QUIÉNES SOMOS ───── */}
        <div className="row align-items-center mb-5 g-5">
          {/* Texto izquierda */}
          <motion.div 
            className="col-md-6"
            variants={slideLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            <span 
              className="fw-bold mb-2 d-inline-block" 
              style={{ color: "#20B2AA", letterSpacing: "1.5px", fontSize: "12px" }}
            >
              CONÓCENOS
            </span>
            <h2 className="fw-bold mb-3" style={{ color: "#0047AB", fontSize: "2rem" }}>
              ¿Quiénes somos?
            </h2>
            <p className="text-muted" style={{ lineHeight: "1.7", fontSize: "15px" }}>
              Somos <strong>Tecnomatic MAV</strong>, una empresa colombiana con más de 5 años de experiencia
              en el suministro de dotaciones empresariales y elementos de protección industrial.
              Nacimos con el propósito de vestir y proteger a los trabajadores de Colombia,
              garantizando calidad, comodidad y cumplimiento normativo en cada pedido.
            </p>
            <p className="text-muted" style={{ lineHeight: "1.7", fontSize: "15px" }}>
              Trabajamos con empresas de todos los sectores — construcción, salud, logística,
              manufactura y más — ofreciendo soluciones personalizadas que se adaptan a las
              necesidades específicas de cada organización.
            </p>
          </motion.div>

          {/* Imagen derecha */}
          <motion.div 
            className="col-md-6 text-center"
            variants={slideRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            <img
              src={imgQuienes}
              alt="Quiénes somos"
              className="img-fluid shadow-lg"
              style={{ 
                maxHeight: "360px", 
                width: "100%", 
                objectFit: "cover", 
                borderRadius: "20px",
                border: "4px solid #fff"
              }}
            />
          </motion.div>
        </div>

        <hr style={{ borderColor: "rgba(0, 0, 0, 0.08)", margin: "4rem 0" }} />

        {/* ───── MISIÓN ───── */}
        <div className="row align-items-center mb-5 g-5 flex-column-reverse flex-md-row">
          {/* Imagen izquierda */}
          <motion.div 
            className="col-md-6 text-center"
            variants={slideLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            <img
              src={imgMision}
              alt="Misión"
              className="img-fluid shadow-lg"
              style={{ 
                maxHeight: "320px", 
                width: "100%", 
                objectFit: "cover", 
                borderRadius: "20px",
                border: "4px solid #fff"
              }}
            />
          </motion.div>

          {/* Texto derecha */}
          <motion.div 
            className="col-md-6"
            variants={slideRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            <span 
              className="fw-bold mb-2 d-inline-block" 
              style={{ color: "#20B2AA", letterSpacing: "1.5px", fontSize: "12px" }}
            >
              NUESTRA MISIÓN
            </span>
            <h2 className="fw-bold mb-3" style={{ color: "#0047AB", fontSize: "2rem" }}>
              Misión
            </h2>
            <p className="text-muted" style={{ lineHeight: "1.7", fontSize: "15px" }}>
              Somos una empresa comercializadora de uniformes y elementos de protección industrial,
              caracterizándonos por altos estándares de calidad, satisfaciendo las necesidades
              y expectativas de nuestros clientes.
            </p>
            <div
              className="p-4 rounded-4"
              style={{ 
                backgroundColor: "rgba(0, 71, 171, 0.05)", 
                borderLeft: "4px solid #0047AB",
                boxShadow: "0 4px 12px rgba(0, 71, 171, 0.02)"
              }}
            >
              <p className="mb-0 fw-semibold" style={{ color: "#0047AB", fontStyle: "italic", fontSize: "0.95rem" }}>
                "Calidad, compromiso y protección en cada dotación que entregamos."
              </p>
            </div>
          </motion.div>
        </div>

        <hr style={{ borderColor: "rgba(0, 0, 0, 0.08)", margin: "4rem 0" }} />

        {/* ───── VISIÓN ───── */}
        <div className="row align-items-center g-5">
          {/* Texto izquierda */}
          <motion.div 
            className="col-md-6"
            variants={slideLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            <span 
              className="fw-bold mb-2 d-inline-block" 
              style={{ color: "#20B2AA", letterSpacing: "1.5px", fontSize: "12px" }}
            >
              NUESTRA VISIÓN
            </span>
            <h2 className="fw-bold mb-3" style={{ color: "#0047AB", fontSize: "2rem" }}>
              Visión
            </h2>
            <p className="text-muted" style={{ lineHeight: "1.7", fontSize: "15px" }}>
              Para el año 2025 consolidarnos en el mercado como una empresa comercializadora
              de uniformes y elementos de protección industrial, destacándonos por nuestros
              altos índices de calidad y cumplimiento.
            </p>
            <div
              className="p-4 rounded-4"
              style={{ 
                backgroundColor: "rgba(32, 178, 170, 0.06)", 
                borderLeft: "4px solid #20B2AA",
                boxShadow: "0 4px 12px rgba(32, 178, 170, 0.02)"
              }}
            >
              <p className="mb-0 fw-semibold" style={{ color: "#1a908a", fontStyle: "italic", fontSize: "0.95rem" }}>
                "Ser líderes en dotaciones industriales, reconocidos por excelencia y confianza."
              </p>
            </div>
          </motion.div>

          {/* Imagen derecha */}
          <motion.div 
            className="col-md-6 text-center"
            variants={slideRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            <img
              src={imgVision}
              alt="Visión"
              className="img-fluid shadow-lg"
              style={{ 
                maxHeight: "320px", 
                width: "100%", 
                objectFit: "cover", 
                borderRadius: "20px",
                border: "4px solid #fff"
              }}
            />
          </motion.div>
        </div>

      </div>
    </section>
  );
}

export default SobreNosotros;