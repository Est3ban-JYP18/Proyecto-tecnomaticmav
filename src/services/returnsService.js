import { supabase, isSupabaseConfigured } from "../lib/supabase";

const getStoredLocalReturns = () => {
  try {
    const saved = localStorage.getItem("tecnomatic_local_returns");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveStoredLocalReturns = (returns) => {
  localStorage.setItem("tecnomatic_local_returns", JSON.stringify(returns));
};

export const returnsService = {
  // Crear solicitud de devolución
  async crearDevolucion({
    facturaId,
    idFactura,
    productoId,
    idProducto,
    usuarioId,
    idUsuario,
    cantidad,
    motivo,
    motivoCategoria,
    metodoReembolso,
    metodoRetorno,
    direccionRetorno,
    evidenciaUrl,
  }) {
    const fId = Number(facturaId || idFactura);
    const pId = Number(productoId || idProducto);
    const uId = usuarioId || idUsuario;

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("Devoluciones")
          .insert({
            Facturas_idFacturas: fId,
            Productos_idProductos: pId,
            Usuarios_idUsuarios: uId,
            Cantidad: Number(cantidad),
            Motivo: motivo,
            Motivo_Categoria: motivoCategoria || null,
            Metodo_Reembolso: metodoReembolso || null,
            Metodo_Retorno: metodoRetorno || null,
            Direccion_Retorno: direccionRetorno || null,
            Evidencia_Url: evidenciaUrl || null,
            Estado: "Pendiente",
            Estado_Tracking: "Solicitada",
          })
          .select()
          .single();

        if (error) throw error;
        return { ok: true, id: data.idDevoluciones, message: "Solicitud de devolución registrada con éxito" };
      } catch (err) {
        console.warn("Error creando devolución en Supabase:", err);
      }
    }

    const returns = getStoredLocalReturns();
    const nueva = {
      idDevoluciones: Date.now(),
      id: Date.now(),
      Facturas_idFacturas: fId,
      Productos_idProductos: pId,
      Usuarios_idUsuarios: uId,
      Cantidad: Number(cantidad),
      Motivo: motivo,
      Motivo_Categoria: motivoCategoria,
      Metodo_Reembolso: metodoReembolso,
      Metodo_Retorno: metodoRetorno,
      Direccion_Retorno: direccionRetorno,
      Evidencia_Url: evidenciaUrl,
      Estado: "Pendiente",
      Estado_Tracking: "Solicitada",
      Fecha: new Date().toISOString(),
      Nombre_Producto: "Producto Tecnomatic",
    };
    returns.unshift(nueva);
    saveStoredLocalReturns(returns);
    return { ok: true, id: nueva.id };
  },

  // Obtener devoluciones del cliente
  async obtenerMisDevoluciones(idUsuario) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("Devoluciones")
          .select("*")
          .eq("Usuarios_idUsuarios", idUsuario)
          .order("Fecha", { ascending: false });

        if (!error && data) {
          return data.map((d) => ({
            idDevoluciones: d.idDevoluciones,
            Facturas_idFacturas: d.Facturas_idFacturas,
            Productos_idProductos: d.Productos_idProductos,
            Cantidad: d.Cantidad,
            Motivo: d.Motivo,
            Estado: d.Estado,
            Fecha: d.Fecha,
            Motivo_Categoria: d.Motivo_Categoria,
            Metodo_Reembolso: d.Metodo_Reembolso,
            Metodo_Retorno: d.Metodo_Retorno,
            Direccion_Retorno: d.Direccion_Retorno,
            Evidencia_Url: d.Evidencia_Url,
            Comentarios_Admin: d.Comentarios_Admin,
            Codigo_Cupon: d.Codigo_Cupon,
            Estado_Tracking: d.Estado_Tracking,
            Nombre_Producto: "Producto",
            Imagen_Producto: "/src/assets/icono.png",
            Nombres: "",
            Apellidos: "",
          }));
        }
      } catch (e) {
        console.warn("Error obteniendo devoluciones de cliente en Supabase:", e);
      }
    }

    const returns = getStoredLocalReturns();
    return returns.filter((r) => r.Usuarios_idUsuarios === idUsuario || !r.Usuarios_idUsuarios);
  },

  // Obtener todas las devoluciones (Admin)
  async obtenerTodasLasDevoluciones() {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("Devoluciones")
          .select("*")
          .order("idDevoluciones", { ascending: false });

        if (!error && data) {
          return data.map((d) => ({
            ...d,
            idDevoluciones: d.idDevoluciones,
            Nombre_Producto: "Producto",
            Imagen_Producto: "/src/assets/icono.png",
            Nombres: "Cliente",
            Apellidos: "",
            Correo: "",
          }));
        }
      } catch (e) {
        console.warn("Error obteniendo todas las devoluciones en Supabase:", e);
      }
    }

    return getStoredLocalReturns();
  },

  // Aprobar devolución (Admin)
  async aprobarDevolucion(id, comentariosAdmin = "", codigoCupon = "") {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from("Devoluciones")
          .update({
            Estado: "Aprobada",
            Estado_Tracking: "Resuelta",
            Comentarios_Admin: comentariosAdmin || null,
            Codigo_Cupon: codigoCupon || null,
          })
          .eq("idDevoluciones", id);

        if (!error) return { ok: true, message: "Devolución aprobada exitosamente" };
      } catch (e) {
        console.warn("Error aprobando devolución en Supabase:", e);
      }
    }

    const returns = getStoredLocalReturns();
    const item = returns.find((r) => r.idDevoluciones === Number(id) || r.id === Number(id));
    if (item) {
      item.Estado = "Aprobada";
      item.Estado_Tracking = "Resuelta";
      item.Comentarios_Admin = comentariosAdmin;
      item.Codigo_Cupon = codigoCupon;
      saveStoredLocalReturns(returns);
    }
    return { ok: true };
  },

  // Rechazar devolución (Admin)
  async rechazarDevolucion(id, comentariosAdmin = "") {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from("Devoluciones")
          .update({
            Estado: "Rechazada",
            Estado_Tracking: "Rechazada",
            Comentarios_Admin: comentariosAdmin || null,
          })
          .eq("idDevoluciones", id);

        if (!error) return { ok: true, message: "Devolución rechazada" };
      } catch (e) {
        console.warn("Error rechazando devolución en Supabase:", e);
      }
    }

    const returns = getStoredLocalReturns();
    const item = returns.find((r) => r.idDevoluciones === Number(id) || r.id === Number(id));
    if (item) {
      item.Estado = "Rechazada";
      item.Estado_Tracking = "Rechazada";
      item.Comentarios_Admin = comentariosAdmin;
      saveStoredLocalReturns(returns);
    }
    return { ok: true };
  },

  // Actualizar estado de tracking paso a paso
  async actualizarTracking(id, nuevoEstadoTracking) {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from("Devoluciones")
          .update({ Estado_Tracking: nuevoEstadoTracking })
          .eq("idDevoluciones", id);

        if (!error) return { ok: true };
      } catch (e) {
        console.warn("Error actualizando tracking de devolución:", e);
      }
    }

    const returns = getStoredLocalReturns();
    const item = returns.find((r) => r.idDevoluciones === Number(id) || r.id === Number(id));
    if (item) {
      item.Estado_Tracking = nuevoEstadoTracking;
      saveStoredLocalReturns(returns);
    }
    return { ok: true };
  },
};
