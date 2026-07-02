import { useState } from "react";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

function Login({ onLogin }) {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contrasena: password }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Credenciales incorrectas");
      }

const data = await response.json();

const dbUser = data.usuario;

// Mapear Roles_idRoles de la base de datos a rol del frontend
let rol = "cliente";

if (dbUser.Roles_idRoles === 1) rol = "admin";
if (dbUser.Roles_idRoles === 2) rol = "contador";
if (dbUser.Roles_idRoles === 3) rol = "cliente";

const mappedUser = {
  ...dbUser,
  rol,
};

localStorage.setItem("token", data.token);
localStorage.setItem("usuario", JSON.stringify(mappedUser));

      Swal.fire({
        icon: "success",
        title: "¡Bienvenido de nuevo!",
        text: `Hola ${dbUser.Nombres || ""}, inicio de sesión exitoso.`,
        confirmButtonColor: "#20B2AA",
        background: "#ffffff",
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          popup: 'rounded-4'
        }
      });

      setTimeout(() => onLogin(mappedUser), 1500);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      Swal.fire({
        icon: "error",
        title: "Credenciales Incorrectas",
        text: error.message || "El correo o la contraseña son incorrectos.",
        confirmButtonColor: "#0047AB",
        background: "#ffffff",
        customClass: {
          popup: 'rounded-4'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const recuperarPassword = () => {
    Swal.fire({
      icon: "info",
      title: "Recuperar Contraseña",
      text: "La recuperación con código por correo está disponible en la app conectada al backend.",
      confirmButtonColor: "#0047AB",
      background: "#ffffff",
      customClass: {
        popup: 'rounded-4'
      }
    });
  };

  return (
    <div className="tm-auth-page">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="tm-auth-card shadow-lg"
      >
        <div className="text-center mb-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <i className="tm-auth-icon bi bi-shield-lock-fill"></i>
          </motion.div>
          <h4 className="fw-bold mt-2" style={{ color: "#0047AB" }}>Iniciar Sesión</h4>
          <p className="text-muted" style={{ fontSize: "14px" }}>Ingresa con tu cuenta conectada a MySQL</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email input */}
          <motion.div 
            initial={{ x: -15, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-3 position-relative"
          >
            <i className="tm-input-icon bi bi-envelope position-absolute"></i>
            <input
              type="email"
              className="form-control ps-5"
              placeholder="Correo electrónico"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </motion.div>

          {/* Password input */}
          <motion.div 
            initial={{ x: -15, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-2 position-relative"
          >
            <i className="tm-input-icon bi bi-lock position-absolute"></i>
            <input
              type={mostrarPassword ? "text" : "password"}
              className="form-control ps-5 pe-5"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="tm-password-toggle btn position-absolute border-0 p-0"
              onClick={() => setMostrarPassword((valor) => !valor)}
              title={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              <i className={`bi ${mostrarPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
            </button>
          </motion.div>

          {/* Forgot Password */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-end mb-4"
          >
            <button
              type="button"
              className="tm-link-btn btn btn-link btn-sm p-0 text-decoration-none"
              onClick={recuperarPassword}
            >
              <i className="bi bi-question-circle me-1"></i>
              ¿Olvidaste tu contraseña?
            </button>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              type="submit"
              disabled={loading}
              className="tm-primary-btn btn w-100 text-white shadow-sm"
              style={{ padding: "12px", fontSize: "15px" }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Verificando en MySQL...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Ingresar a mi cuenta
                </>
              )}
            </button>
          </motion.div>
        </form>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-4 pt-2 border-top"
          style={{ borderColor: "rgba(0,0,0,0.05) !important" }}
        >
          <small className="text-muted">© 2026 Tecnomatic MAV</small>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Login;
