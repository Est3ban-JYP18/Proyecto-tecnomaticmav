import { useState } from "react";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { authService } from "../services/authService";

function Login({ onLogin, setPagina }) {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { usuario } = await authService.login(correo, password);

      Swal.fire({
        icon: "success",
        title: "¡Bienvenido de nuevo!",
        text: `Hola ${usuario.nombre || usuario.nombres || ""}, inicio de sesión exitoso.`,
        confirmButtonColor: "#20B2AA",
        background: "#ffffff",
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          popup: "rounded-4",
        },
      });

      setTimeout(() => onLogin(usuario), 1200);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      Swal.fire({
        icon: "error",
        title: "Credenciales Incorrectas",
        text: error.message || "El correo o la contraseña son incorrectos.",
        confirmButtonColor: "#0047AB",
        background: "#ffffff",
        customClass: {
          popup: "rounded-4",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const recuperarPassword = async () => {
    const { value: email } = await Swal.fire({
      title: '<h5 class="fw-bold" style="color: #0047AB">Recuperar Contraseña</h5>',
      text: "Ingresa tu correo electrónico registrado:",
      input: "email",
      inputValue: correo,
      showCancelButton: true,
      confirmButtonText: "Enviar Código",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#20B2AA",
      cancelButtonColor: "#6c757d",
      customClass: { popup: "rounded-4" },
    });

    if (email) {
      try {
        const res = await authService.solicitarRecuperacion(email);
        const { value: formValues } = await Swal.fire({
          title: "Restablecer Contraseña",
          html: `
            <p class="text-muted small">${res.message}</p>
            <input id="swal-codigo" class="swal2-input" placeholder="Código de 6 dígitos" value="${res.devCode || ""}">
            <input id="swal-password" type="password" class="swal2-input" placeholder="Nueva contraseña">
          `,
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonText: "Actualizar Contraseña",
          confirmButtonColor: "#0047AB",
          preConfirm: () => {
            const codigo = document.getElementById("swal-codigo").value;
            const nueva = document.getElementById("swal-password").value;
            if (!codigo || !nueva) {
              Swal.showValidationMessage("Debes llenar el código y la nueva contraseña");
            }
            return { codigo, nueva };
          },
        });

        if (formValues) {
          await authService.restablecerPassword(email, formValues.codigo, formValues.nueva);
          Swal.fire({
            icon: "success",
            title: "¡Contraseña Actualizada!",
            text: "Ahora puedes iniciar sesión con tu nueva clave.",
            confirmButtonColor: "#20B2AA",
          });
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.message || "No se pudo restablecer la contraseña.",
          confirmButtonColor: "#0047AB",
        });
      }
    }
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
          <h4 className="fw-bold mt-2" style={{ color: "#0047AB" }}>
            Iniciar Sesión
          </h4>
          <p className="text-muted" style={{ fontSize: "14px" }}>
            Ingresa a tu cuenta con autenticación segura Supabase
          </p>
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
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  />
                  Verificando credenciales...
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

        {/* Enlace para registrarse */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="text-center mt-3"
        >
          <span className="text-muted" style={{ fontSize: "14px" }}>
            ¿Usuario nuevo?{" "}
          </span>
          <button
            type="button"
            className="tm-link-btn btn btn-link p-0 text-decoration-none fw-bold"
            style={{ fontSize: "14px", color: "var(--tm-secondary)" }}
            onClick={() => setPagina && setPagina("registro")}
          >
            Regístrate aquí
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-4 pt-2 border-top"
          style={{ borderColor: "rgba(0,0,0,0.05) !important" }}
        >
          <small className="text-muted">
            © 2026 Tecnomatic MAV • Potenciado por Supabase
          </small>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Login;
