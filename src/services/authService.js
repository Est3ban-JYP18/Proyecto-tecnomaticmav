import { supabase, isSupabaseConfigured } from "../lib/supabase";

// Usuarios de respaldo local cuando no hay conexión a Supabase
const USUARIOS_DEMO = [
  {
    id: "a0000000-0000-0000-0000-000000000001",
    nombres: "Administrador",
    apellidos: "General",
    correo: "admin@tecnomaticmav.com",
    contrasena: "admin123",
    rol_id: 1,
    rol: "admin",
    Roles_idRoles: 1,
  },
  {
    id: "a0000000-0000-0000-0000-000000000002",
    nombres: "Carlos",
    apellidos: "Contador",
    correo: "contador@tecnomaticmav.com",
    contrasena: "contador123",
    rol_id: 2,
    rol: "contador",
    Roles_idRoles: 2,
  },
  {
    id: "a0000000-0000-0000-0000-000000000003",
    nombres: "Juan",
    apellidos: "Pérez",
    correo: "cliente@tecnomaticmav.com",
    contrasena: "cliente123",
    rol_id: 3,
    rol: "cliente",
    Roles_idRoles: 3,
  },
];

const getStoredLocalUsers = () => {
  try {
    const saved = localStorage.getItem("tecnomatic_local_users");
    return saved ? JSON.parse(saved) : USUARIOS_DEMO;
  } catch {
    return USUARIOS_DEMO;
  }
};

const saveStoredLocalUsers = (users) => {
  localStorage.setItem("tecnomatic_local_users", JSON.stringify(users));
};

