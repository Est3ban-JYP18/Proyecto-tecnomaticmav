import React, { useState } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

function Informacion() {
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      setEnviado(true);
      Swal.fire({
        icon: "success",
        title: "¡Mensaje Enviado!",
        text: "Hemos recibido tu consulta. Nos pondremos en contacto contigo lo antes posible.",
        confirmButtonColor: "#20B2AA",
        customClass: {
          popup: 'rounded-4'
        }
      });
      e.target.reset();
      setTimeout(() => setEnviado(false), 4000);
    }, 800);
  };

  return (
    <div id="informacion" style={{ overflowX: "hidden" }}>

      {/* BANNER SUPERIOR */}
      <section  
        style={{ 
          background: "linear-gradient(135deg, #0047AB 0%, #002256 100%)",
          padding: "50px 0",
          borderBottom: "4px solid #20B2AA"
        }}
        className="px-4"
      >
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span 
              className="text-white-50 fw-bold mb-1 d-block" 
              style={{ fontSize: "11px", letterSpacing: "2px" }}
            >
              ESTAMOS PARA ESCUCHARTE
            </span>
            <h1 className="fw-bold text-white mb-0" style={{ fontSize: "2.2rem" }}>Contáctanos</h1>
            <p className="text-white-50 mt-1 mb-0" style={{ fontSize: "14.5px" }}>
              ¿Tienes opiniones, dudas, quejas o sugerencias? Háznoslo saber a continuación.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FORMULARIO + MAPA */}
      <section className="py-5" style={{ backgroundColor: "#f4f6f9" }}>
        <div className="container">
          <div className="row g-4">

            {/* FORMULARIO */}
            <div className="col-md-6">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="card border-0 shadow-sm p-4 h-100"
                style={{ borderRadius: "20px" }}
              >
                <h5 className="fw-bold mb-4" style={{ color: "#0047AB" }}>
                  <i className="bi bi-chat-right-text me-2"></i> Envíanos tu mensaje
                </h5>

                {enviado && (
                  <div className="alert alert-success py-2 rounded-3 mb-3" role="alert" style={{ fontSize: "14px" }}>
                    <i className="bi bi-check-circle-fill me-1"></i> ¡Mensaje enviado con éxito!
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Nombre Completo</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tu nombre"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Correo Electrónico</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="tucorreo@email.com"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Tipo de mensaje</label>
                    <select className="form-select" required>
                      <option value="">Selecciona una opción</option>
                      <option value="opinion">Opinión / Retroalimentación</option>
                      <option value="queja">Queja / Petición</option>
                      <option value="sugerencia">Sugerencia</option>
                      <option value="otro">Otro Asunto</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Mensaje</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      placeholder="Escribe aquí tu mensaje detallado..."
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="btn w-100 text-white fw-bold py-2.5"
                    style={{ 
                      backgroundColor: "#20B2AA", 
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 4px 12px rgba(32, 178, 170, 0.2)",
                      transition: "all 0.3s ease"
                    }}
                    disabled={loading}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#1a908a";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#20B2AA";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-1.5"></i> Enviar mensaje
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </div>

            {/* MAPA */}
            <div className="col-md-6">
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="card border-0 shadow-sm h-100" 
                style={{ overflow: "hidden", borderRadius: "20px" }}
              >
                <div className="p-4 pb-2">
                  <h5 className="fw-bold mb-1" style={{ color: "#0047AB" }}>
                    <i className="bi bi-geo-alt-fill me-1"></i> ¿Dónde estamos?
                  </h5>
                  <p className="text-muted mb-2" style={{ fontSize: "13.5px" }}>
                    Cl 17 Sur # 29A-56, Antonio Nariño, Bogotá D.C., Colombia.
                  </p>
                </div>
                <div className="flex-grow-1" style={{ minHeight: "330px", position: "relative" }}>
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7954.000409330687!2d-74.10812192555541!3d4.593984268901719!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f9924408b55eb%3A0xf4704cae5aad4d4!2zQ2wgMTcgU3VyICMgMjlBLTU2LCBBbnRvbmlvIE5hcmnDsW8sIEJvZ290w6EsIEQuQy4sIEJvZ290w6EsIEJvZ290w6EsIEQuQy4!5e0!3m2!1ses!2sco!4v1776038527688!5m2!1ses!2sco"
                    width="100%"
                    height="100%"
                    style={{ border: 0, position: "absolute", inset: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Ubicación Tecnomatic MAV"
                  ></iframe>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}

export default Informacion;