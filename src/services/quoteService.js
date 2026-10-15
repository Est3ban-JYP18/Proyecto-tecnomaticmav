import { supabase, isSupabaseConfigured } from "../lib/supabase";

const getStoredLocalQuotes = () => {
  try {
    const saved = localStorage.getItem("tecnomatic_local_quotes");
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        idCotizaciones: 1,
        Cliente: "Constructora Andes SAS",
        Correo: "compras@constructoraandes.com",
        Telefono: "3114455667",
        Productos: [
          { producto: "Casco de Seguridad Dielectrico", cantidad: 50 },
          { producto: "Botas de Seguridad Puntera Composite", cantidad: 50 },
          { producto: "Chaleco Reflectivo Alta Visibilidad", cantidad: 100 },
        ],
        Estado: "Pendiente",
        Fecha: new Date().toLocaleDateString(),
      },
    ];
  } catch {
    return [];
  }
};

const saveStoredLocalQuotes = (quotes) => {
  localStorage.setItem("tecnomatic_local_quotes", JSON.stringify(quotes));
};

export const quoteService = {
  // Guardar nueva cotización
  async crearCotizacion({ cliente, correo, telefono, productos, mensaje = "" }) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("Cotizaciones")
          .insert({
            Cliente: cliente.trim(),
            Correo: correo.trim().toLowerCase(),
            Telefono: telefono?.trim() || null,
            Productos: productos || [],
            Mensaje: mensaje?.trim() || null,
            Estado: "Pendiente",
          })
          .select()
          .single();

        if (error) throw error;
        return { ok: true, id: data.idCotizaciones, message: "Cotización registrada con éxito en Supabase" };
      } catch (err) {
        console.warn("Error guardando cotización en Supabase:", err);
      }
    }

    const quotes = getStoredLocalQuotes();
    const nueva = {
      id: Date.now(),
      idCotizaciones: Date.now(),
      Cliente: cliente,
      Correo: correo,
      Telefono: telefono,
      Productos: productos,
      Estado: "Pendiente",
      Fecha: new Date().toLocaleDateString(),
    };
    quotes.unshift(nueva);
    saveStoredLocalQuotes(quotes);
    return { ok: true, id: nueva.id };
  },

  // Obtener cotizaciones (Admin)
  async obtenerCotizaciones() {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("Cotizaciones")
          .select("*")
          .order("Fecha", { ascending: false });

        if (!error && data) {
          return data.map((c) => ({
            id: c.idCotizaciones,
            idCotizaciones: c.idCotizaciones,
            Cliente: c.Cliente,
            Correo: c.Correo,
            Telefono: c.Telefono,
            Productos: c.Productos,
            Estado: c.Estado,
            Fecha: new Date(c.Fecha).toLocaleDateString(),
          }));
        }
      } catch (e) {
        console.warn("Error obteniendo cotizaciones de Supabase:", e);
      }
    }

    return getStoredLocalQuotes();
  },

  // Actualizar estado de cotización (Admin)
  async actualizarEstadoCotizacion(id, estado) {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from("Cotizaciones")
          .update({ Estado: estado })
          .eq("idCotizaciones", id);
        if (!error) return { ok: true };
      } catch (e) {
        console.warn("Error actualizando cotización en Supabase:", e);
      }
    }

    const quotes = getStoredLocalQuotes();
    const item = quotes.find((q) => q.id === id || q.idCotizaciones === id);
    if (item) {
      item.Estado = estado;
      saveStoredLocalQuotes(quotes);
    }
    return { ok: true };
  },
};
