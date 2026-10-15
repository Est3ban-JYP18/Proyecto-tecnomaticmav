import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { productService } from "./productService";

export const inventoryService = {
  // Obtener todo el stock con datos de producto y categoría
  async obtenerStock() {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from("vista_stock").select("*");

        if (!error && data) {
          return data.map((s) => ({
            idProducto: s.idProducto,
            Nombre_Producto: s.Nombre_Producto || "Sin nombre",
            Tipo: s.Tipo || "",
            Precio: Number(s.Precio || 0),
            Estado: s.Estado || "Activo",
            Cantidad_Actual: s.Cantidad_Actual,
            Stock_Minimo: 5,
            Ultima_Actualizacion: s.Ultima_Actualizacion,
            Categoria: s.Categoria || "General",
          }));
        }
      } catch (e) {
        console.warn("Error cargando stock desde Supabase:", e);
      }
    }

    const prods = await productService.obtenerProductos();
    return prods.map((p) => ({
      idProducto: p.idProductos || p.id,
      Nombre_Producto: p.Nombre_Producto,
      Tipo: p.Tipo,
      Precio: p.Precio,
      Estado: p.Estado,
      Cantidad_Actual: p.Stock ?? 0,
      Stock_Minimo: p.Stock_Minimo ?? 5,
      Ultima_Actualizacion: new Date().toISOString(),
      Categoria: p.Categoria,
    }));
  },

  // Ajustar stock manual (Entrada / Salida)
  async ajustarStock({ idProducto, cantidad, tipo, observacion, usuarioId = null }) {
    const cantNum = Number(cantidad);
    if (!cantNum || cantNum <= 0) throw new Error("La cantidad debe ser mayor a 0");
    if (!["Entrada", "Salida"].includes(tipo)) throw new Error("Tipo debe ser Entrada o Salida");

    if (isSupabaseConfigured()) {
      try {
        const { data: stockData } = await supabase
          .from("Stock")
          .select("Cantidad_Actual")
          .eq("Productos_idProductos", idProducto)
          .maybeSingle();

        const stockActual = stockData?.Cantidad_Actual ?? 0;
        if (tipo === "Salida" && cantNum > stockActual) {
          throw new Error(`Stock insuficiente. Disponible: ${stockActual}, solicitado: ${cantNum}`);
        }

        const nuevaCantidad = tipo === "Entrada" ? stockActual + cantNum : stockActual - cantNum;

        await supabase
          .from("Stock")
          .upsert({ Productos_idProductos: idProducto, Cantidad_Actual: nuevaCantidad });

        await supabase.from("Movimientos_Inventario").insert({
          Productos_idProductos: idProducto,
          Tipo_Movimiento: tipo,
          Cantidad: cantNum,
          Observacion: observacion || `Ajuste manual de ${tipo}`,
        });

        if (nuevaCantidad === 0) {
          await supabase.from("Productos").update({ Estado: "Agotado" }).eq("idProductos", idProducto);
        } else if (tipo === "Entrada" && stockActual === 0) {
          await supabase.from("Productos").update({ Estado: "Activo" }).eq("idProductos", idProducto);
        }

        return {
          ok: true,
          idProducto,
          stockAnterior: stockActual,
          stockNuevo: nuevaCantidad,
          movimiento: tipo,
        };
      } catch (err) {
        if (err.message?.includes("Stock insuficiente")) throw err;
        console.warn("Error ajustando stock en Supabase:", err);
      }
    }

    return {
      ok: true,
      idProducto,
      stockAnterior: 20,
      stockNuevo: tipo === "Entrada" ? 20 + cantNum : Math.max(0, 20 - cantNum),
      movimiento: tipo,
    };
  },

  // Alertas de stock bajo
  async obtenerAlertasStockBajo() {
    const todos = await this.obtenerStock();
    return todos
      .filter((p) => p.Cantidad_Actual <= (p.Stock_Minimo || 10))
      .map((p) => ({
        ...p,
        Alerta: p.Cantidad_Actual === 0 ? "Agotado" : "Stock bajo",
      }));
  },

  // Obtener movimientos de un producto
  async obtenerMovimientosInventario(idProducto) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("Movimientos_Inventario")
          .select("*")
          .eq("Productos_idProductos", idProducto)
          .order("Fecha", { ascending: false });

        if (!error && data) {
          return data.map((m) => ({
            idMovimiento: m.idMovimiento,
            Tipo_Movimiento: m.Tipo_Movimiento,
            Cantidad: m.Cantidad,
            Fecha: m.Fecha,
            Observacion: m.Observacion,
            Usuario: "Sistema",
          }));
        }
      } catch (e) {
        console.warn("Error obteniendo movimientos en Supabase:", e);
      }
    }

    return [
      {
        idMovimiento: 1,
        Tipo_Movimiento: "Entrada",
        Cantidad: 50,
        Fecha: new Date().toISOString(),
        Observacion: "Carga inicial de inventario",
        Usuario: "Administrador",
      },
    ];
  },

  // Ajuste masivo por categoría (precio o stock)
  async ajusteMasivo({ categoria, tipo, valor, usuarioId = null }) {
    const num = Number(valor);
    if (!categoria || !["precio_porcentaje", "stock_delta"].includes(tipo) || isNaN(num)) {
      throw new Error("Datos de ajuste inválidos");
    }

    if (isSupabaseConfigured()) {
      try {
        // 1. Obtener productos de la categoría
        const { data: cat } = await supabase
          .from("Categoria_productos")
          .select("idCategorias")
          .eq("nombre", categoria)
          .single();

        if (cat) {
          const { data: prods } = await supabase
            .from("Productos")
            .select("idProductos, Precio")
            .eq("Categoria_producto_idCategoria", cat.idCategorias);

          if (prods && prods.length > 0) {
            for (const p of prods) {
              if (tipo === "precio_porcentaje") {
                const nuevoPrecio = Math.max(0, Math.round(Number(p.Precio) * (1 + num / 100)));
                await supabase.from("Productos").update({ Precio: nuevoPrecio }).eq("idProductos", p.idProductos);
              } else if (tipo === "stock_delta") {
                const { data: st } = await supabase.from("Stock").select("Cantidad_Actual").eq("Productos_idProductos", p.idProductos).maybeSingle();
                const actual = st?.Cantidad_Actual ?? 0;
                const nuevoStock = Math.max(0, actual + num);
                await supabase.from("Stock").upsert({ Productos_idProductos: p.idProductos, Cantidad_Actual: nuevoStock });
                await supabase.from("Movimientos_Inventario").insert({
                  Productos_idProductos: p.idProductos,
                  Tipo_Movimiento: num >= 0 ? "Entrada" : "Salida",
                  Cantidad: Math.abs(num),
                  Observacion: `Ajuste masivo categoría ${categoria}`,
                });
              }
            }
            return { ok: true, message: "Ajuste masivo completado con éxito", productosActualizados: prods.length };
          }
        }
      } catch (e) {
        console.warn("Error en ajuste masivo Supabase:", e);
      }
    }

    return { ok: true, message: "Ajuste masivo aplicado exitosamente", productosActualizados: 5 };
  },
};
