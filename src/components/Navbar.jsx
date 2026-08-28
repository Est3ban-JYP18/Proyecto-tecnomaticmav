import React, { useState } from "react";
import Logo from "../assets/Logo.png";

function Navbar({ setPagina, usuario, cantidadCarrito }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const ir = (pag) => {
    setPagina(pag);
    setMenuAbierto(false); // Cierra el menú en móviles al hacer click
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.reload();
  };

  return (
    <nav 
      className="navbar navbar-expand-lg navbar-dark sticky-top" 
      style={{ 
        background: "linear-gradient(90deg, rgba(0, 43, 115, 0.95) 0%, rgba(0, 71, 171, 0.95) 100%)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        padding: "14px 0",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.08)"
      }}
    >
      <div className="container">

        {/* LOGO */}
        <span
          className="navbar-brand d-flex align-items-center gap-2 fw-bold"
          style={{ cursor: "pointer", transition: "transform 0.2s" }}
          onClick={() => ir("home")}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          <img
            src={Logo}
            alt="Logo Tecnomatic MAV"
            style={{ 
              width: "36px", 
              height: "36px", 
              objectFit: "cover", 
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(32, 178, 170, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.2)"
            }}
          />
          <span style={{ letterSpacing: "0.5px" }}>
            Tecnomatic <span style={{ color: "#20B2AA" }}>MAV</span>
          </span>
        </span>

        {/* TOGGLER PARA MÓVILES */}
        <button
          className="navbar-toggler border-0"
          type="button"
          onClick={() => setMenuAbierto(!menuAbierto)}
          aria-expanded={menuAbierto}
          aria-label="Toggle navigation"
          style={{ focus: "none", outline: "none" }}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* LINKS */}
        <div className={`collapse navbar-collapse ${menuAbierto ? "show" : ""}`} id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-2 mt-3 mt-lg-0">

            {/* INICIO */}
            <li className="nav-item">
              <span
                className="nav-link text-white"
                style={{ 
                  cursor: "pointer", 
                  fontWeight: "500", 
                  fontSize: "14.5px",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  transition: "all 0.3s ease"
                }}
                onClick={() => ir("home")}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#20B2AA";
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#fff";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <i className="bi bi-house-door me-1"></i> Inicio
              </span>
            </li>

            {/* CONTACTO */}
            <li className="nav-item">
              <span
                className="nav-link text-white"
                style={{ 
                  cursor: "pointer", 
                  fontWeight: "500", 
                  fontSize: "14.5px",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  transition: "all 0.3s ease"
                }}
                onClick={() => {
                  setPagina("home"); 
                  setTimeout(() => {
                    document.getElementById("informacion")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                  setMenuAbierto(false);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#20B2AA";
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#fff";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <i className="bi bi-envelope me-1"></i> Contacto
              </span>
            </li>

            {/* CLIENTE / GUEST: CATÁLOGO */}
            {(!usuario || usuario?.rol === "cliente") && (
              <li className="nav-item">
                <span
                  className="nav-link text-white"
                  style={{ 
                    cursor: "pointer", 
                    fontWeight: "500", 
                    fontSize: "14.5px",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    transition: "all 0.3s ease"
                  }}
                  onClick={() => ir("productos")}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#20B2AA";
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <i className="bi bi-grid me-1"></i> Catálogo
                </span>
              </li>
            )}

            {/* CARRITO COMPRAS (Siempre visible para clientes/invitados) */}
            {(!usuario || usuario?.rol === "cliente") && (
              <li className="nav-item">
                <span
                  className="nav-link text-white d-flex align-items-center gap-1.5"
                  style={{ 
                    cursor: "pointer", 
                    fontWeight: "600", 
                    fontSize: "14.5px",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    transition: "all 0.3s ease",
                    color: cantidadCarrito > 0 ? "#20B2AA" : "#fff"
                  }}
                  onClick={() => ir("carrito")}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <i className="bi bi-cart3" style={{ fontSize: "16px" }}></i>
                  <span>Carrito</span>
                  {cantidadCarrito > 0 && (
                    <span 
                      className="badge rounded-circle bg-danger d-inline-flex justify-content-center align-items-center"
                      style={{ 
                        minWidth: "20px", 
                        height: "20px", 
                        fontSize: "10.5px", 
                        padding: "2px",
                        lineHeight: 1
                      }}
                    >
                      {cantidadCarrito}
                    </span>
                  )}
                </span>
              </li>
            )}

            {/* CLIENTE: MIS PEDIDOS (Visible solo si está logueado como cliente) */}
            {usuario?.rol === "cliente" && (
              <li className="nav-item">
                <span
                  className="nav-link text-white"
                  style={{ 
                    cursor: "pointer", 
                    fontWeight: "500", 
                    fontSize: "14.5px",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    transition: "all 0.3s ease"
                  }}
                  onClick={() => ir("misPedidos")}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#20B2AA";
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <i className="bi bi-box2-heart me-1"></i> Mis Pedidos
                </span>
              </li>
            )}

            {/* ADMIN: MENÚS */}
            {usuario?.rol === "admin" && (
              <>
                <li className="nav-item">
                  <span
                    className="nav-link text-white"
                    style={{ 
                      cursor: "pointer", 
                      fontWeight: "500", 
                      fontSize: "14.5px",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      transition: "all 0.3s ease"
                    }}
                    onClick={() => ir("tablaCotizaciones")}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#20B2AA";
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#fff";
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <i className="bi bi-file-earmark-text me-1"></i> Pedidos
                  </span>
                </li>

                <li className="nav-item">
                  <span
                    className="nav-link text-white"
                    style={{ 
                      cursor: "pointer", 
                      fontWeight: "500", 
                      fontSize: "14.5px",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      transition: "all 0.3s ease"
                    }}
                    onClick={() => ir("tablaProductos")}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#20B2AA";
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#fff";
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <i className="bi bi-box-seam me-1"></i> Productos
                  </span>
                </li>

                <li className="nav-item">
                  <span
                    className="nav-link text-white"
                    style={{ 
                      cursor: "pointer", 
                      fontWeight: "500", 
                      fontSize: "14.5px",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      transition: "all 0.3s ease"
                    }}
                    onClick={() => ir("tablaUsuarios")}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#20B2AA";
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#fff";
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <i className="bi bi-people me-1"></i> Usuarios
                  </span>
                </li>

                <li className="nav-item">
                  <span
                    className="nav-link text-white"
                    style={{ 
                      cursor: "pointer", 
                      fontWeight: "500", 
                      fontSize: "14.5px",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      transition: "all 0.3s ease"
                    }}
                    onClick={() => ir("devoluciones")}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#20B2AA";
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#fff";
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <i className="bi bi-arrow-left-right me-1"></i> Devoluciones
                  </span>
                </li>
              </>
            )}

            {/* CONTADOR: PANEL */}
            {usuario?.rol === "contador" && (
              <li className="nav-item">
                <span
                  className="nav-link text-white"
                  style={{ 
                    cursor: "pointer", 
                    fontWeight: "500", 
                    fontSize: "14.5px",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    transition: "all 0.3s ease"
                  }}
                  onClick={() => ir("panel")}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#20B2AA";
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <i className="bi bi-calculator me-1"></i> Facturación
                </span>
              </li>
            )}

            {/* SESIÓN ACCIONES */}
            {!usuario ? (
              <li className="nav-item ms-lg-2">
                <button
                  className="btn text-white fw-bold"
                  style={{
                    background: "#20B2AA",
                    border: "none",
                    borderRadius: "10px",
                    padding: "8px 20px",
                    fontSize: "14px",
                    boxShadow: "0 4px 12px rgba(32, 178, 170, 0.3)",
                    transition: "all 0.3s ease"
                  }}
                  onClick={() => ir("login")}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 6px 18px rgba(32, 178, 170, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(32, 178, 170, 0.3)";
                  }}
                >
                  <i className="bi bi-box-arrow-in-right me-1"></i> Ingresar
                </button>
              </li>
            ) : (
              <li className="nav-item ms-lg-2 d-flex align-items-center gap-3">
                <span className="text-white-50 d-none d-lg-inline" style={{ fontSize: "13.5px" }}>
                  <i className="bi bi-person-circle me-1"></i> {usuario.rol.toUpperCase()}
                </span>
                <button
                  className="btn text-white fw-semibold"
                  style={{
                    background: "rgba(220, 53, 69, 0.15)",
                    border: "1px solid rgba(220, 53, 69, 0.4)",
                    borderRadius: "10px",
                    padding: "7px 16px",
                    fontSize: "13.5px",
                    transition: "all 0.3s ease"
                  }}
                  onClick={logout}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(220, 53, 69, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(220, 53, 69, 0.15)";
                  }}
                >
                  <i className="bi bi-box-arrow-left me-1"></i> Salir
                </button>
              </li>
            )}

          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;