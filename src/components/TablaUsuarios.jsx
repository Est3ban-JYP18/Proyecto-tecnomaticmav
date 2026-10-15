import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import { authService } from "../services/authService";

function TablaUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [loading, setLoading] = useState(true);

  // Cargar usuarios de Supabase
  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const data = await authService.obtenerUsuarios();
      setUsuarios(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // Mapear el rol numérico a texto legible
  const obtenerNombreRol = (rolId) => {
    if (rolId === 1 || rolId === "admin") return "Administrador";
    if (rolId === 2 || rolId === "contador") return "Contador / Asesor";
    return "Cliente";
  };

  // Mapear color de badge de rol
  const obtenerBadgeRolEstilo = (rolId) => {
    if (rolId === 1 || rolId === "admin") {
      return { backgroundColor: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" }; // Red
    }
    if (rolId === 2 || rolId === "contador") {
      return { backgroundColor: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" }; // Blue
    }
    return { backgroundColor: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0" }; // Green
  };

  // Agregar usuario
  const agregarUsuario = async () => {
    const { value: form } = await Swal.fire({
      title: '<h5 class="fw-bold mb-0" style="color: #0047AB">Agregar Usuario a Supabase</h5>',
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
            <option value="2">Contador / Asesor</option>
            <option value="1">Administrador</option>
          </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Crear en Supabase",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#20B2AA",
      cancelButtonColor: "#6c757d",
      customClass: { popup: 'rounded-4' },
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
        await authService.crearUsuarioAdmin(form);
        Swal.fire({
          icon: "success",
          title: "Usuario Creado",
          text: "El usuario ha sido registrado en Supabase.",
          confirmButtonColor: "#20B2AA",
          timer: 1500,
          showConfirmButton: false,
        });
        cargarUsuarios();
      } catch (e) {
        console.error(e);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: e.message || "No se pudo registrar el usuario.",
          confirmButtonColor: "#0047AB",
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
          <input id="nombres" class="form-control" value="${user.Nombres || user.nombres || ""}">
          
          <label class="form-label fw-bold mt-3">Apellidos</label>
          <input id="apellidos" class="form-control" value="${user.Apellidos || user.apellidos || ""}">
          
          <label class="form-label fw-bold mt-3">Correo Electrónico</label>
          <input id="correo" type="email" class="form-control" value="${user.Correo || user.correo || ""}">
          
          <label class="form-label fw-bold mt-3">Nueva Contraseña (Opcional)</label>
          <input id="contrasena" type="password" class="form-control" placeholder="Dejar en blanco para no cambiar">
          
          <label class="form-label fw-bold mt-3">Rol del Sistema</label>
          <select id="rol" class="form-select">
            <option value="3" ${user.Roles_idRoles === 3 || user.rol_id === 3 ? "selected" : ""}>Cliente</option>
            <option value="2" ${user.Roles_idRoles === 2 || user.rol_id === 2 ? "selected" : ""}>Contador / Asesor</option>
            <option value="1" ${user.Roles_idRoles === 1 || user.rol_id === 1 ? "selected" : ""}>Administrador</option>
          </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Actualizar en Supabase",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#20B2AA",
      cancelButtonColor: "#6c757d",
      customClass: { popup: 'rounded-4' },
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
        await authService.actualizarUsuario(user.idUsuarios || user.id, form);
        Swal.fire({
          icon: "success",
          title: "Usuario Actualizado",
          text: "Los datos se sincronizaron con Supabase.",
          confirmButtonColor: "#20B2AA",
          timer: 1500,
          showConfirmButton: false,
        });
        cargarUsuarios();
      } catch (e) {
        console.error(e);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: e.message || "No se pudo actualizar el usuario.",
          confirmButtonColor: "#0047AB",
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
      confirmButtonText: "Sí, eliminar de Supabase",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      customClass: { popup: 'rounded-4' },
    });

    if (ok.isConfirmed) {
      try {
        await authService.eliminarUsuario(id);
        Swal.fire({
          icon: "success",
          title: "Usuario Eliminado",
          confirmButtonColor: "#20B2AA",
          timer: 1500,
          showConfirmButton: false,
        });
        cargarUsuarios();
      } catch (e) {
        console.error(e);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: e.message || "No se pudo eliminar el usuario.",
          confirmButtonColor: "#0047AB",
        });
      }
    }
  };

  // Filtrar
  const usuariosFiltrados = usuarios.filter((u) => {
    const nombreCompleto = `${u.Nombres || u.nombres || ""} ${u.Apellidos || u.apellidos || ""}`.toLowerCase();
    const coincideBusqueda =
      nombreCompleto.includes(busqueda.toLowerCase()) ||
      (u.Correo || u.correo || "").toLowerCase().includes(busqueda.toLowerCase());
    
    const rolActual = String(u.Roles_idRoles || u.rol_id || "");
    const coincideRol = filtroRol === "" || rolActual === filtroRol;

    return coincideBusqueda && coincideRol;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container py-5"
    >
      <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: "#0047AB" }}>
            👥 Gestión de Usuarios y Roles (Supabase Auth)
          </h3>
          <p className="text-muted" style={{ fontSize: "14px" }}>
            Administra perfiles, accesos y permisos de Administradores, Contadores y Clientes.
          </p>
        </div>
        <button
          className="btn fw-bold text-white shadow-sm rounded-pill px-4"
          style={{ backgroundColor: "#20B2AA" }}
          onClick={agregarUsuario}
        >
          <i className="bi bi-person-plus-fill me-1.5"></i> Agregar Usuario
        </button>
      </div>

      <div className="tm-table-container">
        {/* Cabecera y Filtros */}
        <div className="row g-3 justify-content-between align-items-center mb-4">
          <div className="col-12 d-flex gap-2 flex-wrap">
            {/* Buscador */}
            <div style={{ position: "relative", minWidth: "250px", flex: 1 }}>
              <input
                className="form-control ps-4"
                placeholder="Buscar por nombre o correo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{ borderRadius: "10px", paddingLeft: "35px" }}
              />
              <i 
                className="bi bi-search text-muted" 
                style={{ position: "absolute", left: "12px", top: "11px" }}
              ></i>
            </div>

            {/* Filtro Rol */}
            <div style={{ minWidth: "200px" }}>
              <select
                className="form-select"
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
                style={{ borderRadius: "10px" }}
              >
                <option value="">Todos los roles</option>
                <option value="1">Administrador</option>
                <option value="2">Contador / Asesor</option>
                <option value="3">Cliente</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLA CRUD */}
        {loading ? (
          <div className="text-center py-5">
            <span className="spinner-border spinner-border text-primary" role="status" />
            <p className="text-muted mt-2 mb-0" style={{ fontSize: "13.5px" }}>Cargando usuarios desde Supabase...</p>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-people" style={{ fontSize: "2rem" }}></i>
            <p className="mt-2 mb-0" style={{ fontSize: "14px" }}>No se encontraron usuarios.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="tm-table">
              <thead>
                <tr>
                  <th>Nombre Completo</th>
                  <th>Correo Electrónico</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u) => {
                  const rolId = u.Roles_idRoles || u.rol_id || 3;
                  return (
                    <tr key={u.idUsuarios || u.id}>
                      <td className="fw-semibold text-dark">
                        <div className="d-flex align-items-center gap-2">
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                            style={{ 
                              width: "35px", 
                              height: "35px", 
                              backgroundColor: rolId === 1 ? "#0047AB" : rolId === 2 ? "#20B2AA" : "#64748b",
                              fontSize: "13px"
                            }}
                          >
                            {(u.Nombres || u.nombres || "U").charAt(0).toUpperCase()}
                          </div>
                          <span>{(u.Nombres || u.nombres || "")} {(u.Apellidos || u.apellidos || "")}</span>
                        </div>
                      </td>
                      <td>{u.Correo || u.correo}</td>
                      <td>
                        <span 
                          className="badge px-3 py-1.5"
                          style={{
                            borderRadius: "20px",
                            fontSize: "12px",
                            ...obtenerBadgeRolEstilo(rolId)
                          }}
                        >
                          {obtenerNombreRol(rolId)}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            style={{ borderRadius: "8px", padding: "6px 12px" }}
                            onClick={() => editarUsuario(u)}
                            title="Editar usuario"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            style={{ borderRadius: "8px", padding: "6px 12px" }}
                            onClick={() => eliminarUsuario(u.idUsuarios || u.id)}
                            title="Eliminar usuario"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default TablaUsuarios;
