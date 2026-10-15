import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Servicios from "../components/Servicios";
import SobreNosotros from "../components/SobreNosotros";
import fondoImg from "../assets/fondo.png";
import Informacion from "../components/Informacion";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" },
  }),
};

const cards = [
  {
    icon: "bi-shield-check",
    titulo: "Dotaciones Empresariales",
    texto: "Equipos de seguridad industrial con altos estándares de calidad y certificación.",
  },
  {
    icon: "bi-box-seam",
    titulo: "Diseños Personalizados",
    texto: "Soluciones adaptadas a las necesidades específicas de tu empresa.",
  },
  {
    icon: "bi-clipboard-check",
    titulo: "Cumplimiento Normativo",
    texto: "Todos nuestros productos cumplen las normativas de seguridad vigentes.",
  },
];

const stats = [
  { valor: "5+", label: "Años de experiencia" },
  { valor: "200+", label: "Clientes satisfechos" },
  { valor: "12+", label: "Productos disponibles" },
  { valor: "100%", label: "Calidad certificada" },
];

function Home({ setPagina }) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", overflowX: "hidden" }}>
      <section
        style={{
          position: "relative",
          backgroundImage: `url(${fondoImg})`,
          backgroundSize: "cover",
          backgroundPosition: `center ${30 + scrollY * 0.1}%`,
          minHeight: "520px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(0,71,171,0.75) 0%, rgba(0,0,0,0.55) 100%)",
          }}
        />

        <div className="container text-center" style={{ position: "relative", zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(32,178,170,0.25)",
                border: "1px solid rgba(32,178,170,0.6)",
                color: "#7fffd4",
                borderRadius: "30px",
                padding: "5px 18px",
                fontSize: "13px",
                fontWeight: "600",
                letterSpacing: "1px",
                marginBottom: "20px",
              }}
            >
              <i className="bi bi-shield-check"></i>
              DOTACIÓN INDUSTRIAL CERTIFICADA
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            style={{
              color: "#fff",
              fontWeight: "800",
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              lineHeight: 1.2,
              marginBottom: "16px",
            }}
          >
            Más de 5 años entregando
            <br />
            <span style={{ color: "#20B2AA" }}>dotaciones de confianza</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: "1.15rem",
              marginBottom: "32px",
              maxWidth: "540px",
              margin: "0 auto 32px",
            }}
          >
            Calidad certificada para empresas en todo el país. Equipos de protección industrial que cuidan a tu equipo.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}
          >
            <button
              onClick={() => setPagina("productos")}
              style={{
                background: "#20B2AA",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "14px 32px",
                fontWeight: "700",
                fontSize: "15px",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(32,178,170,0.4)",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 28px rgba(32,178,170,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(32,178,170,0.4)";
              }}
            >
              <i className="bi bi-grid me-2"></i>
              Ver Catálogo
            </button>
            <button
              onClick={() => {
                setPagina("home");
                setTimeout(() => document.getElementById("informacion")?.scrollIntoView({ behavior: "smooth" }), 100);
              }}
              style={{
                background: "rgba(255,255,255,0.12)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.4)",
                borderRadius: "12px",
                padding: "14px 32px",
                fontWeight: "600",
                fontSize: "15px",
                cursor: "pointer",
                backdropFilter: "blur(8px)",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.12)";
              }}
            >
              <i className="bi bi-envelope me-2"></i>
              Contáctanos
            </button>
          </motion.div>
        </div>

        <div style={{ position: "absolute", bottom: -1, left: 0, right: 0 }}>
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z" fill="#f4f6f9" />
          </svg>
        </div>
      </section>

      <section style={{ background: "#f4f6f9", padding: "48px 0 32px" }}>
        <div className="container">
          <div className="row g-3 justify-content-center">
            {stats.map((stat, i) => (
              <div className="col-6 col-md-3" key={stat.label}>
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                  style={{
                    background: "#fff",
                    borderRadius: "16px",
                    padding: "24px 16px",
                    textAlign: "center",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
                    borderTop: "3px solid #20B2AA",
                  }}
                >
                  <div style={{ fontSize: "2rem", fontWeight: "800", color: "#0047AB" }}>{stat.valor}</div>
                  <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>{stat.label}</div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: "#f4f6f9", padding: "48px 0" }}>
        <div className="container">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-5"
          >
            <span style={{ color: "#20B2AA", fontWeight: "700", fontSize: "13px", letterSpacing: "2px" }}>
              ¿POR QUÉ ELEGIRNOS?
            </span>
            <h2 style={{ color: "#0047AB", fontWeight: "800", marginTop: "8px", fontSize: "2rem" }}>
              Soluciones integrales de dotación
            </h2>
          </motion.div>

          <div className="row g-4">
            {cards.map((card, i) => (
              <div className="col-md-4" key={card.titulo}>
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                  style={{
                    background: "#fff",
                    borderRadius: "20px",
                    padding: "36px 28px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
                    height: "100%",
                    transition: "transform 0.3s, box-shadow 0.3s",
                    cursor: "default",
                  }}
                  whileHover={{ y: -6, boxShadow: "0 12px 32px rgba(0,71,171,0.12)" }}
                >
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      background: "linear-gradient(135deg, #e8f4f8, #d0eaf0)",
                      borderRadius: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "20px",
                    }}
                  >
                    <i className={`bi ${card.icon}`} style={{ fontSize: "1.8rem", color: "#20B2AA" }}></i>
                  </div>
                  <h5 style={{ color: "#0047AB", fontWeight: "700", marginBottom: "12px" }}>{card.titulo}</h5>
                  <p style={{ color: "#666", fontSize: "14px", lineHeight: "1.7", margin: 0 }}>{card.texto}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          background: "linear-gradient(135deg, #0047AB 0%, #20B2AA 100%)",
          padding: "60px 0",
          textAlign: "center",
        }}
      >
        <div className="container">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <h2 style={{ color: "#fff", fontWeight: "800", fontSize: "2rem", marginBottom: "12px" }}>
              ¿Listo para equipar a tu equipo?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.85)", marginBottom: "28px", fontSize: "16px" }}>
              Explora nuestro catálogo completo de dotación industrial certificada
            </p>
            <button
              onClick={() => setPagina("productos")}
              style={{
                background: "#fff",
                color: "#0047AB",
                border: "none",
                borderRadius: "12px",
                padding: "14px 36px",
                fontWeight: "700",
                fontSize: "15px",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)";
              }}
            >
              <i className="bi bi-arrow-right-circle me-2"></i>
              Ver todos los productos
            </button>
          </motion.div>
        </div>
      </section>

      <SobreNosotros />
      <Servicios />
      <Informacion />
    </div>
  );
}

export default Home;
