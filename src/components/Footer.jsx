function Footer({ setPagina }) {

  const irInicio = () => {
    setPagina("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollA = (id) => {
    setPagina("home");
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <footer 
      style={{ 
        background: "linear-gradient(180deg, #091a3c 0%, #001533 100%)",
        borderTop: "3px solid #20B2AA",
        padding: "48px 0 24px"
      }} 
      className="text-white text-center"
    >
      <div className="container">
        
        {/* BRAND SECTION */}
        <div className="mb-4">
          <h5 className="fw-bold mb-2" style={{ letterSpacing: "1px" }}>
            Tecnomatic <span style={{ color: "#20B2AA" }}>MAV</span>
          </h5>
          <p className="mx-auto text-white-50" style={{ maxWidth: "480px", fontSize: "14px", lineHeight: "1.6" }}>
            Líderes en el suministro de uniformes y elementos de protección industrial. 
            Calidad, cumplimiento normativo y seguridad para tu equipo de trabajo.
          </p>
        </div>

        {/* SOCIAL LINKS */}
        <div className="mb-4 d-flex justify-content-center gap-3">
          <a 
            href="https://wa.me/573001234567" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ 
              color: "#fff", 
              fontSize: "1.3rem",
              background: "rgba(255,255,255,0.08)",
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
              border: "1px solid rgba(255,255,255,0.1)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#20B2AA";
              e.currentTarget.style.background = "rgba(255,255,255,0.15)";
              e.currentTarget.style.transform = "translateY(-3px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <i className="bi bi-whatsapp"></i>
          </a>
          <a 
            href="mailto:tucorreo@gmail.com" 
            style={{ 
              color: "#fff", 
              fontSize: "1.3rem",
              background: "rgba(255,255,255,0.08)",
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
              border: "1px solid rgba(255,255,255,0.1)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#20B2AA";
              e.currentTarget.style.background = "rgba(255,255,255,0.15)";
              e.currentTarget.style.transform = "translateY(-3px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <i className="bi bi-envelope-fill"></i>
          </a>
        </div>

        {/* NAVIGATION LINKS */}
        <div className="mb-4 d-flex justify-content-center gap-4 flex-wrap">
          <span 
            style={{ cursor: "pointer", fontSize: "0.9rem", transition: "color 0.2s" }} 
            onClick={irInicio}
            className="text-white-50 hover-teal"
            onMouseEnter={(e) => e.currentTarget.style.color = "#20B2AA"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
          >
            Inicio
          </span>
          <span 
            style={{ cursor: "pointer", fontSize: "0.9rem", transition: "color 0.2s" }} 
            onClick={() => scrollA("sobrenosotros")}
            className="text-white-50 hover-teal"
            onMouseEnter={(e) => e.currentTarget.style.color = "#20B2AA"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
          >
            Sobre Nosotros
          </span>
          <span 
            style={{ cursor: "pointer", fontSize: "0.9rem", transition: "color 0.2s" }} 
            onClick={() => scrollA("informacion")}
            className="text-white-50 hover-teal"
            onMouseEnter={(e) => e.currentTarget.style.color = "#20B2AA"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
          >
            Contacto
          </span>
        </div>

        <hr style={{ borderColor: "rgba(255,255,255,0.08)", margin: "24px 0" }} />

        {/* COPYRIGHT */}
        <p className="mb-0 text-white-50" style={{ fontSize: "0.8rem", opacity: 0.7 }}>
          © 2026 Tecnomatic MAV | Todos los derechos reservados
        </p>

      </div>
    </footer>
  );
}

export default Footer;