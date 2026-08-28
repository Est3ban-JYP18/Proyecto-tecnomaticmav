import { useEffect, useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import botas from "../assets/shopping.webp";
import chaquetaindus from "../assets/chaquetaindus.jfif";
import casco from "../assets/casco2.webp";
import guantes from "../assets/guantes2.jpg";

const TALLAS = ["S", "M", "L", "XL"];
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};
const esOferta = (p) => Number(p.idProductos) % 3 === 0;
const precioOriginal = (p) => Math.round(Number(p.Precio || 0) * 1.25);

function SelectorTallas({ producto, tallaSeleccionada, onSeleccionar }) {
  return (
    <div className="d-flex align-items-center gap-1 flex-wrap">
      <span className="text-muted me-1" style={{ fontSize: "12px" }}>
        Talla:
      </span>
      {TALLAS.map((talla) => (
        <button
          type="button"
          key={talla}
          onClick={() => onSeleccionar(producto, talla)}
          className="btn btn-sm fw-bold"
          style={{
            minWidth: "32px",
            borderRadius: "18px",
            fontSize: "11px",
            border:
              tallaSeleccionada === talla
                ? "1px solid #0047AB"
                : "1px solid #cbd5e1",
            backgroundColor: tallaSeleccionada === talla ? "#0047AB" : "#fff",
            color: tallaSeleccionada === talla ? "#fff" : "#475569",
          }}
        >
          {talla}
        </button>
      ))}
    </div>
  );
}

function Precio({ producto, grande = false }) {
  return (
    <div>
      {esOferta(producto) && (
        <del
          className="text-muted me-2"
          style={{ fontSize: grande ? "15px" : "13px" }}
        >
          ${precioOriginal(producto).toLocaleString()}
        </del>
      )}
      <span
        className="fw-bold"
        style={{
          color: esOferta(producto) ? "#e11d48" : "#0047AB",
          fontSize: grande ? "24px" : "18px",
        }}
      >
        ${Number(producto.Precio || 0).toLocaleString()}
      </span>
    </div>
  );
}

