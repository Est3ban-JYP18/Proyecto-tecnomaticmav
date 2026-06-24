import { useState } from "react";

function Mensaje() {
  const [cargando, setCargando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setCargando(true);

    const data = {
      nombre: e.target.nombre.value,
      mensaje: e.target.mensaje.value,
    };

    try {
      await fetch(
        "https://69d2d062336103955f8e6700.mockapi.io/appclientes/Productos",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      alert("Mensaje enviado correctamente");
      e.target.reset();
    } catch (error) {
      alert("Error al enviar el mensaje");
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center mt-5">
      <div className="card shadow-lg p-4" style={{ maxWidth: "600px", width: "100%" }}>
        <h3 className="text-center mb-4 text-success">Enviar Mensaje</h3>

        <form onSubmit={enviar}>
          {/* Nombre */}
          <div className="mb-3">
            <label className="form-label fw-bold">Tu nombre</label>
            <input
              name="nombre"
              className="form-control"
              placeholder="Ej: Dylan Fierro"
              required
            />
          </div>

          {/* Mensaje */}
          <div className="mb-4">
            <label className="form-label fw-bold">Mensaje</label>
            <textarea
              name="mensaje"
              rows="4"
              className="form-control"
              placeholder="Escribe tu mensaje aquí..."
              required
            ></textarea>
          </div>

          {/* Botón */}
          <div className="d-grid">
            <button
              type="submit"
              className="btn btn-success btn-lg"
              disabled={cargando}
            >
              {cargando ? "Enviando..." : "Enviar mensaje"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Mensaje;