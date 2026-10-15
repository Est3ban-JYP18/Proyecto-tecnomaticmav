import { useState } from "react";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { authService } from "../services/authService";

function Registrarse({ onRegister, setPagina }) {
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validaciones en tiempo real para bordes rojos y alertas visuales
  const tieneNumerosNombre = /\d/.test(nombres);
  const tieneNumerosApellido = /\d/.test(apellidos);
  const parteUsuarioCorreo = correo.includes("@") ? correo.split("@")[0] : "";
  const esSoloNumerosCorreo = correo.includes("@") && parteUsuarioCorreo.length > 0 && !/[a-zA-Z]/.test(parteUsuarioCorreo);
  const passwordsNoCoinciden = confirmPassword.length > 0 && confirmPassword !== password;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nombreLimpio = nombres.trim();
    const apellidoLimpio = apellidos.trim();
    const correoLimpio = correo.trim().toLowerCase();

    if (!nombreLimpio || !apellidoLimpio || !correoLimpio || !password) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Por favor completa todos los campos del formulario.",
        confirmButtonColor: "#0047AB",
        customClass: { popup: "rounded-4" },
      });
      return;
    }

    // Validación: Solo letras en Nombres
    const regexSoloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
    if (!regexSoloLetras.test(nombreLimpio)) {
      Swal.fire({
        icon: "warning",
        title: "Nombre no válido",
        text: "El nombre solo puede contener letras y espacios. No se permiten números ni símbolos.",
        confirmButtonColor: "#0047AB",
        customClass: { popup: "rounded-4" },
      });
      return;
    }

    // Validación: Solo letras en Apellidos
    if (!regexSoloLetras.test(apellidoLimpio)) {
      Swal.fire({
        icon: "warning",
        title: "Apellido no válido",
        text: "El apellido solo puede contener letras y espacios. No se permiten números ni símbolos.",
        confirmButtonColor: "#0047AB",
        customClass: { popup: "rounded-4" },
      });
      return;
    }

    // Validación: El correo debe incluir letras y no ser únicamente números (ej: 23@gmail.com)
    const parteUsuario = correoLimpio.split("@")[0] || "";
    if (!/[a-zA-Z]/.test(parteUsuario)) {
      Swal.fire({
        icon: "warning",
        title: "Correo no válido",
        text: "El correo electrónico debe incluir letras (no puede estar formado únicamente por números como '23@gmail.com').",
        confirmButtonColor: "#0047AB",
        customClass: { popup: "rounded-4" },
      });
      return;
    }

    if (password.length < 6) {
      Swal.fire({
        icon: "warning",
        title: "Contraseña muy corta",
        text: "La contraseña debe tener al menos 6 caracteres.",
        confirmButtonColor: "#0047AB",
        customClass: { popup: "rounded-4" },
      });
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "Las contraseñas no coinciden",
        text: "Verifica que ambas contraseñas escritas sean idénticas.",
        confirmButtonColor: "#0047AB",
        customClass: { popup: "rounded-4" },
      });
      return;
    }

    setLoading(true);

    try {
      const { usuario } = await authService.registro({
        nombres: nombreLimpio,
        apellidos: apellidoLimpio,
        correo: correoLimpio,
        contrasena: password,
      });

      Swal.fire({
        icon: "success",
        title: `¡Bienvenido(a), ${usuario.nombres || usuario.nombre}!`,
        text: "Tu cuenta ha sido creada e iniciaste sesión como Cliente.",
        confirmButtonColor: "#20B2AA",
        background: "#ffffff",
        timer: 1700,
        showConfirmButton: false,
        customClass: {
          popup: "rounded-4",
        },
      });

      setTimeout(() => onRegister(usuario), 1700);
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      Swal.fire({
        icon: "error",
        title: "Error de Registro",
        text: error.message || "No se pudo registrar la cuenta. Intenta de nuevo.",
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

  return (
    <div className="tm-auth-page py-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="tm-auth-card shadow-lg"
        style={{ maxWidth: "460px" }}
      >
        <div className="text-center mb-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.35 }}
          >
            <i className="tm-auth-icon bi bi-person-plus-fill"></i>
          </motion.div>
          <h4 className="fw-bold mt-2" style={{ color: "#0047AB" }}>Crear Cuenta</h4>
          <p className="text-muted" style={{ fontSize: "14px" }}>
            Únete a Tecnomatic MAV como cliente
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Nombres */}
          <motion.div
            initial={{ x: -15, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mb-3"
          >
            <div className="position-relative">
              <i
                className="tm-input-icon bi bi-person position-absolute"
                style={{ color: tieneNumerosNombre ? "#dc3545" : undefined }}
              ></i>
              <input
                type="text"
                className={`form-control ps-5 ${tieneNumerosNombre ? "is-invalid" : ""}`}
                style={
                  tieneNumerosNombre
                    ? {
                        borderColor: "#dc3545",
                        backgroundColor: "#fff5f5",
                        boxShadow: "0 0 0 3px rgba(220, 53, 69, 0.2)",
                      }
                    : {}
                }
                placeholder="Nombres"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                required
              />
            </div>
            {tieneNumerosNombre && (
              <div
                className="text-danger mt-1 ms-1 d-flex align-items-center gap-1"
                style={{ fontSize: "12px", fontWeight: "600" }}
              >
                <i className="bi bi-exclamation-circle-fill"></i>
                <span>No se permiten números en el nombre</span>
              </div>
            )}
          </motion.div>

          {/* Apellidos */}
          <motion.div
            initial={{ x: -15, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-3"
          >
            <div className="position-relative">
              <i
                className="tm-input-icon bi bi-person-badge position-absolute"
                style={{ color: tieneNumerosApellido ? "#dc3545" : undefined }}
              ></i>
              <input
                type="text"
                className={`form-control ps-5 ${tieneNumerosApellido ? "is-invalid" : ""}`}
                style={
                  tieneNumerosApellido
                    ? {
                        borderColor: "#dc3545",
                        backgroundColor: "#fff5f5",
                        boxShadow: "0 0 0 3px rgba(220, 53, 69, 0.2)",
                      }
                    : {}
                }
                placeholder="Apellidos"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                required
              />
            </div>
            {tieneNumerosApellido && (
              <div
                className="text-danger mt-1 ms-1 d-flex align-items-center gap-1"
                style={{ fontSize: "12px", fontWeight: "600" }}
              >
                <i className="bi bi-exclamation-circle-fill"></i>
                <span>No se permiten números en el apellido</span>
              </div>
            )}
          </motion.div>

          {/* Correo Electrónico */}
          <motion.div
            initial={{ x: -15, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mb-3"
          >
            <div className="position-relative">
              <i
                className="tm-input-icon bi bi-envelope position-absolute"
                style={{ color: esSoloNumerosCorreo ? "#dc3545" : undefined }}
              ></i>
              <input
                type="email"
                className={`form-control ps-5 ${esSoloNumerosCorreo ? "is-invalid" : ""}`}
                style={
                  esSoloNumerosCorreo
                    ? {
                        borderColor: "#dc3545",
                        backgroundColor: "#fff5f5",
                        boxShadow: "0 0 0 3px rgba(220, 53, 69, 0.2)",
                      }
                    : {}
                }
                placeholder="Correo electrónico"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
            </div>
            {esSoloNumerosCorreo && (
              <div
                className="text-danger mt-1 ms-1 d-flex align-items-center gap-1"
                style={{ fontSize: "12px", fontWeight: "600" }}
              >
                <i className="bi bi-exclamation-circle-fill"></i>
                <span>El correo no puede ser solo números (debe incluir letras)</span>
              </div>
            )}
          </motion.div>

          {/* Contraseña */}
          <motion.div
            initial={{ x: -15, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-3 position-relative"
          >
            <i className="tm-input-icon bi bi-lock position-absolute"></i>
            <input
              type={mostrarPassword ? "text" : "password"}
              className="form-control ps-5 pe-5"
              placeholder="Contraseña (mínimo 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="tm-password-toggle btn position-absolute border-0 p-0"
              onClick={() => setMostrarPassword((v) => !v)}
              title={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              <i className={`bi ${mostrarPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
            </button>
          </motion.div>

          {/* Confirmar Contraseña */}
          <motion.div
            initial={{ x: -15, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mb-4"
          >
            <div className="position-relative">
              <i
                className="tm-input-icon bi bi-shield-check position-absolute"
                style={{ color: passwordsNoCoinciden ? "#dc3545" : undefined }}
              ></i>
              <input
                type={mostrarPassword ? "text" : "password"}
                className={`form-control ps-5 ${passwordsNoCoinciden ? "is-invalid" : ""}`}
                style={
                  passwordsNoCoinciden
                    ? {
                        borderColor: "#dc3545",
                        backgroundColor: "#fff5f5",
                        boxShadow: "0 0 0 3px rgba(220, 53, 69, 0.2)",
                      }
                    : {}
                }
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {passwordsNoCoinciden && (
              <div
                className="text-danger mt-1 ms-1 d-flex align-items-center gap-1"
                style={{ fontSize: "12px", fontWeight: "600" }}
              >
                <i className="bi bi-exclamation-circle-fill"></i>
                <span>Las contraseñas no coinciden</span>
              </div>
            )}
          </motion.div>

          {/* Botón de Enviar */}
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <button
              type="submit"
              disabled={loading || tieneNumerosNombre || tieneNumerosApellido || esSoloNumerosCorreo || passwordsNoCoinciden}
              className="tm-primary-btn btn w-100 text-white shadow-sm"
              style={{ padding: "12px", fontSize: "15px" }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Registrando cuenta...
                </>
              ) : (
                <>
                  <i className="bi bi-person-check-fill me-2"></i>
                  Registrarme como Cliente
                </>
              )}
            </button>
          </motion.div>
        </form>

        {/* Enlace para volver a Iniciar Sesión */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="text-center mt-3"
        >
          <span className="text-muted" style={{ fontSize: "14px" }}>
            ¿Ya tienes una cuenta?{" "}
          </span>
          <button
            type="button"
            className="tm-link-btn btn btn-link p-0 text-decoration-none fw-bold"
            style={{ fontSize: "14px", color: "var(--tm-secondary)" }}
            onClick={() => setPagina && setPagina("login")}
          >
            Inicia sesión aquí
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-4 pt-2 border-top"
          style={{ borderColor: "rgba(0,0,0,0.05) !important" }}
        >
          <small className="text-muted">© 2026 Tecnomatic MAV</small>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Registrarse;
