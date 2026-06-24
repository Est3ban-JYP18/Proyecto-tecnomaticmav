import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

const URL = "http://localhost:3001/admin/usuarios";

function TablaUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [loading, setLoading] = useState(true);

  // Cargar usuarios de la base de datos
  const cargarUsuarios = () => {
    setLoading(true);
    fetch(URL)
      .then((res) => {
        if (!res.ok) throw new Error("Error cargando usuarios");
        return res.json();
      })
      .then((data) => {
        setUsuarios(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // Mapear el rol numérico a texto legible
  const obtenerNombreRol = (rolId) => {
    if (rolId === 1) return "Administrador";
    if (rolId === 2) return "Contador";
    return "Cliente";
  };

  // Mapear color de badge de rol
  const obtenerBadgeRolEstilo = (rolId) => {
    if (rolId === 1) {
      return { backgroundColor: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" }; // Red
    }
    if (rolId === 2) {
      return { backgroundColor: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" }; // Blue
    }
    return { backgroundColor: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0" }; // Green
  };

  // Agregar usuario
  const agregarUsuario = async () => {
    const { value: form } = await Swal.fire({
      title: '<h5 class="fw-bold mb-0" style="color: #0047AB">Agregar Usuario</h5>',
      html: `
        <div class="text-start px-2">
          <label class="form-label fw-bold mt-2">Nombres</label>
          <input id="nombres" class="form-control" placeholder="Ej. Juan Andrés">
          
          <label class="form-label fw-bold mt-3">Apellidos</label>
          <input id="apellidos" class="form-control" placeholder="Ej. Pérez Gómez">
          
          <label class="form-label fw-bold mt-3">Correo Electrónico</label>
          <input id="correo" type="email" class="form-control" placeholder="Ej. juan.perez@example.com">
          
          <label class="form-label fw-bold mt-3">Contraseña</label>
          <input id="contrasena" type="password" class="form-control" placeholder="Mínimo 6 caracteres">
          
          <label class="form-label fw-bold mt-3">Rol del Sistema</label>
          <select id="rol" class="form-select">
            <option value="3">Cliente</option>
            <option value="2">Contador</option>
            <option value="1">Administrador</option>
          </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Crear",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#20B2AA",
      cancelButtonColor: "#6c757d",
      customClass: {
        popup: 'rounded-4'
      },
      preConfirm: () => {
        const nombres = document.getElementById("nombres").value.trim();
        const apellidos = document.getElementById("apellidos").value.trim();
        const correo = document.getElementById("correo").value.trim();
        const contrasena = document.getElementById("contrasena").value;
        const rol = document.getElementById("rol").value;

        if (!nombres || !apellidos || !correo || !contrasena) {
          Swal.showValidationMessage("Todos los campos son obligatorios");
          return false;
        }

        if (contrasena.length < 3) {
          Swal.showValidationMessage("La contraseña debe tener al menos 3 caracteres");
          return false;
        }

        return {
          nombres,
          apellidos,
          correo,
          contrasena,
          rol: Number(rol),
        };
      },
    });

    if (form) {
      try {
        const res = await fetch(URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Error al crear usuario");
        }

        Swal.fire({
          icon: "success",
          title: "Usuario Creado",
          text: "El usuario ha sido registrado en la base de datos.",
          confirmButtonColor: "#20B2AA",
          timer: 1500,
          showConfirmButton: false
        });

        cargarUsuarios();
      } catch (e) {
        console.error(e);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: e.message || "No se pudo registrar el usuario.",
          confirmButtonColor: "#0047AB"
        });
      }
    }
  };

  // Editar usuario
  const editarUsuario = async (user) => {
    const { value: form } = await Swal.fire({
      title: '<h5 class="fw-bold mb-0" style="color: #0047AB">Editar Usuario</h5>',
      html: `
        <div class="text-start px-2">
          <label class="form-label fw-bold mt-2">Nombres</label>
          <input id="nombres" class="form-control" value="${user.Nombres}">
          
          <label class="form-label fw-bold mt-3">Apellidos</label>
          <input id="apellidos" class="form-control" value="${user.Apellidos}">
          
          <label class="form-label fw-bold mt-3">Correo Electrónico</label>
          <input id="correo" type="email" class="form-control" value="${user.Correo}">
          
          <label class="form-label fw-bold mt-3">Nueva Contraseña (Opcional)</label>
          <input id="contrasena" type="password" class="form-control" placeholder="Dejar en blanco para no cambiar">
          
          <label class="form-label fw-bold mt-3">Rol del Sistema</label>
          <select id="rol" class="form-select">
            <option value="3" ${user.Roles_idRoles === 3 ? "selected" : ""}>Cliente</option>
            <option value="2" ${user.Roles_idRoles === 2 ? "selected" : ""}>Contador</option>
            <option value="1" ${user.Roles_idRoles === 1 ? "selected" : ""}>Administrador</option>
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
        popup: 'rounded-4'
      },
      preConfirm: () => {
        const nombres = document.getElementById("nombres").value.trim();
        const apellidos = document.getElementById("apellidos").value.trim();
        const correo = document.getElementById("correo").value.trim();
        const contrasena = document.getElementById("contrasena").value;
        const rol = document.getElementById("rol").value;

        if (!nombres || !apellidos || !correo) {
          Swal.showValidationMessage("Nombres, apellidos y correo son obligatorios");
          return false;
        }

        return {
          nombres,
          apellidos,
          correo,
          contrasena: contrasena ? contrasena : undefined,
          rol: Number(rol),
        };
      },
    });

    if (form) {
      try {
        const res = await fetch(`${URL}/${user.idUsuarios}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Error al actualizar usuario");
        }

        Swal.fire({
          icon: "success",
          title: "Usuario Actualizado",
          text: "Los datos se guardaron exitosamente.",
          confirmButtonColor: "#20B2AA",
          timer: 1500,
          showConfirmButton: false
        });

        cargarUsuarios();
      } catch (e) {
        console.error(e);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: e.message || "No se pudo actualizar el usuario.",
          confirmButtonColor: "#0047AB"
        });
      }
    }
  };

  // Eliminar usuario
  const eliminarUsuario = async (id) => {
    const ok = await Swal.fire({
      title: "¿Eliminar usuario?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      customClass: {
        popup: 'rounded-4'
      }
    });

    if (ok.isConfirmed) {
      try {
        const res = await fetch(`${URL}/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Error al eliminar usuario");
        }

        Swal.fire({
          icon: "success",
          title: "Usuario Eliminado",
          confirmButtonColor: "#20B2AA",
          timer: 1500,
          showConfirmButton: false
        });

        cargarUsuarios();
      } catch (e) {
        console.error(e);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: e.message || "No se pudo eliminar el usuario.",
          confirmButtonColor: "#0047AB"
        });
      }
    }
  };

  // Filtrar
  const usuariosFiltrados = usuarios.filter((u) => {
    const nombreCompleto = `${u.Nombres || ""} ${u.Apellidos || ""}`.toLowerCase();
    const coincideBusqueda =
      nombreCompleto.includes(busqueda.toLowerCase()) ||
      (u.Correo || "").toLowerCase().includes(busqueda.toLowerCase());
    
    const coincideRol = filtroRol === "" || String(u.Roles_idRoles) === filtroRol;

    return coincideBusqueda && coincideRol;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container py-5"
    >
      <div className="mb-4">
        <h3 className="fw-bold mb-1" style={{ color: "#0047AB" }}>👥 CRUD de Usuarios (MySQL)</h3>
        <p className="text-muted" style={{ fontSize: "14px" }}>Administra las credenciales y roles (Administrador, Contador, Cliente) de la base de datos.</p>
      </div>

      <div className="tm-table-container">
        {/* Cabecera y Filtros */}
        <div className="row g-3 justify-content-between align-items-center mb-4">
          <div className="col-md-8 d-flex gap-2 flex-wrap">
            {/* Buscador */}
            <div style={{ position: "relative", minWidth: "260px" }}>
              <input
                className="form-control ps-4"
                placeholder="Buscar por nombre o correo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{ borderRadius: "10px", paddingLeft: "35px" }}
              />
              <i className="bi bi-search text-muted" style={{ position: "absolute", left: "12px", top: "11px" }}></i>
            </div>
            
            {/* Filtro Rol */}
            <div style={{ position: "relative", minWidth: "180px" }}>
              <select
                className="form-select"
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
                style={{ borderRadius: "10px" }}
              >
                <option value="">Todos los roles</option>
                <option value="1">Administradores</option>
                <option value="2">Contadores</option>
                <option value="3">Clientes</option>
              </select>
            </div>
          </div>

          <div className="col-md-4 text-md-end">
            <button 
              className="btn fw-bold text-white shadow-sm" 
              style={{
                backgroundColor: "#20B2AA",
                borderRadius: "12px",
                padding: "10px 20px",
                fontSize: "14.5px"
              }}
              onClick={agregarUsuario}
            >
              <i className="bi bi-person-plus me-1.5"></i> Agregar Usuario
            </button>
          </div>
        </div>

        {/* TABLA CRUD */}
        {loading ? (
          <div className="text-center py-5">
            <span className="spinner-border spinner-border text-primary" role="status" />
            <p className="text-muted mt-2 mb-0" style={{ fontSize: "13.5px" }}>Conectando a MySQL...</p>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-people-fill" style={{ fontSize: "2rem" }}></i>
            <p className="mt-2 mb-0" style={{ fontSize: "14px" }}>No se encontraron usuarios registrados.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="tm-table">
              <thead>
                <tr>
                  <th>Nombres y Apellidos</th>
                  <th>Correo</th>
                  <th>Contraseña</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u) => (
                  <tr key={u.idUsuarios}>
                    <td className="fw-semibold text-dark">
                      {u.Nombres} {u.Apellidos}
                    </td>
                    <td>{u.Correo}</td>
                    <td className="text-muted font-monospace" style={{ fontSize: "12px" }}>
                      ••••••••
                    </td>
                    <td>
                      <span
                        className="badge px-3 py-1.5"
                        style={{
                          borderRadius: "20px",
                          fontSize: "11px",
                          ...obtenerBadgeRolEstilo(u.Roles_idRoles)
                        }}
                      >
                        {obtenerNombreRol(u.Roles_idRoles)}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          style={{ borderRadius: "8px", padding: "6px 12px" }}
                          onClick={() => editarUsuario(u)}
                          title="Editar"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          style={{ borderRadius: "8px", padding: "6px 12px" }}
                          onClick={() => eliminarUsuario(u.idUsuarios)}
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
    </motion.div>
  );
}

export default TablaUsuarios;
