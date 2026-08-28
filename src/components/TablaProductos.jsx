import { useEffect, useState } from "react";
import { motion as Motion } from "framer-motion";
import Swal from "sweetalert2";

const URL = "http://localhost:3001/admin/productos";

function TablaProductos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [precioMinimo, setPrecioMinimo] = useState("");
  const [precioMaximo, setPrecioMaximo] = useState("");
  const [loading, setLoading] = useState(true);

  // Cargar productos de la base de datos
  const cargarProductos = () => {
    setLoading(true);
    fetch(URL)
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
  };

  // Cargar categorías reales de la base de datos
  const cargarCategorias = () => {
    fetch("http://localhost:3001/categorias")
      .then((res) => res.json())
      .then((data) => setCategorias(data))
      .catch((err) => console.error("Error cargando categorías:", err));
  };

  useEffect(() => {
    cargarProductos();
    cargarCategorias();
  }, []);

  // Agregar producto
  const agregarProducto = async () => {
    // Generar opciones HTML para las categorías de la base de datos
    const opcionesCategorias = categorias
      .map((c) => `<option value="${c.idCategorias}">${c.nombre}</option>`)
      .join("");

    const { value: form } = await Swal.fire({
      title:
        '<h5 class="fw-bold mb-0" style="color: #0047AB">Agregar Producto</h5>',
      html: `
        <div class="text-start px-2">
          <label class="form-label fw-bold mt-2">Nombre del Producto</label>
          <input id="nombre" class="form-control" placeholder="Ej. Guantes de Nitrilo">
          
          <label class="form-label fw-bold mt-3">Tipo</label>
          <input id="tipo" class="form-control" placeholder="Ej. Uniformes / Protección">
          
          <label class="form-label fw-bold mt-3">Descripción</label>
          <textarea id="descripcion" class="form-control" rows="2" placeholder="Detalles del producto..."></textarea>
          
          <label class="form-label fw-bold mt-3">Precio ($)</label>
          <input id="precio" type="number" class="form-control" placeholder="Ej. 45000">
          
          <label class="form-label fw-bold mt-3">Stock Inicial</label>
          <input id="stock" type="number" class="form-control" placeholder="Ej. 10" min="0" value="0">
          
          <label class="form-label fw-bold mt-3">Ruta Imagen</label>
          <input id="imagen" class="form-control" placeholder="Ej. guantes.jpg">
          
          <label class="form-label fw-bold mt-3">Categoría de la Base de Datos</label>
          <select id="categoria" class="form-select">
            ${opcionesCategorias}
          </select>
          
          <label class="form-label fw-bold mt-3">Estado</label>
          <select id="estado" class="form-select">
            <option value="Activo">Disponible</option>
            <option value="Inactivo">No disponible</option>
          </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#20B2AA",
      cancelButtonColor: "#6c757d",
      customClass: {
        popup: "rounded-4",
      },
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
          Swal.showValidationMessage(
            "Nombre, precio y categoría son obligatorios",
          );
          return false;
        }

        return {
          nombre,
          tipo: tipo || "Prenda",
          descripcion,
          precio: Number(precio),
          stock: stock !== "" ? Number(stock) : 0,
          imagen: imagen || "chaquetaindus.jfif",
          categoria: Number(categoria),
          estado,
        };
      },
    });

    if (form) {
      try {
        const res = await fetch(URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(form),
        });

        if (!res.ok) throw new Error("Error en el guardado");

        Swal.fire({
          icon: "success",
          title: "Producto Creado",
          text: "El producto se ha guardado en la base de datos MySQL.",
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
          text: "No se pudo crear el producto.",
          confirmButtonColor: "#0047AB",
        });
      }
    }
  };

  // Editar producto
  const editarProducto = async (prod) => {
    // Generar opciones de categoría pre-seleccionando la categoría actual del producto
    const opcionesCategorias = categorias
      .map(
        (c) =>
          `<option value="${c.idCategorias}" ${
            c.idCategorias === prod.Categoria_producto_idCategoria
              ? "selected"
              : ""
          }>${c.nombre}</option>`,
      )
      .join("");

    const { value: form } = await Swal.fire({
      title:
        '<h5 class="fw-bold mb-0" style="color: #0047AB">Editar Producto</h5>',
      html: `
        <div class="text-start px-2">
          <label class="form-label fw-bold mt-2">Nombre del Producto</label>
          <input id="nombre" class="form-control" value="${prod.Nombre_Producto}">
          
          <label class="form-label fw-bold mt-3">Tipo</label>
          <input id="tipo" class="form-control" value="${prod.Tipo || ""}">
          
          <label class="form-label fw-bold mt-3">Descripción</label>
          <textarea id="descripcion" class="form-control" rows="2">${prod.Descripcion || ""}</textarea>
          
          <label class="form-label fw-bold mt-3">Precio ($)</label>
          <input id="precio" type="number" class="form-control" value="${prod.Precio}">
          
          <label class="form-label fw-bold mt-3">Stock</label>
          <input id="stock" type="number" class="form-control" value="${prod.Stock || 0}" min="0">
          
          <label class="form-label fw-bold mt-3">Ruta Imagen</label>
          <input id="imagen" class="form-control" value="${prod.Imagen || ""}">
          
          <label class="form-label fw-bold mt-3">Categoría de la Base de Datos</label>
          <select id="categoria" class="form-select">
            ${opcionesCategorias}
          </select>
          
          <label class="form-label fw-bold mt-3">Estado</label>
          <select id="estado" class="form-select">
            <option value="Activo" ${prod.Estado === "Activo" || prod.Estado === "Disponible" ? "selected" : ""}>Disponible</option>
            <option value="Agotado" ${prod.Estado === "Agotado" ? "selected" : ""}>Agotado</option>
            <option value="Inactivo" ${prod.Estado === "Inactivo" || prod.Estado === "No disponible" ? "selected" : ""}>No disponible</option>
          </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Actualizar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#20B2AA",
      cancelButtonColor: "#6c757d",
      customClass: {
        popup: "rounded-4",
      },
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
          Swal.showValidationMessage(
            "Por favor completa todos los campos requeridos",
          );
          return false;
        }

        return {
          nombre,
          tipo: tipo || "Prenda",
          descripcion,
          precio: Number(precio),
          stock: stock !== "" ? Number(stock) : 0,
          imagen: imagen || "chaquetaindus.jfif",
          categoria: Number(categoria),
          estado,
        };
      },
    });

    if (form) {
      try {
        const res = await fetch(`${URL}/${prod.idProductos}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(form),
        });

        if (!res.ok) throw new Error("Error en la edición");

        Swal.fire({
          icon: "success",
          title: "Producto Actualizado",
          text: "Los cambios se han guardado exitosamente.",
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

  // Eliminar producto
  const eliminarProducto = async (id) => {
    const ok = await Swal.fire({
      title: "¿Eliminar producto?",
      text: "Esta acción eliminará el producto de la base de datos.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      customClass: {
        popup: "rounded-4",
      },
    });

    if (ok.isConfirmed) {
      try {
        const res = await fetch(`${URL}/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!res.ok) throw new Error("Error en la eliminación");

        Swal.fire({
          icon: "success",
          title: "Producto Eliminado",
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
          text: "No se pudo eliminar el producto de MySQL.",
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
  const escaparHtml = (valor) =>
    String(valor ?? "").replace(
      /[&<>'"]/g,
      (caracter) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        })[caracter],
    );

  const verMovimientos = async (producto) => {
    try {
      Swal.fire({
        title: "Cargando movimientos...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
      const respuesta = await fetch(
        `http://localhost:3001/stock/movimientos/${producto.idProductos}`,
      );
      if (!respuesta.ok)
        throw new Error("No se pudo consultar el historial de inventario.");
      const movimientos = await respuesta.json();
      const filas = movimientos.length
        ? movimientos
            .map(
              (movimiento) => `
        <tr>
          <td class="text-start">${escaparHtml(movimiento.Tipo_Movimiento)}</td>
          <td>${Number(movimiento.Cantidad || 0)}</td>
          <td>${movimiento.Fecha ? new Date(movimiento.Fecha).toLocaleString("es-CO") : "Sin fecha"}</td>
          <td class="text-start">${escaparHtml(movimiento.Observacion || "Sin observación")}</td>
        </tr>`,
            )
            .join("")
        : `<tr><td colspan="4" class="text-muted py-4">No hay movimientos registrados para este producto.</td></tr>`;
      Swal.fire({
        title: `Movimientos: ${escaparHtml(producto.Nombre_Producto)}`,
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
      0,
    ),
    agotados: productos.filter((producto) => Number(producto.Stock || 0) === 0)
      .length,
    bajoStock: productos.filter(
      (producto) =>
        Number(producto.Stock || 0) >= 1 && Number(producto.Stock || 0) <= 10,
    ).length,
  };

  // Filtros de búsqueda
  const productosFiltrados = productos.filter((p) => {
    const precio = Number(p.Precio || 0);
    return (
      p.Nombre_Producto.toLowerCase().includes(busqueda.toLowerCase()) &&
      (filtroEstado === "" ||
        p.Estado.toLowerCase() === filtroEstado.toLowerCase()) &&
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
      <div className="mb-4">
        <h3 className="fw-bold mb-1" style={{ color: "#0047AB" }}>
          📦 CRUD de Inventario (MySQL)
        </h3>
        <p className="text-muted" style={{ fontSize: "14px" }}>
          Crea, edita, y elimina productos interactuando directamente con las
          tablas de tu base de datos.
        </p>
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
                <i
                  className={`bi ${icono}`}
                  style={{ color, fontSize: "1.8rem" }}
                />
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
          <div className="col-md-8 d-flex gap-2 flex-wrap">
            {/* Buscador */}
            <div style={{ position: "relative", minWidth: "240px" }}>
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
            <div style={{ position: "relative", minWidth: "180px" }}>
              <select
                className="form-select"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                style={{ borderRadius: "10px" }}
              >
                <option value="">Todos los estados</option>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
                <option value="Agotado">Agotado</option>
              </select>
            </div>

            <div style={{ minWidth: "180px" }}>
              <select
                className="form-select"
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                style={{ borderRadius: "10px" }}
              >
                <option value="">Todas las categorías</option>
                {categorias.map((categoria) => (
                  <option key={categoria.idCategorias} value={categoria.nombre}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="number"
              min="0"
              className="form-control"
              placeholder="Precio mínimo"
              value={precioMinimo}
              onChange={(e) => setPrecioMinimo(e.target.value)}
              style={{ borderRadius: "10px", width: "145px" }}
            />
            <input
              type="number"
              min="0"
              className="form-control"
              placeholder="Precio máximo"
              value={precioMaximo}
              onChange={(e) => setPrecioMaximo(e.target.value)}
              style={{ borderRadius: "10px", width: "145px" }}
            />
          </div>

          <div className="col-md-4 text-md-end">
            <button
              className="btn fw-bold text-white shadow-sm"
              style={{
                backgroundColor: "#20B2AA",
                borderRadius: "12px",
                padding: "10px 20px",
                fontSize: "14.5px",
              }}
              onClick={agregarProducto}
            >
              <i className="bi bi-plus-circle me-1.5"></i> Agregar Producto
            </button>
          </div>
        </div>

        {/* TABLA CRUD */}
        {loading ? (
          <div className="text-center py-5">
            <span
              className="spinner-border spinner-border text-primary"
              role="status"
            />
            <p className="text-muted mt-2 mb-0" style={{ fontSize: "13.5px" }}>
              Cargando desde MySQL...
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
                  <tr key={p.idProductos}>
                    <td className="fw-semibold text-dark">
                      {p.Nombre_Producto}
                    </td>
                    <td>{p.Categoria}</td>
                    <td className="fw-bold" style={{ color: "#0047AB" }}>
                      ${p.Precio?.toLocaleString()}
                    </td>
                    <td>
                      <span
                        className="fw-bold"
                        style={{
                          color:
                            p.Stock === 0
                              ? "#dc3545"
                              : p.Stock <= 10
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
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          style={{ borderRadius: "8px", padding: "6px 12px" }}
                          onClick={() => verMovimientos(p)}
                          title="Ver movimientos de inventario"
                        >
                          <i className="bi bi-clock-history"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          style={{ borderRadius: "8px", padding: "6px 12px" }}
                          onClick={() => editarProducto(p)}
                          title="Editar"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          style={{ borderRadius: "8px", padding: "6px 12px" }}
                          onClick={() => eliminarProducto(p.idProductos)}
                          title="Eliminar"
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
