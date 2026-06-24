import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

// Importación de activos locales como respaldo visual
import botas from "../assets/shopping.webp";
import chaquetaindus from "../assets/chaquetaindus.jfif";
import casco from "../assets/casco2.webp";
import guantes from "../assets/guantes2.jpg";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

function Productos({ agregarAlCarrito, setPagina }) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar productos de la base de datos MySQL
  useEffect(() => {
    fetch("http://localhost:3001/productos")
      .then((res) => {
        if (!res.ok) throw new Error("Error cargando productos");
        return res.json();
      })
      .then((data) => {
        setProductos(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Función inteligente para mapear imágenes locales según nombre en BD
  const resolverImagen = (p) => {
    const nombre = (p.Nombre_Producto || "").toLowerCase();
    if (nombre.includes("chaqueta")) return chaquetaindus;
    if (nombre.includes("bota")) return botas;
    if (nombre.includes("guante")) return guantes;
    if (nombre.includes("casco")) return casco;
    
    // Si la BD trae una URL completa de imagen
    if (p.Imagen && (p.Imagen.startsWith("http") || p.Imagen.startsWith("/src"))) {
      return p.Imagen;
    }
    return chaquetaindus; // Por defecto
  };

  const handleAgregar = (p) => {
    // Añadimos al estado del carrito global
    agregarAlCarrito(p);

    Swal.fire({
      icon: "success",
      title: "¡Producto agregado!",
      text: `${p.Nombre_Producto} se añadió al carrito de compras.`,
      showCancelButton: true,
      confirmButtonText: "Ir al Carrito",
      cancelButtonText: "Seguir Comprando",
      confirmButtonColor: "#20B2AA",
      cancelButtonColor: "#6c757d",
      customClass: {
        popup: 'rounded-4'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        setPagina("carrito");
      }
    });
  };

  return (
    <div className="container py-5">
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-5"
      >
        <span 
          className="fw-bold mb-2 d-inline-block" 
          style={{ color: "#20B2AA", letterSpacing: "1.5px", fontSize: "12px" }}
        >
          TIENDA TECNOMATIC MAV
        </span>
        <h2 className="fw-bold mb-3" style={{ color: "#0047AB", fontSize: "2.2rem" }}>
          Catálogo de Productos
        </h2>
        <p className="text-muted mx-auto" style={{ maxWidth: "540px", fontSize: "14.5px" }}>
          Añade artículos al carrito y paga de forma segura en línea con Mercado Pago o PSE.
        </p>
      </motion.div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted mt-3">Conectando a base de datos...</p>
        </div>
      ) : productos.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-cart-x" style={{ fontSize: "2.5rem" }}></i>
          <p className="mt-3">No hay productos disponibles en este momento.</p>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="row g-4"
        >
          {productos.map((p) => (
            <div key={p.idProductos} className="col-md-6 col-lg-3">
              <motion.div 
                variants={cardVariants}
                whileHover={{ 
                  y: -6, 
                  boxShadow: "0 16px 36px rgba(0, 71, 171, 0.12)",
                  borderColor: "rgba(32, 178, 170, 0.4)" 
                }}
                className="card h-100 border-0 shadow-sm"
                style={{
                  borderRadius: "22px",
                  overflow: "hidden",
                  border: "1px solid rgba(0, 0, 0, 0.04)",
                  transition: "box-shadow 0.3s, border-color 0.3s"
                }}
              >
                <div style={{ height: "200px", overflow: "hidden", position: "relative" }}>
                  <img
                    src={resolverImagen(p)}
                    className="w-100 h-100"
                    style={{ objectFit: "cover" }}
                    alt={p.Nombre_Producto}
                  />
                  <span 
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      background: p.Tipo === "Especial" ? "#0047AB" : "#20B2AA",
                      color: "#fff",
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "4px 12px",
                      borderRadius: "30px",
                      letterSpacing: "0.5px"
                    }}
                  >
                    {p.Categoria || "General"}
                  </span>
                </div>
                
                <div className="card-body d-flex flex-column p-4" style={{ borderTop: "4px solid #20B2AA" }}>
                  <h5 className="fw-bold mb-2" style={{ color: "#0047AB", fontSize: "16px" }}>
                    {p.Nombre_Producto}
                  </h5>
                  <p className="text-muted mb-3 flex-grow-1" style={{ fontSize: "13px", lineHeight: "1.6" }}>
                    {p.Descripcion}
                  </p>
                  
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted" style={{ fontSize: "13px" }}>Precio unitario</span>
                    <span className="fw-bold" style={{ color: "#0047AB", fontSize: "18px" }}>
                      ${p.Precio?.toLocaleString()}
                    </span>
                  </div>

                  <button
                    className="btn fw-bold w-100 text-white"
                    style={{
                      background: "linear-gradient(135deg, #0047AB 0%, #003380 100%)",
                      border: "none",
                      borderRadius: "12px",
                      padding: "10px 16px",
                      fontSize: "13.5px",
                      transition: "all 0.3s ease",
                      boxShadow: "0 4px 12px rgba(0, 71, 171, 0.15)"
                    }}
                    onClick={() => handleAgregar(p)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 6px 18px rgba(0, 71, 171, 0.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 71, 171, 0.15)";
                    }}
                  >
                    <i className="bi bi-cart-plus me-1.5"></i>
                    Añadir al Carrito
                  </button>
                </div>
              </motion.div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export default Productos;