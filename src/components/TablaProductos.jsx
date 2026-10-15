import { useEffect, useState } from "react";
import { motion as Motion } from "framer-motion";
import Swal from "sweetalert2";
import { productService } from "../services/productService";
import { inventoryService } from "../services/inventoryService";

function TablaProductos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [precioMinimo, setPrecioMinimo] = useState("");
  const [precioMaximo, setPrecioMaximo] = useState("");
  const [loading, setLoading] = useState(true);

  // Cargar productos de Supabase
  const cargarProductos = async () => {
    setLoading(true);
    try {
      const data = await productService.obtenerProductos();
      setProductos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar categorías
  const cargarCategorias = async () => {
    try {
      const data = await productService.obtenerCategorias();
      setCategorias(data);
    } catch (err) {
      console.error("Error cargando categorías:", err);
    }
  };

  useEffect(() => {
    cargarProductos();
    cargarCategorias();
  }, []);

  // Agregar producto
  const agregarProducto = async () => {
    const opcionesCategorias = categorias
      .map((c) => `<option value="${c.id || c.idCategorias}">${c.nombre}</option>`)
      .join("");

    const { value: form } = await Swal.fire({
      title: '<h5 class="fw-bold mb-0" style="color: #0047AB">Agregar Producto a Supabase</h5>',
      html: `
        <div class="text-start px-2">
          <label class="form-label fw-bold mt-2">Nombre del Producto</label>
          <input id="nombre" class="form-control" placeholder="Ej. Guantes de Nitrilo">
          
          <label class="form-label fw-bold mt-3">Tipo</label>
          <input id="tipo" class="form-control" placeholder="Ej. Uniformes / Protección">
          
          <label class="form-label fw-bold mt-3">Descripción</label>
          <textarea id="descripcion" class="form-control" rows="2" placeholder="Detalles técnicos..."></textarea>
          
          <div class="row g-2 mt-2">
            <div class="col-6">
              <label class="form-label fw-bold">Precio ($ COP)</label>
              <input id="precio" type="number" class="form-control" placeholder="Ej. 45000">
            </div>
            <div class="col-6">
              <label class="form-label fw-bold">Stock Inicial</label>
              <input id="stock" type="number" class="form-control" placeholder="Ej. 10" min="0" value="10">
            </div>
          </div>
          
          <div class="row g-2 mt-2">
            <div class="col-6">
              <label class="form-label fw-bold">Marca</label>
              <input id="marca" class="form-control" placeholder="Ej. 3M / Steelpro">
            </div>
            <div class="col-6">
              <label class="form-label fw-bold">Stock Mínimo</label>
              <input id="stockMinimo" type="number" class="form-control" value="5">
            </div>
          </div>

          <label class="form-label fw-bold mt-3">Ruta / URL Imagen</label>
          <input id="imagen" class="form-control" placeholder="Ej. /src/assets/guantes.jpg">
          
          <label class="form-label fw-bold mt-3">Categoría</label>
          <select id="categoria" class="form-select">
            ${opcionesCategorias}
          </select>
          
          <label class="form-label fw-bold mt-3">Estado</label>
          <select id="estado" class="form-select">
            <option value="Activo">Disponible</option>
            <option value="Agotado">Agotado</option>
            <option value="Inactivo">No disponible</option>
          </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Guardar en Supabase",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#20B2AA",
      cancelButtonColor: "#6c757d",
      customClass: { popup: "rounded-4" },
      preConfirm: () => {
        const nombre = document.getElementById("nombre").value.trim();
        const tipo = document.getElementById("tipo").value.trim();
        const descripcion = document.getElementById("descripcion").value.trim();
        const precio = document.getElementById("precio").value;
        const stock = document.getElementById("stock").value;
        const marca = document.getElementById("marca").value.trim();
        const stockMinimo = document.getElementById("stockMinimo").value;
        const imagen = document.getElementById("imagen").value.trim();
        const categoria = document.getElementById("categoria").value;
        const estado = document.getElementById("estado").value;

        if (!nombre || !precio || !categoria) {
          Swal.showValidationMessage("Nombre, precio y categoría son obligatorios");
          return false;
        }

        return {
          nombre,
          tipo: tipo || "Dotación",
          descripcion,
          precio: Number(precio),
          stock: stock !== "" ? Number(stock) : 0,
          marca: marca || "Tecnomatic",
          stockMinimo: Number(stockMinimo || 5),
          imagen: imagen || "/src/assets/icono.png",
          categoria: Number(categoria),
          estado,
        };
      },
    });

    if (form) {
      try {
        await productService.crearProducto(form);
        Swal.fire({
          icon: "success",
          title: "Producto Creado",
          text: "El producto se ha guardado exitosamente en Supabase PostgreSQL.",
          confirmButtonColor: "#20B2AA",
          timer: 1500,
          showConfirmButton: false,
        });
        cargarProductos();
      } catch (e) {
        console.error(e);
        Swal.fire({
          icon: "error",
          title: "Error al Guardar",
          text: e.message || "No se pudo crear el producto en Supabase.",
          confirmButtonColor: "#0047AB",
        });
      }
    }
  };

  // Editar producto
  const editarProducto = async (prod) => {
    const prodCatId = prod.categoria_id || prod.Categoria_producto_idCategoria;
    const opcionesCategorias = categorias
      .map(
        (c) =>
          `<option value="${c.id || c.idCategorias}" ${
            (c.id || c.idCategorias) === prodCatId ? "selected" : ""
          }>${c.nombre}</option>`
      )
      .join("");

    const { value: form } = await Swal.fire({
      title: '<h5 class="fw-bold mb-0" style="color: #0047AB">Editar Producto</h5>',
      html: `
        <div class="text-start px-2">
          <label class="form-label fw-bold mt-2">Nombre del Producto</label>
          <input id="nombre" class="form-control" value="${prod.Nombre_Producto}">
          
          <label class="form-label fw-bold mt-3">Tipo</label>
          <input id="tipo" class="form-control" value="${prod.Tipo || ""}">
          
          <label class="form-label fw-bold mt-3">Descripción</label>
          <textarea id="descripcion" class="form-control" rows="2">${prod.Descripcion || ""}</textarea>
          
          <div class="row g-2 mt-2">
            <div class="col-6">
              <label class="form-label fw-bold">Precio ($ COP)</label>
              <input id="precio" type="number" class="form-control" value="${prod.Precio}">
            </div>
            <div class="col-6">
              <label class="form-label fw-bold">Stock</label>
              <input id="stock" type="number" class="form-control" value="${prod.Stock ?? 0}" min="0">
            </div>
          </div>
          
          <label class="form-label fw-bold mt-3">Ruta / URL Imagen</label>
          <input id="imagen" class="form-control" value="${prod.Imagen || ""}">
          
          <label class="form-label fw-bold mt-3">Categoría</label>
          <select id="categoria" class="form-select">
            ${opcionesCategorias}
          </select>
          
          <label class="form-label fw-bold mt-3">Estado</label>
          <select id="estado" class="form-select">
            <option value="Activo" ${prod.Estado === "Activo" || prod.Estado === "Disponible" ? "selected" : ""}>Disponible</option>
            <option value="Agotado" ${prod.Estado === "Agotado" ? "selected" : ""}>Agotado</option>
            <option value="Inactivo" ${prod.Estado === "Inactivo" ? "selected" : ""}>No disponible</option>
          </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Actualizar en Supabase",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#20B2AA",
      cancelButtonColor: "#6c757d",
      customClass: { popup: "rounded-4" },
      preConfirm: () => {
        const nombre = document.getElementById("nombre").value.trim();
        const tipo = document.getElementById("tipo").value.trim();
        const descripcion = document.getElementById("descripcion").value.trim();
        const precio = document.getElementById("precio").value;
        const stock = document.getElementById("stock").value;
        const imagen = document.getElementById("imagen").value.trim();
        const categoria = document.getElementById("categoria").value;
        const estado = document.getElementById("estado").value;

        if (!nombre || !precio || !categoria) {
          Swal.showValidationMessage("Por favor completa todos los campos requeridos");
          return false;
        }

        return {
          nombre,
          tipo: tipo || "Dotación",
          descripcion,
          precio: Number(precio),
          stock: stock !== "" ? Number(stock) : 0,
          imagen: imagen || "/src/assets/icono.png",
          categoria: Number(categoria),
          estado,
        };
      },
    });

    if (form) {
      try {
        await productService.actualizarProducto(prod.idProductos || prod.id, form);
        Swal.fire({
          icon: "success",
          title: "Producto Actualizado",
          text: "Los cambios se han sincronizado con Supabase.",
          confirmButtonColor: "#20B2AA",
          timer: 1500,
          showConfirmButton: false,
        });
        cargarProductos();
      } catch (e) {
        console.error(e);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo actualizar el producto.",
          confirmButtonColor: "#0047AB",
        });
      }
    }
  };

  // Configuración técnica avanzada (Atributos técnicos y variantes)
  const configurarCatalogoTecnico = async (prod) => {
    const prodId = prod.idProductos || prod.id;
    try {
      Swal.fire({ title: "Cargando especificaciones...", didOpen: () => Swal.showLoading() });
      const cat = await productService.obtenerCatalogoDetallado(prodId);
      Swal.close();

      const { value: formValues } = await Swal.fire({
        title: `<h5 class="fw-bold" style="color:#0047AB">Ficha Técnica: ${prod.Nombre_Producto}</h5>`,
        html: `
          <div class="text-start px-2 small">
            <label class="form-label fw-bold">Marca Fabricante</label>
            <input id="cat-marca" class="form-control form-control-sm mb-2" value="${cat.atributos?.marca || prod.Marca || ""}">

            <label class="form-label fw-bold">Material de Fabricación</label>
            <input id="cat-material" class="form-control form-control-sm mb-2" value="${cat.atributos?.material || prod.Material || ""}">

            <label class="form-label fw-bold">Nivel / Certificación de Protección</label>
            <input id="cat-proteccion" class="form-control form-control-sm mb-2" value="${cat.atributos?.nivelProteccion || prod.Nivel_Proteccion || ""}">

            <label class="form-label fw-bold">Stock Mínimo para Alertas</label>
            <input id="cat-stockmin" type="number" class="form-control form-control-sm mb-2" value="${cat.atributos?.stockMinimo || prod.Stock_Minimo || 5}">
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Guardar Ficha Técnica",
        confirmButtonColor: "#20B2AA",
        preConfirm: () => ({
          marca: document.getElementById("cat-marca").value.trim(),
          material: document.getElementById("cat-material").value.trim(),
          nivelProteccion: document.getElementById("cat-proteccion").value.trim(),
          stockMinimo: Number(document.getElementById("cat-stockmin").value || 5),
        }),
      });

      if (formValues) {
        await productService.guardarCatalogoDetallado(prodId, {
          atributos: formValues,
          imagenes: cat.imagenes || [],
          variantes: cat.variantes || [],
        });
        Swal.fire("Guardado", "Ficha técnica guardada en Supabase.", "success");
        cargarProductos();
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo actualizar la ficha técnica.", "error");
    }
  };

  // Eliminar producto
  const eliminarProducto = async (id) => {
    const ok = await Swal.fire({
      title: "¿Enviar producto a papelera?",
      text: "El producto se ocultará del catálogo y se registrará en la papelera.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, mover a papelera",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      customClass: { popup: "rounded-4" },
    });

    if (ok.isConfirmed) {
      try {
        await productService.eliminarProductoPapelera(id);
        Swal.fire({
          icon: "success",
          title: "Producto en Papelera",
          confirmButtonColor: "#20B2AA",
          timer: 1500,
          showConfirmButton: false,
        });
        cargarProductos();
      } catch (e) {
        console.error(e);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo eliminar el producto.",
          confirmButtonColor: "#0047AB",
        });
      }
    }
  };

  const formatoMoneda = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

  const verMovimientos = async (producto) => {
    try {
      Swal.fire({
        title: "Cargando movimientos...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
      const movimientos = await inventoryService.obtenerMovimientosInventario(
        producto.idProductos || producto.id
      );
      const filas = movimientos.length
        ? movimientos
            .map(
              (m) => `
        <tr>
          <td class="text-start fw-bold ${m.Tipo_Movimiento === 'Entrada' ? 'text-success' : 'text-danger'}">${m.Tipo_Movimiento}</td>
          <td>${Number(m.Cantidad || 0)}</td>
          <td>${m.Fecha ? new Date(m.Fecha).toLocaleString("es-CO") : "Sin fecha"}</td>
          <td class="text-start">${m.Observacion || "Sin observación"}</td>
        </tr>`
            )
            .join("")
        : `<tr><td colspan="4" class="text-muted py-4">No hay movimientos registrados para este producto.</td></tr>`;

      Swal.fire({
        title: `Movimientos: ${producto.Nombre_Producto}`,
        html: `<div class="table-responsive text-center"><table class="table table-sm align-middle"><thead><tr><th class="text-start">Tipo</th><th>Cantidad</th><th>Fecha</th><th class="text-start">Observación</th></tr></thead><tbody>${filas}</tbody></table></div>`,
        width: "850px",
        confirmButtonText: "Cerrar",
        confirmButtonColor: "#0047AB",
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "No fue posible cargar el historial",
        text: error.message,
        confirmButtonColor: "#0047AB",
      });
    }
  };

  const estadisticas = {
    total: productos.length,
    valorInventario: productos.reduce(
      (total, producto) =>
        total + Number(producto.Precio || 0) * Number(producto.Stock || 0),
      0
    ),
    agotados: productos.filter((producto) => Number(producto.Stock || 0) === 0).length,
    bajoStock: productos.filter(
      (producto) =>
        Number(producto.Stock || 0) >= 1 && Number(producto.Stock || 0) <= 10
    ).length,
  };

  // Filtros de búsqueda
  const productosFiltrados = productos.filter((p) => {
    const precio = Number(p.Precio || 0);
    return (
      (p.Nombre_Producto || "").toLowerCase().includes(busqueda.toLowerCase()) &&
      (filtroEstado === "" ||
        (p.Estado || "").toLowerCase() === filtroEstado.toLowerCase()) &&
      (filtroCategoria === "" || p.Categoria === filtroCategoria) &&
      (precioMinimo === "" || precio >= Number(precioMinimo)) &&
      (precioMaximo === "" || precio <= Number(precioMaximo))
    );
  });

  return (
    <Motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container py-5"
    >
      <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: "#0047AB" }}>
            📦 CRUD de Catálogo e Inventario (Supabase PostgreSQL)
          </h3>
          <p className="text-muted" style={{ fontSize: "14px" }}>
            Gestiona productos, fichas técnicas, stocks y kárdex en tiempo real.
          </p>
        </div>
        <button
          className="btn fw-bold text-white shadow-sm rounded-pill px-4"
          style={{ backgroundColor: "#20B2AA" }}
          onClick={agregarProducto}
        >
          <i className="bi bi-plus-circle me-1.5"></i> Agregar Producto
        </button>
      </div>

      <div className="row g-3 mb-4">
        {[
          ["bi-box-seam", "Total Productos", estadisticas.total, "#0047AB"],
          [
            "bi-cash-stack",
            "Valor de Inventario",
            formatoMoneda.format(estadisticas.valorInventario),
            "#059669",
          ],
          ["bi-x-circle", "Agotados", estadisticas.agotados, "#dc3545"],
          [
            "bi-exclamation-triangle",
            "Bajo Stock",
            estadisticas.bajoStock,
            "#d97706",
          ],
        ].map(([icono, etiqueta, valor, color]) => (
          <div className="col-sm-6 col-xl-3" key={etiqueta}>
            <div
              className="bg-white shadow-sm rounded-4 p-3 h-100 border-start border-4"
              style={{ borderLeftColor: color }}
            >
              <div className="d-flex align-items-center gap-3">
                <i className={`bi ${icono}`} style={{ color, fontSize: "1.8rem" }} />
                <div>
                  <small className="text-muted d-block">{etiqueta}</small>
                  <strong style={{ color, fontSize: "1.2rem" }}>{valor}</strong>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="tm-table-container">
        {/* Cabecera y Filtros */}
        <div className="row g-3 justify-content-between align-items-center mb-4">
          <div className="col-12 d-flex gap-2 flex-wrap">
            {/* Buscador */}
            <div style={{ position: "relative", minWidth: "240px", flex: 1 }}>
              <input
                className="form-control ps-4"
                placeholder="Buscar por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{ borderRadius: "10px", paddingLeft: "35px" }}
              />
              <i
                className="bi bi-search text-muted"
                style={{ position: "absolute", left: "12px", top: "11px" }}
              ></i>
            </div>

            {/* Filtro estado */}
            <div style={{ minWidth: "160px" }}>
              <select
                className="form-select"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                style={{ borderRadius: "10px" }}
              >
                <option value="">Todos los estados</option>
                <option value="Activo">Activo / Disponible</option>
                <option value="Agotado">Agotado</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>

            {/* Filtro categoría */}
            <div style={{ minWidth: "180px" }}>
              <select
                className="form-select"
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                style={{ borderRadius: "10px" }}
              >
                <option value="">Todas las categorías</option>
                {categorias.map((cat) => (
                  <option key={cat.id || cat.idCategorias} value={cat.nombre}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="number"
              min="0"
              className="form-control"
              placeholder="Min $"
              value={precioMinimo}
              onChange={(e) => setPrecioMinimo(e.target.value)}
              style={{ borderRadius: "10px", width: "110px" }}
            />
            <input
              type="number"
              min="0"
              className="form-control"
              placeholder="Max $"
              value={precioMaximo}
              onChange={(e) => setPrecioMaximo(e.target.value)}
              style={{ borderRadius: "10px", width: "110px" }}
            />
          </div>
        </div>

        {/* TABLA CRUD */}
        {loading ? (
          <div className="text-center py-5">
            <span className="spinner-border spinner-border text-primary" role="status" />
            <p className="text-muted mt-2 mb-0" style={{ fontSize: "13.5px" }}>
              Cargando desde Supabase PostgreSQL...
            </p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-basket-fill" style={{ fontSize: "2rem" }}></i>
            <p className="mt-2 mb-0" style={{ fontSize: "14px" }}>
              No se encontraron productos coincidentes.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="tm-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map((p) => (
                  <tr key={p.idProductos || p.id}>
                    <td className="fw-semibold text-dark">
                      <div className="d-flex align-items-center gap-2">
                        <img
                          src={p.Imagen || "/src/assets/icono.png"}
                          alt={p.Nombre_Producto}
                          className="rounded-2 object-fit-cover shadow-sm"
                          style={{ width: 36, height: 36 }}
                          onError={(e) => {
                            e.target.src = "/src/assets/icono.png";
                          }}
                        />
                        <div>
                          <div>{p.Nombre_Producto}</div>
                          {p.Marca && (
                            <small className="text-muted" style={{ fontSize: "11px" }}>
                              Marca: {p.Marca}
                            </small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{p.Categoria}</td>
                    <td className="fw-bold" style={{ color: "#0047AB" }}>
                      ${Number(p.Precio).toLocaleString("es-CO")}
                    </td>
                    <td>
                      <span
                        className="fw-bold"
                        style={{
                          color:
                            p.Stock === 0
                              ? "#dc3545"
                              : p.Stock <= (p.Stock_Minimo || 10)
                              ? "#d97706"
                              : "#059669",
                        }}
                      >
                        {p.Stock !== undefined ? `${p.Stock} uds` : "0 uds"}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge px-3 py-1.5"
                        style={{
                          borderRadius: "20px",
                          fontSize: "11px",
                          backgroundColor:
                            p.Estado === "Activo" || p.Estado === "Disponible"
                              ? "#ecfdf5"
                              : p.Estado === "Agotado"
                              ? "#fef2f2"
                              : "#f1f5f9",
                          color:
                            p.Estado === "Activo" || p.Estado === "Disponible"
                              ? "#047857"
                              : p.Estado === "Agotado"
                              ? "#b91c1c"
                              : "#475569",
                          border:
                            p.Estado === "Activo" || p.Estado === "Disponible"
                              ? "1px solid #a7f3d0"
                              : p.Estado === "Agotado"
                              ? "1px solid #fca5a5"
                              : "1px solid #cbd5e1",
                        }}
                      >
                        {p.Estado === "Activo" || p.Estado === "Disponible"
                          ? "Disponible"
                          : p.Estado === "Agotado"
                          ? "Agotado"
                          : "No disponible"}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1.5">
                        <button
                          className="btn btn-sm btn-outline-info"
                          style={{ borderRadius: "8px", padding: "6px 10px" }}
                          onClick={() => configurarCatalogoTecnico(p)}
                          title="Ficha Técnica & Variantes"
                        >
                          <i className="bi bi-card-checklist"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          style={{ borderRadius: "8px", padding: "6px 10px" }}
                          onClick={() => verMovimientos(p)}
                          title="Historial de movimientos"
                        >
                          <i className="bi bi-clock-history"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          style={{ borderRadius: "8px", padding: "6px 10px" }}
                          onClick={() => editarProducto(p)}
                          title="Editar"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          style={{ borderRadius: "8px", padding: "6px 10px" }}
                          onClick={() => eliminarProducto(p.idProductos || p.id)}
                          title="Mover a papelera"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Motion.div>
  );
}

export default TablaProductos;