function Productos({ agregarAlCarrito, setPagina, usuario }) {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todas");
  const [orden, setOrden] = useState("default");
  const [tallasSeleccionadas, setTallasSeleccionadas] = useState({});
  const [vistaRapida, setVistaRapida] = useState(null);
  const [favoritos, setFavoritos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("favoritosProductos")) || [];
    } catch {
      return [];
    }
  });
  const [soloFavoritos, setSoloFavoritos] = useState(false);
  const [filtrosAvanzados, setFiltrosAvanzados] = useState({ disponible: false, proteccion: "", material: "", marca: "", precioMin: "", precioMax: "" });
  const [comparacion, setComparacion] = useState([]);
  const [detalleCatalogo, setDetalleCatalogo] = useState({ imagenes: [], variantes: [], resenas: [], atributos: {} });
  const [varianteSeleccionada, setVarianteSeleccionada] = useState(null);

  useEffect(() => {
    localStorage.setItem("favoritosProductos", JSON.stringify(favoritos));
  }, [favoritos]);
  useEffect(() => {
    Promise.all([
      fetch("http://localhost:3001/productos").then((res) => {
        if (!res.ok) throw new Error("Error cargando productos");
        return res.json();
      }),
      fetch("http://localhost:3001/categorias").then((res) => {
        if (!res.ok) throw new Error("Error cargando categorías");
        return res.json();
      }),
    ])
      .then(([lista, listaCategorias]) => {
        setProductos(lista);
        setCategorias(listaCategorias);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const resolverImagen = (p) => {
    const nombre = (p.Nombre_Producto || "").toLowerCase();
    if (nombre.includes("chaqueta")) return chaquetaindus;
    if (nombre.includes("bota")) return botas;
    if (nombre.includes("guante")) return guantes;
    if (nombre.includes("casco")) return casco;
    return p.Imagen &&
      (p.Imagen.startsWith("http") || p.Imagen.startsWith("/src"))
      ? p.Imagen
      : chaquetaindus;
  };
  const tallaDe = (p) => tallasSeleccionadas[p.idProductos] || "M";
  const seleccionarTalla = (p, talla) =>
    setTallasSeleccionadas((prev) => ({ ...prev, [p.idProductos]: talla }));
  const alternarFavorito = (id) =>
    setFavoritos((prev) =>
      prev.includes(id) ? prev.filter((valor) => valor !== id) : [...prev, id],
    );
  const handleAgregar = (p, desdeModal = false, tallaForzada = null, color = "Único") => {
    const talla = tallaForzada || tallaDe(p);
    agregarAlCarrito(p, talla, color);
    if (p.Stock <= 0) return;
    if (desdeModal) setVistaRapida(null);
    Swal.fire({
      icon: "success",
      title: "¡Producto agregado!",
      text: `${p.Nombre_Producto} talla ${talla} se añadió al carrito de compras.`,
      showCancelButton: true,
      confirmButtonText: "Ir al Carrito",
      cancelButtonText: "Seguir Comprando",
      confirmButtonColor: "#20B2AA",
      cancelButtonColor: "#6c757d",
      customClass: { popup: "rounded-4" },
    }).then((result) => {
      if (result.isConfirmed) setPagina("carrito");
    });
  };
  const abrirVista = async (producto) => {
    setVistaRapida(producto);
    setDetalleCatalogo({ imagenes: [], variantes: [], resenas: [], atributos: {} });
    setVarianteSeleccionada(null);
    try {
      const [catalogo, relacionados, juntos] = await Promise.all([
        fetch(`http://localhost:3001/productos/${producto.idProductos}/catalogo`).then((respuesta) => respuesta.json()),
        fetch(`http://localhost:3001/productos/${producto.idProductos}/relacionados`).then((respuesta) => respuesta.json()),
        fetch(`http://localhost:3001/productos/${producto.idProductos}/comprados-juntos`).then((respuesta) => respuesta.json()),
      ]);
      setDetalleCatalogo({ ...catalogo, relacionados, juntos });
      setVarianteSeleccionada(catalogo.variantes?.find((variante) => variante.Stock > 0) || catalogo.variantes?.[0] || null);
    } catch (error) { console.error("No se pudo cargar el detalle de catálogo", error); }
  };
  const alternarComparacion = (producto) => setComparacion((prev) => prev.some((item) => item.idProductos === producto.idProductos) ? prev.filter((item) => item.idProductos !== producto.idProductos) : prev.length < 3 ? [...prev, producto] : (Swal.fire("Máximo 3 productos", "Quita uno de la comparación para añadir otro.", "info"), prev));
  const registrarAlerta = async (producto) => {
    const { value: correo } = await Swal.fire({ title: "Aviso de reposición", input: "email", inputValue: usuario?.Correo || "", inputLabel: "Correo electrónico", inputPlaceholder: "tu@correo.com", showCancelButton: true, confirmButtonText: "Avisarme" });
    if (!correo) return;
    const respuesta = await fetch(`http://localhost:3001/productos/${producto.idProductos}/alerta-reposicion`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ correo }) });
    const datos = await respuesta.json();
    Swal.fire(respuesta.ok ? "Listo" : "No se pudo registrar", datos.message || datos.error, respuesta.ok ? "success" : "error");
  };
  const productosOrdenados = productos
    .filter((p) => {
      const texto = busqueda.toLowerCase();
      return (
        ((p.Nombre_Producto || "").toLowerCase().includes(texto) ||
          (p.Descripcion || "").toLowerCase().includes(texto)) &&
        (categoriaSeleccionada === "Todas" ||
          p.Categoria === categoriaSeleccionada) &&
        (!soloFavoritos || favoritos.includes(p.idProductos)) &&
        (!filtrosAvanzados.disponible || Number(p.Stock) > 0) &&
        (!filtrosAvanzados.proteccion || p.Nivel_Proteccion === filtrosAvanzados.proteccion) &&
        (!filtrosAvanzados.material || p.Material === filtrosAvanzados.material) &&
        (!filtrosAvanzados.marca || p.Marca === filtrosAvanzados.marca) &&
        (!filtrosAvanzados.precioMin || Number(p.Precio) >= Number(filtrosAvanzados.precioMin)) &&
        (!filtrosAvanzados.precioMax || Number(p.Precio) <= Number(filtrosAvanzados.precioMax))
      );
    })
    .sort((a, b) =>
      orden === "precio-asc"
        ? Number(a.Precio) - Number(b.Precio)
        : orden === "precio-desc"
          ? Number(b.Precio) - Number(a.Precio)
          : 0,
    );

  return (
    <div className="container py-5">
      <Motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-5"
      >
        <span
          className="fw-bold mb-2 d-inline-block"
          style={{ color: "#20B2AA", letterSpacing: "1.5px", fontSize: "12px" }}
        >
          TIENDA TECNOMATIC MAV
        </span>
        <h2
          className="fw-bold mb-3"
          style={{ color: "#0047AB", fontSize: "2.2rem" }}
        >
          Catálogo de Productos
        </h2>
        <p
          className="text-muted mx-auto"
          style={{ maxWidth: "540px", fontSize: "14.5px" }}
        >
          Añade artículos al carrito y paga de forma segura en línea con Mercado
          Pago o PSE.
        </p>
      </Motion.div>
      <div className="row g-3 justify-content-between align-items-center mb-5 p-3 bg-white rounded-4 shadow-sm border mx-0">
        <div className="col-md-4">
          <div style={{ position: "relative" }}>
            <input
              className="form-control"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                borderRadius: "12px",
                paddingLeft: "38px",
                height: "45px",
              }}
            />
            <i
              className="bi bi-search text-muted"
              style={{ position: "absolute", left: "14px", top: "13px" }}
            />
          </div>
        </div>
        <div className="col-md-5 d-flex gap-2 flex-wrap justify-content-center justify-content-md-start">
          <button
            className="btn btn-sm fw-bold px-3 py-2"
            onClick={() => setCategoriaSeleccionada("Todas")}
            style={{
              borderRadius: "20px",
              backgroundColor:
                categoriaSeleccionada === "Todas" ? "#20B2AA" : "#f1f5f9",
              color: categoriaSeleccionada === "Todas" ? "#fff" : "#475569",
              border: "none",
              fontSize: "12px",
            }}
          >
            Todas
          </button>
          {categorias.map((c) => (
            <button
              key={c.idCategorias}
              className="btn btn-sm fw-bold px-3 py-2"
              onClick={() => setCategoriaSeleccionada(c.nombre)}
              style={{
                borderRadius: "20px",
                backgroundColor:
                  categoriaSeleccionada === c.nombre ? "#20B2AA" : "#f1f5f9",
                color: categoriaSeleccionada === c.nombre ? "#fff" : "#475569",
                border: "none",
                fontSize: "12px",
              }}
            >
              {c.nombre}
            </button>
          ))}
          <button
            className="btn btn-sm fw-bold px-3 py-2"
            onClick={() => setSoloFavoritos((valor) => !valor)}
            style={{
              borderRadius: "20px",
              backgroundColor: soloFavoritos ? "#e11d48" : "#fff1f2",
              color: soloFavoritos ? "#fff" : "#be123c",
              border: "1px solid #fecdd3",
              fontSize: "12px",
            }}
          >
            <i
              className={`bi ${soloFavoritos ? "bi-heart-fill" : "bi-heart"} me-1`}
            />
            Ver Favoritos
          </button>
        </div>
        <div className="col-md-3 text-end">
          <select
            className="form-select"
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            style={{ borderRadius: "12px", height: "45px", fontSize: "13px" }}
          >
            <option value="default">Relevancia / Nombre</option>
            <option value="precio-asc">Precio: Menor a Mayor</option>
            <option value="precio-desc">Precio: Mayor a Menor</option>
          </select>
        </div>
        <div className="col-12 border-top pt-3 d-flex gap-2 flex-wrap align-items-center">
          <button type="button" className={`btn btn-sm ${filtrosAvanzados.disponible ? "btn-success" : "btn-outline-success"}`} onClick={() => setFiltrosAvanzados((prev) => ({ ...prev, disponible: !prev.disponible }))}>Solo disponibles</button>
          {["proteccion", "material", "marca"].map((campo) => {
            const etiqueta = campo === "proteccion" ? "Protección" : campo[0].toUpperCase() + campo.slice(1);
            const clave = campo === "proteccion" ? "Nivel_Proteccion" : etiqueta;
            const opciones = [...new Set(productos.map((producto) => producto[clave]).filter(Boolean))];
            return <select key={campo} className="form-select form-select-sm" style={{ width: "150px" }} value={filtrosAvanzados[campo]} onChange={(e) => setFiltrosAvanzados((prev) => ({ ...prev, [campo]: e.target.value }))}><option value="">{etiqueta}</option>{opciones.map((opcion) => <option key={opcion} value={opcion}>{opcion}</option>)}</select>;
          })}
          <input className="form-control form-control-sm" style={{ width: "130px" }} type="number" min="0" placeholder="Precio mín." value={filtrosAvanzados.precioMin} onChange={(e) => setFiltrosAvanzados((prev) => ({ ...prev, precioMin: e.target.value }))} />
          <input className="form-control form-control-sm" style={{ width: "130px" }} type="number" min="0" placeholder="Precio máx." value={filtrosAvanzados.precioMax} onChange={(e) => setFiltrosAvanzados((prev) => ({ ...prev, precioMax: e.target.value }))} />
          {comparacion.length > 0 && <button type="button" className="btn btn-sm btn-outline-primary ms-auto" onClick={() => Swal.fire({ title: "Comparador de productos", width: "900px", html: `<div class="table-responsive"><table class="table text-start"><thead><tr><th>Atributo</th>${comparacion.map((producto) => `<th>${producto.Nombre_Producto}</th>`).join("")}</tr></thead><tbody>${[["Precio", "Precio"], ["Categoría", "Categoria"], ["Marca", "Marca"], ["Material", "Material"], ["Protección", "Nivel_Proteccion"], ["Stock", "Stock"]].map(([etiqueta, clave]) => `<tr><th>${etiqueta}</th>${comparacion.map((producto) => `<td>${clave === "Precio" ? "$" : ""}${producto[clave] ?? "—"}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`, confirmButtonText: "Cerrar" })}><i className="bi bi-columns-gap me-1" />Comparar ({comparacion.length})</button>}
        </div>
      </div>
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="text-muted mt-3">Conectando a base de datos...</p>
        </div>
      ) : productosOrdenados.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-cart-x" style={{ fontSize: "2.5rem" }} />
          <p className="mt-3">
            No hay productos disponibles con los filtros actuales.
          </p>
        </div>
      ) : (
        <Motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="row g-4"
        >
          {productosOrdenados.map((p) => (
            <div key={p.idProductos} className="col-md-6 col-lg-3">
              <Motion.div
                variants={cardVariants}
                whileHover={{
                  y: -6,
                  boxShadow: "0 16px 36px rgba(0, 71, 171, 0.12)",
                }}
                className="card h-100 border-0 shadow-sm"
                style={{ borderRadius: "22px", overflow: "hidden" }}
              >
                <div
                  style={{
                    height: "200px",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <img
                    src={resolverImagen(p)}
                    className="w-100 h-100"
                    style={{ objectFit: "cover" }}
                    alt={p.Nombre_Producto}
                  />
                  <button
                    type="button"
                    onClick={() => alternarFavorito(p.idProductos)}
                    aria-label="Favorito"
                    className="btn bg-white shadow-sm"
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      borderRadius: "50%",
                      width: "38px",
                      height: "38px",
                      color: "#e11d48",
                    }}
                  >
                    <i
                      className={`bi ${favoritos.includes(p.idProductos) ? "bi-heart-fill" : "bi-heart"}`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => abrirVista(p)}
                    className="btn text-white shadow"
                    style={{
                      position: "absolute",
                      bottom: "12px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      borderRadius: "22px",
                      backgroundColor: "rgba(0, 71, 171, .9)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <i className="bi bi-eye me-1" />
                    Vista rápida
                  </button>
                  <span
                    style={{
                      position: "absolute",
                      top: "12px",
                      left: "12px",
                      background: esOferta(p) ? "#e11d48" : "#20B2AA",
                      color: "#fff",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: "30px",
                    }}
                  >
                    {esOferta(p) ? "20% OFF" : p.Categoria || "General"}
                  </span>
                </div>
                <div
                  className="card-body d-flex flex-column p-4"
                  style={{ borderTop: "4px solid #20B2AA" }}
                >
                  <h5
                    className="fw-bold mb-2"
                    style={{ color: "#0047AB", fontSize: "16px" }}
                  >
                    {p.Nombre_Producto}
                  </h5>
                  <p
                    className="text-muted mb-3 flex-grow-1"
                    style={{ fontSize: "13px", lineHeight: 1.6 }}
                  >
                    {p.Descripcion}
                  </p>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted" style={{ fontSize: "13px" }}>
                      Disponibilidad
                    </span>
                    <span
                      className="fw-bold px-2 py-1 rounded-pill"
                      style={{
                        fontSize: "11px",
                        backgroundColor:
                          p.Stock > 10
                            ? "#ecfdf5"
                            : p.Stock > 0
                              ? "#fffbeb"
                              : "#fef2f2",
                        color:
                          p.Stock > 10
                            ? "#047857"
                            : p.Stock > 0
                              ? "#b45309"
                              : "#b91c1c",
                      }}
                    >
                      {p.Stock > 10
                        ? `Disponible (${p.Stock} uds)`
                        : p.Stock > 0
                          ? `¡Pocas unidades! (${p.Stock} uds)`
                          : "Agotado"}
                    </span>
                  </div>
                  <div className="mb-3">
                    <SelectorTallas
                      producto={p}
                      tallaSeleccionada={tallaDe(p)}
                      onSeleccionar={seleccionarTalla}
                    />
                  </div>
                  <div className="mb-3">
                    <span
                      className="text-muted d-block"
                      style={{ fontSize: "12px" }}
                    >
                      Precio unitario
                    </span>
                    <Precio producto={p} />
                  </div>
                  <button type="button" className={`btn btn-sm mb-2 ${comparacion.some((item) => item.idProductos === p.idProductos) ? "btn-primary" : "btn-outline-primary"}`} onClick={() => alternarComparacion(p)}><i className="bi bi-columns-gap me-1" />{comparacion.some((item) => item.idProductos === p.idProductos) ? "En comparación" : "Comparar"}</button>
                  <button
                    className="btn fw-bold w-100 text-white"
                    disabled={p.Stock <= 0}
                    style={{
                      background:
                        p.Stock <= 0
                          ? "#9ca3af"
                          : "linear-gradient(135deg, #0047AB 0%, #003380 100%)",
                      border: "none",
                      borderRadius: "12px",
                      padding: "10px 16px",
                      fontSize: "13.5px",
                    }}
                    onClick={() => handleAgregar(p)}
                  >
                    <i
                      className={
                        p.Stock <= 0
                          ? "bi bi-x-circle me-1"
                          : "bi bi-cart-plus me-1"
                      }
                    />
                    {p.Stock <= 0 ? "Agotado" : "Añadir al Carrito"}
                  </button>
                  {p.Stock <= 0 && <button type="button" className="btn btn-sm btn-outline-secondary mt-2" onClick={() => registrarAlerta(p)}><i className="bi bi-bell me-1" />Avisarme al reponer</button>}
                </div>
              </Motion.div>
            </div>
          ))}
        </Motion.div>
      )}
      <AnimatePresence>
        {vistaRapida && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
            style={{ zIndex: 1055, backgroundColor: "rgba(15, 23, 42, .65)" }}
            onClick={() => setVistaRapida(null)}
          >
            <Motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-4 shadow-lg overflow-auto"
              style={{ maxWidth: "850px", width: "100%", maxHeight: "90vh" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="row g-0">
                <div className="col-md-6">
                  <img
                    src={varianteSeleccionada?.Imagen || detalleCatalogo.imagenes?.[0]?.Url_Imagen || resolverImagen(vistaRapida)}
                    alt={vistaRapida.Nombre_Producto}
                    className="w-100 h-100"
                    style={{ objectFit: "cover", minHeight: "300px" }}
                  />
                  {detalleCatalogo.imagenes?.length > 1 && <div className="d-flex gap-2 p-2 overflow-auto">{detalleCatalogo.imagenes.map((imagen) => <img key={imagen.idProductoImagen} src={imagen.Url_Imagen} alt="Vista del producto" style={{ width: "54px", height: "54px", objectFit: "cover", cursor: "pointer", borderRadius: "8px" }} onClick={() => setVarianteSeleccionada((prev) => ({ ...(prev || {}), Imagen: imagen.Url_Imagen }))} />)}</div>}
                </div>
                <div className="col-md-6 p-4 position-relative">
                  <button
                    type="button"
                    className="btn-close position-absolute top-0 end-0 m-3"
                    onClick={() => setVistaRapida(null)}
                    aria-label="Cerrar"
                  />
                  <span
                    className="badge mb-2"
                    style={{
                      backgroundColor: esOferta(vistaRapida)
                        ? "#e11d48"
                        : "#20B2AA",
                    }}
                  >
                    {esOferta(vistaRapida) ? "20% OFF" : vistaRapida.Categoria}
                  </span>
                  <h3 className="fw-bold" style={{ color: "#0047AB" }}>
                    {vistaRapida.Nombre_Producto}
                  </h3>
                  <p className="text-muted">
                    {vistaRapida.Descripcion ||
                      "Producto de dotación industrial de alta calidad."}
                  </p>
                  <p className="mb-3">
                    <strong>Stock real:</strong> {vistaRapida.Stock || 0}{" "}
                    unidades
                  </p>
                  <div className="small text-muted mb-3">{detalleCatalogo.atributos?.Marca && <span className="me-2"><strong>Marca:</strong> {detalleCatalogo.atributos.Marca}</span>}{detalleCatalogo.atributos?.Material && <span className="me-2"><strong>Material:</strong> {detalleCatalogo.atributos.Material}</span>}{detalleCatalogo.atributos?.Nivel_Proteccion && <span><strong>Protección:</strong> {detalleCatalogo.atributos.Nivel_Proteccion}</span>}</div>
                  <button type="button" className="btn btn-sm btn-outline-primary mb-3" onClick={() => Swal.fire({ title: "Guía de tallas", html: "<p class='text-start'>Mide el contorno de pecho y cintura sobre una prenda ligera.</p><table class='table table-sm'><thead><tr><th>Talla</th><th>Pecho (cm)</th><th>Cintura (cm)</th></tr></thead><tbody><tr><td>S</td><td>86–92</td><td>74–80</td></tr><tr><td>M</td><td>93–100</td><td>81–88</td></tr><tr><td>L</td><td>101–108</td><td>89–96</td></tr><tr><td>XL</td><td>109–116</td><td>97–104</td></tr></tbody></table><p class='small text-muted'>Si tu medida está entre dos tallas, recomendamos elegir la superior para dotación industrial.</p>" })}><i className="bi bi-rulers me-1" />Guía y recomendación de talla</button>
                  <div className="mb-4">
                    {detalleCatalogo.variantes?.length ? <div><span className="text-muted small d-block mb-1">Color</span><div className="d-flex gap-1 flex-wrap mb-2">{[...new Set(detalleCatalogo.variantes.map((variante) => variante.Color))].map((color) => <button type="button" key={color} className={`btn btn-sm ${varianteSeleccionada?.Color === color ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setVarianteSeleccionada(detalleCatalogo.variantes.find((variante) => variante.Color === color && variante.Stock > 0) || detalleCatalogo.variantes.find((variante) => variante.Color === color))}>{color}</button>)}</div><span className="text-muted small d-block mb-1">Talla</span><div className="d-flex gap-1 flex-wrap">{detalleCatalogo.variantes.filter((variante) => variante.Color === varianteSeleccionada?.Color).map((variante) => <button type="button" key={variante.idProductoVariante} disabled={variante.Stock <= 0} className={`btn btn-sm ${varianteSeleccionada?.idProductoVariante === variante.idProductoVariante ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setVarianteSeleccionada(variante)}>{variante.Talla} ({variante.Stock})</button>)}</div></div> : <SelectorTallas producto={vistaRapida} tallaSeleccionada={tallaDe(vistaRapida)} onSeleccionar={seleccionarTalla} />}
                  </div>
                  <div className="mb-4">
                    <Precio producto={vistaRapida} grande />
                  </div>
                  <button
                    className="btn w-100 text-white fw-bold"
                    disabled={detalleCatalogo.variantes?.length ? !varianteSeleccionada || varianteSeleccionada.Stock <= 0 : vistaRapida.Stock <= 0}
                    onClick={() => handleAgregar({ ...vistaRapida, Stock: varianteSeleccionada?.Stock ?? vistaRapida.Stock, Imagen: varianteSeleccionada?.Imagen || vistaRapida.Imagen }, true, varianteSeleccionada?.Talla, varianteSeleccionada?.Color || "Único")}
                    style={{
                      backgroundColor: (detalleCatalogo.variantes?.length ? !varianteSeleccionada || varianteSeleccionada.Stock <= 0 : vistaRapida.Stock <= 0) ? "#9ca3af" : "#0047AB",
                      borderRadius: "12px",
                      padding: "11px",
                    }}
                  >
                    <i className="bi bi-cart-plus me-1" />
                    {(detalleCatalogo.variantes?.length ? !varianteSeleccionada || varianteSeleccionada.Stock <= 0 : vistaRapida.Stock <= 0) ? "Agotado" : "Comprar ahora"}
                  </button>
                  <div className="d-flex gap-2 mt-3"><a className="btn btn-sm btn-outline-success" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`${vistaRapida.Nombre_Producto} - $${vistaRapida.Precio} ${window.location.href}`)}`}><i className="bi bi-whatsapp me-1" />Compartir</a>{vistaRapida.Stock <= 0 && <button className="btn btn-sm btn-outline-secondary" onClick={() => registrarAlerta(vistaRapida)}><i className="bi bi-bell me-1" />Avisarme</button>}</div>
                  <div className="border-top mt-3 pt-3"><strong>Reseñas verificadas</strong>{detalleCatalogo.resenas?.slice(0, 3).map((resena) => <div key={resena.idResena} className="small mt-2"><span className="text-warning">{"★".repeat(resena.Calificacion)}{"☆".repeat(5 - resena.Calificacion)}</span> {resena.Verificada ? <span className="badge bg-success ms-1">Compra verificada</span> : null}<div>{resena.Comentario || "Sin comentario"}</div></div>)}{!detalleCatalogo.resenas?.length && <p className="small text-muted mb-0">Aún no hay reseñas.</p>}</div>
                  {(detalleCatalogo.relacionados?.length || detalleCatalogo.juntos?.length) && <div className="small mt-3"><strong>También te puede interesar:</strong> {[...(detalleCatalogo.juntos || []), ...(detalleCatalogo.relacionados || [])].slice(0, 4).map((producto) => <button type="button" className="btn btn-link btn-sm p-1" key={producto.idProductos} onClick={() => abrirVista(producto)}>{producto.Nombre_Producto}</button>)}</div>}
                </div>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Productos;