export const authService = {
  // Iniciar sesión
  async login(correo, contrasena) {
    const emailLimpio = correo.trim().toLowerCase();

    if (isSupabaseConfigured()) {
      try {
        // El RPC comprueba credenciales sin permitir leer la columna Contrasena.
        const { data: profiles, error: profileErr } = await supabase.rpc("iniciar_sesion_legacy", {
          p_correo: emailLimpio,
          p_contrasena: contrasena,
        });
        const userProfile = profiles?.[0];

        if (userProfile && !profileErr) {
          const rolNombre = userProfile.Roles_idRoles === 1 ? "admin" : userProfile.Roles_idRoles === 2 ? "contador" : "cliente";
          const sessionUser = {
            id: userProfile.idUsuarios,
            idUsuarios: userProfile.idUsuarios,
            nombres: userProfile.Nombres,
            apellidos: userProfile.Apellidos,
            nombre: `${userProfile.Nombres} ${userProfile.Apellidos}`.trim(),
            correo: userProfile.Correo,
            rol: rolNombre,
            Roles_idRoles: userProfile.Roles_idRoles,
          };
          localStorage.setItem("usuario", JSON.stringify(sessionUser));
          return { ok: true, usuario: sessionUser };
        }

        // 2. Intentar Supabase Auth oficial
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email: emailLimpio,
          password: contrasena,
        });

        if (!authErr && authData.user) {
          const sessionUser = {
            id: authData.user.id,
            idUsuarios: authData.user.id,
            nombres: authData.user.user_metadata?.nombres || "Usuario",
            apellidos: authData.user.user_metadata?.apellidos || "",
            nombre: `${authData.user.user_metadata?.nombres || "Usuario"} ${authData.user.user_metadata?.apellidos || ""}`.trim(),
            correo: authData.user.email,
            rol: "cliente",
            Roles_idRoles: 3,
          };
          localStorage.setItem("usuario", JSON.stringify(sessionUser));
          return { ok: true, usuario: sessionUser };
        }
      } catch (err) {
        console.warn("Supabase auth falló, verificando fallback local:", err);
      }
    }

    // Fallback de demostración local
    const localUsers = getStoredLocalUsers();
    const found = localUsers.find(
      (u) => u.correo.toLowerCase() === emailLimpio && u.contrasena === contrasena
    );

    if (found) {
      const sessionUser = {
        id: found.id,
        idUsuarios: found.id,
        nombres: found.nombres,
        apellidos: found.apellidos,
        nombre: `${found.nombres} ${found.apellidos}`.trim(),
        correo: found.correo,
        rol: found.rol,
        Roles_idRoles: found.Roles_idRoles || found.rol_id,
        telefono: found.telefono,
        ciudad: found.ciudad,
      };
      localStorage.setItem("usuario", JSON.stringify(sessionUser));
      return { ok: true, usuario: sessionUser };
    }

    throw new Error("Correo o contraseña incorrectos");
  },

  // Registrar nuevo cliente
  async registro({ nombres, apellidos, correo, contrasena, telefono = "", ciudad = "", direccion = "" }) {
    const emailLimpio = correo.trim().toLowerCase();

    if (isSupabaseConfigured()) {
      try {
        const { data: usuarios, error: insertError } = await supabase.rpc("registrar_usuario_legacy", {
          p_nombres: nombres.trim(),
          p_apellidos: apellidos.trim(),
          p_correo: emailLimpio,
          p_contrasena: contrasena,
        });
        const nuevoUsuario = usuarios?.[0];

        if (insertError || !nuevoUsuario) throw insertError || new Error("No se pudo crear el usuario.");

        const sessionUser = {
          id: nuevoUsuario.idUsuarios,
          idUsuarios: nuevoUsuario.idUsuarios,
          nombres: nuevoUsuario.Nombres,
          apellidos: nuevoUsuario.Apellidos,
          nombre: `${nuevoUsuario.Nombres} ${nuevoUsuario.Apellidos}`.trim(),
          correo: nuevoUsuario.Correo,
          rol: "cliente",
          Roles_idRoles: 3,
        };

        localStorage.setItem("usuario", JSON.stringify(sessionUser));
        return { ok: true, usuario: sessionUser };
      } catch (err) {
        if (err.message?.includes("ya se encuentra registrado")) throw err;
        console.warn("Fallo registro en Supabase, usando persistencia local:", err);
      }
    }

    // Fallback local
    const localUsers = getStoredLocalUsers();
    if (localUsers.some((u) => u.correo.toLowerCase() === emailLimpio)) {
      throw new Error("Este correo electrónico ya se encuentra registrado.");
    }

    const nuevoLocal = {
      id: "u" + Date.now(),
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      correo: emailLimpio,
      contrasena,
      rol_id: 3,
      rol: "cliente",
      Roles_idRoles: 3,
      telefono,
      ciudad,
      direccion,
    };

    localUsers.push(nuevoLocal);
    saveStoredLocalUsers(localUsers);

    const sessionUser = {
      ...nuevoLocal,
      idUsuarios: nuevoLocal.id,
      nombre: `${nuevoLocal.nombres} ${nuevoLocal.apellidos}`.trim(),
    };
    localStorage.setItem("usuario", JSON.stringify(sessionUser));
    return { ok: true, usuario: sessionUser };
  },

  // Cerrar sesión
  async logout() {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn("Error cerrando sesión en Supabase:", e);
      }
    }
    localStorage.removeItem("usuario");
  },

  // Obtener todos los usuarios (Admin)
  async obtenerUsuarios() {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("Usuarios")
          .select("*")
          .order("idUsuarios", { ascending: false });

        if (!error && data) {
          return data.map((u) => ({
            idUsuarios: u.idUsuarios,
            id: u.idUsuarios,
            Nombres: u.Nombres,
            Apellidos: u.Apellidos,
            Correo: u.Correo,
            Roles_idRoles: u.Roles_idRoles,
            Rol: u.Roles_idRoles === 1 ? "admin" : u.Roles_idRoles === 2 ? "contador" : "cliente",
            Telefono: "",
            Ciudad: "",
          }));
        }
      } catch (e) {
        console.warn("Error obteniendo usuarios de Supabase:", e);
      }
    }

    return getStoredLocalUsers().map((u) => ({
      idUsuarios: u.id,
      id: u.id,
      Nombres: u.nombres,
      Apellidos: u.apellidos,
      Correo: u.correo,
      Roles_idRoles: u.Roles_idRoles || u.rol_id,
      Rol: u.rol || (u.rol_id === 1 ? "admin" : u.rol_id === 2 ? "contador" : "cliente"),
      Telefono: u.telefono || "",
      Ciudad: u.ciudad || "",
    }));
  },

  // Crear usuario desde panel administrativo
  async crearUsuarioAdmin({ nombres, apellidos, correo, contrasena, rol }) {
    const rolId = Number(rol) || (rol === "admin" ? 1 : rol === "contador" ? 2 : 3);
    const emailLimpio = correo.trim().toLowerCase();

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("Usuarios")
          .insert({
            Nombres: nombres.trim(),
            Apellidos: apellidos.trim(),
            Correo: emailLimpio,
            Contrasena: contrasena,
            Roles_idRoles: rolId,
          })
          .select()
          .single();

        if (error) throw error;
        return { ok: true, data };
      } catch (err) {
        console.warn("Error al crear usuario en Supabase:", err);
      }
    }

    const localUsers = getStoredLocalUsers();
    const nuevo = {
      id: "u" + Date.now(),
      nombres,
      apellidos,
      correo: emailLimpio,
      contrasena,
      rol_id: rolId,
      rol: rolId === 1 ? "admin" : rolId === 2 ? "contador" : "cliente",
      Roles_idRoles: rolId,
    };
    localUsers.push(nuevo);
    saveStoredLocalUsers(localUsers);
    return { ok: true, data: nuevo };
  },

  // Actualizar usuario (Admin)
  async actualizarUsuario(id, { nombres, apellidos, correo, contrasena, rol }) {
    const rolId = Number(rol) || (rol === "admin" ? 1 : rol === "contador" ? 2 : 3);
    const updatePayload = {
      Nombres: nombres.trim(),
      Apellidos: apellidos.trim(),
      Correo: correo.trim().toLowerCase(),
      Roles_idRoles: rolId,
    };
    if (contrasena) updatePayload.Contrasena = contrasena;

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from("Usuarios").update(updatePayload).eq("idUsuarios", id);
        if (!error) return { ok: true };
      } catch (err) {
        console.warn("Error actualizando en Supabase:", err);
      }
    }

    const localUsers = getStoredLocalUsers();
    const index = localUsers.findIndex((u) => u.id === id);
    if (index > -1) {
      localUsers[index] = {
        ...localUsers[index],
        ...updatePayload,
        rol: rolId === 1 ? "admin" : rolId === 2 ? "contador" : "cliente",
        Roles_idRoles: rolId,
      };
      saveStoredLocalUsers(localUsers);
    }
    return { ok: true };
  },

  // Eliminar usuario (Admin)
  async eliminarUsuario(id) {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from("Usuarios").delete().eq("idUsuarios", id);
        if (!error) return { ok: true };
      } catch (err) {
        console.warn("Error eliminando en Supabase:", err);
      }
    }

    let localUsers = getStoredLocalUsers();
    localUsers = localUsers.filter((u) => u.id !== id);
    saveStoredLocalUsers(localUsers);
    return { ok: true };
  },

  // Recuperación de contraseña
  async solicitarRecuperacion(correo) {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(correo);
        if (!error) {
          return { ok: true, message: "Enlace de recuperación enviado al correo." };
        }
      } catch (e) {
        console.warn("Error en reset password de Supabase:", e);
      }
    }

    const codigoDemo = String(Math.floor(100000 + Math.random() * 900000));
    sessionStorage.setItem("recovery_code_" + correo, codigoDemo);
    return {
      ok: true,
      message: `Código de verificación generado (Modo seguro/demo): ${codigoDemo}`,
      devCode: codigoDemo,
    };
  },

  async restablecerPassword(correo, codigo, nuevaContrasena) {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from("Usuarios")
          .update({ Contrasena: nuevaContrasena })
          .ilike("Correo", correo);
        if (!error) return { ok: true };
      } catch (e) {
        console.warn("Error restableciendo en Supabase:", e);
      }
    }

    const savedCode = sessionStorage.getItem("recovery_code_" + correo);
    if (savedCode && savedCode !== codigo) {
      throw new Error("Código de recuperación inválido o vencido.");
    }

    const localUsers = getStoredLocalUsers();
    const user = localUsers.find((u) => u.correo.toLowerCase() === correo.toLowerCase());
    if (user) {
      user.contrasena = nuevaContrasena;
      saveStoredLocalUsers(localUsers);
    }
    return { ok: true };
  },
};
