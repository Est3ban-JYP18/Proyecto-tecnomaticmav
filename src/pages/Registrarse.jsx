import { useState } from "react";
import Swal from "sweetalert2";

function Registrarse({ onRegister }) {
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // PASO 1: Registrar el usuario
      const resPost = await fetch("http://localhost:3001/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombres, apellidos, correo, contrasena: password }),
      });

      const data = await resPost.json();

      if (!resPost.ok) {
        throw new Error(data.error || data.message || "Error al registrar");
      }

      // PASO 2: Login automático para obtener los datos reales del usuario
      const resLogin = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contrasena: password }),
      });

      const usuario = await resLogin.json();

      if (!resLogin.ok) {
        throw new Error("Registrado, pero no se pudo iniciar sesión automáticamente");
      }

      Swal.fire({
        icon: "success",
        title: `Bienvenido, ${usuario.Nombres}`,
        text: "Cuenta creada e inicio de sesión exitoso",
        confirmButtonColor: "#4F7A96",
        timer: 1500,
        showConfirmButton: false,
      });

      // Enviar el usuario real (con Nombres, Correo, Roles_idRoles, etc.)
      setTimeout(() => onRegister(usuario), 1500);

    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
        confirmButtonColor: "#4F7A96",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #4F7A96, #2f4f6f)",
      }}
    >
      <div
        className="card shadow-lg p-4"
        style={{ width: "100%", maxWidth: "400px", borderRadius: "16px" }}
      >
        <div className="text-center mb-3">
          <i
            className="bi bi-person-plus"
            style={{ fontSize: "3rem", color: "#4F7A96" }}
          ></i>
          <h4 className="fw-bold mt-2">Registrarse</h4>
          <small className="text-muted">Crea una cuenta nueva</small>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3 position-relative">
            <i className="bi bi-person position-absolute" style={{ top: "10px", left: "12px", color: "#888" }}></i>
            <input
              type="text"
              className="form-control ps-5"
              placeholder="Nombres"
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              required
            />
          </div>

          <div className="mb-3 position-relative">
            <i className="bi bi-person-badge position-absolute" style={{ top: "10px", left: "12px", color: "#888" }}></i>
            <input
              type="text"
              className="form-control ps-5"
              placeholder="Apellidos"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              required
            />
          </div>

          <div className="mb-3 position-relative">
            <i className="bi bi-envelope position-absolute" style={{ top: "10px", left: "12px", color: "#888" }}></i>
            <input
              type="email"
              className="form-control ps-5"
              placeholder="Correo electrónico"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>

          <div className="mb-3 position-relative">
            <i className="bi bi-lock position-absolute" style={{ top: "10px", left: "12px", color: "#888" }}></i>
            <input
              type="password"
              className="form-control ps-5"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* ✅ type="submit" es lo que activa el onSubmit del form */}
          <button
            type="submit"
            disabled={loading}
            className="btn w-100 text-white"
            style={{
              background: loading ? "#7a9eb5" : "#4F7A96",
              borderRadius: "10px",
              fontWeight: "bold",
              transition: "0.3s",
            }}
            onMouseOver={(e) => !loading && (e.target.style.background = "#3c647c")}
            onMouseOut={(e) => !loading && (e.target.style.background = "#4F7A96")}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Registrando...
              </>
            ) : (
              <>
                <i className="bi bi-person-plus me-2"></i>
                Registrarse
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-3">
          <small className="text-muted">© 2026 Tecnomatic MAV</small>
        </div>
      </div>
    </div>
  );
}

export default Registrarse;
