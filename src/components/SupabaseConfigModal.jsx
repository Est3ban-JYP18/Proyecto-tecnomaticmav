import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  isSupabaseConfigured,
  testSupabaseConnection,
  saveCustomSupabaseConfig,
  clearCustomSupabaseConfig,
} from "../lib/supabase";
import Swal from "sweetalert2";

export default function SupabaseConfigModal({ isOpen, onClose }) {
  const [url, setUrl] = useState(
    SUPABASE_URL.includes("tu-proyecto.supabase.co") ? "" : SUPABASE_URL
  );
  const [key, setKey] = useState(
    SUPABASE_ANON_KEY.includes("tu-anon-key") ? "" : SUPABASE_ANON_KEY
  );
  const [verificando, setVerificando] = useState(false);
  const [estadoConexion, setEstadoConexion] = useState(null);

  useEffect(() => {
    if (isOpen) {
      verificarConexionActual();
    }
  }, [isOpen]);

  const verificarConexionActual = async () => {
    setVerificando(true);
    const resultado = await testSupabaseConnection();
    setEstadoConexion(resultado);
    setVerificando(false);
  };

  const handleGuardar = (e) => {
    e.preventDefault();
    if (!url.trim() || !key.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campos requeridos",
        text: "Por favor ingresa tanto la URL de Supabase como la Anon Key pública.",
        confirmButtonColor: "#0047AB",
      });
      return;
    }

    if (!url.startsWith("https://")) {
      Swal.fire({
        icon: "error",
        title: "URL inválida",
        text: "La URL de Supabase debe comenzar con https:// (ej. https://xyz.supabase.co)",
        confirmButtonColor: "#0047AB",
      });
      return;
    }

    saveCustomSupabaseConfig(url, key);
  };

  const handleRestablecer = () => {
    Swal.fire({
      title: "¿Restablecer configuración?",
      text: "Se eliminarán las credenciales personalizadas guardadas.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, restablecer",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    }).then((res) => {
      if (res.isConfirmed) {
        clearCustomSupabaseConfig();
      }
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="modal show d-block"
        style={{
          backgroundColor: "rgba(10, 25, 47, 0.75)",
          backdropFilter: "blur(6px)",
          zIndex: 1060,
        }}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <motion.div
            className="modal-content border-0 shadow-lg rounded-4 overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            style={{
              background: "linear-gradient(145deg, #0d1b2a, #1b263b)",
              color: "#fff",
              border: "1px solid rgba(0, 229, 255, 0.2)",
            }}
          >
            {/* Header */}
            <div
              className="modal-header border-0 pb-0 pt-4 px-4 d-flex justify-content-between align-items-center"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{
                    width: 44,
                    height: 44,
                    background: "rgba(32, 178, 170, 0.15)",
                    border: "1px solid rgba(32, 178, 170, 0.4)",
                  }}
                >
                  <span style={{ fontSize: "1.4rem" }}>⚡</span>
                </div>
                <div>
                  <h5 className="modal-title fw-bold mb-0 text-white">
                    Conexión con Supabase PostgreSQL
                  </h5>
                  <small className="text-white-50">
                    Backend en la nube, autenticación y base de datos en tiempo real
                  </small>
                </div>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
              ></button>
            </div>

            {/* Body */}
            <div className="modal-body p-4">
              {/* Estado de conexión */}
              <div
                className="p-3 rounded-3 mb-4 d-flex align-items-center justify-content-between"
                style={{
                  background: estadoConexion?.connected
                    ? "rgba(16, 185, 129, 0.15)"
                    : "rgba(245, 158, 11, 0.15)",
                  border: `1px solid ${
                    estadoConexion?.connected
                      ? "rgba(16, 185, 129, 0.4)"
                      : "rgba(245, 158, 11, 0.4)"
                  }`,
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-circle"
                    style={{
                      width: 12,
                      height: 12,
                      backgroundColor: estadoConexion?.connected
                        ? "#10B981"
                        : "#F59E0B",
                      boxShadow: estadoConexion?.connected
                        ? "0 0 10px #10B981"
                        : "0 0 10px #F59E0B",
                    }}
                  />
                  <div>
                    <div className="fw-bold">
                      {verificando
                        ? "Verificando conexión con Supabase..."
                        : estadoConexion?.connected
                        ? "Conectado exitosamente a Supabase PostgreSQL"
                        : isSupabaseConfigured()
                        ? "Error de conexión con Supabase"
                        : "Modo Local / Demo Activo (Resiliente)"}
                    </div>
                    <small className="text-white-50">
                      {estadoConexion?.message ||
                        "La aplicación opera con base de datos local y está lista para vincularse a tu proyecto Supabase."}
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light rounded-pill px-3"
                  onClick={verificarConexionActual}
                  disabled={verificando}
                >
                  {verificando ? "Probando..." : "Reintentar"}
                </button>
              </div>

              {/* Formulario de credenciales */}
              <form onSubmit={handleGuardar}>
                <div className="mb-3">
                  <label className="form-label text-white-50 small fw-bold">
                    SUPABASE PROJECT URL (VITE_SUPABASE_URL)
                  </label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://tu-proyecto.supabase.co"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#fff",
                    }}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label text-white-50 small fw-bold">
                    SUPABASE ANON KEY (VITE_SUPABASE_ANON_KEY)
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#fff",
                    }}
                  />
                </div>

                {/* Guía rápida */}
                <div
                  className="p-3 rounded-3 mb-4"
                  style={{ background: "rgba(0,0,0,0.25)", fontSize: "0.85rem" }}
                >
                  <div className="fw-bold text-info mb-1">
                    📌 Pasos para conectar tu base de datos en 2 minutos:
                  </div>
                  <ol className="mb-0 ps-3 text-white-50">
                    <li>
                      Crea un proyecto gratis en <strong>supabase.com</strong>.
                    </li>
                    <li>
                      Ve al <strong>SQL Editor</strong> de Supabase y pega el script{" "}
                      <code>supabase/schema.sql</code> y <code>supabase/seed.sql</code>.
                    </li>
                    <li>
                      Copia la <strong>Project URL</strong> y <strong>Anon Key</strong>{" "}
                      de <em>Project Settings → API</em> y guárdalas aquí.
                    </li>
                  </ol>
                </div>

                <div className="d-flex justify-content-between align-items-center pt-2">
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm rounded-pill px-3"
                    onClick={handleRestablecer}
                  >
                    Restablecer Modo Demo
                  </button>

                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary rounded-pill px-4"
                      onClick={onClose}
                    >
                      Cerrar
                    </button>
                    <button
                      type="submit"
                      className="btn rounded-pill px-4 fw-bold"
                      style={{
                        background: "linear-gradient(135deg, #20B2AA, #0047AB)",
                        color: "#fff",
                        border: "none",
                      }}
                    >
                      Guardar y Conectar
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
