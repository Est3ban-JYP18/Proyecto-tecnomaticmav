import { supabase, isSupabaseConfigured } from "../lib/supabase";

const getStoredLocalOrders = () => {
  try {
    const saved = localStorage.getItem("tecnomatic_local_orders");
    return saved ? JSON.parse(saved) : [
      {
        idFacturas: 101,
        id: 101,
        Fecha: new Date().toISOString(),
        Estado: "Preparando",
        Total: 275000,
        Usuarios_idUsuarios: "a0000000-0000-0000-0000-000000000003",
        Nombres: "Juan",
        Apellidos: "Pérez",
        Estado_Entrega: "En Proceso",
        detalles: [
          {
            idProductos: 1,
            Nombre_Producto: "Casco de Seguridad Dielectrico",
            Imagen: "/src/assets/casco.jpg",
            Cantidad: 2,
            Precio_Unitario: 45000,
          },
          {
            idProductos: 6,
            Nombre_Producto: "Botas de Seguridad Puntera Composite",
            Imagen: "/src/assets/botas.jpg",
            Cantidad: 1,
            Precio_Unitario: 185000,
          },
        ],
      },
    ];
  } catch {
    return [];
  }
};

const saveStoredLocalOrders = (orders) => {
  localStorage.setItem("tecnomatic_local_orders", JSON.stringify(orders));
};

export const orderService = {
  // Crear un nuevo pedido / factura completa
  async crearPedido({
    idUsuario,
    total,
    productos = [],
    datosEnvio = {},
    metodoPago = "Tarjeta / PSE",
    codigoCupon = null,
    descuento = 0,
  }) {
    if (isSupabaseConfigured()) {
      try {
        // 1. Crear factura
        const { data: factura, error: factErr } = await supabase
          .from("Facturas")
          .insert({
            Usuarios_idUsuarios: idUsuario,
            Total: Number(total),
            Estado: "Pendiente",
          })
          .select()
          .single();

        if (factErr) throw factErr;

        const idFactura = factura.idFacturas;

        // 2. Insertar Detalle_Facturas
        const detalles = productos.map((p) => ({
          Factura_idFactura: idFactura,
          Productos_idProductos: p.idProductos || p.id,
          Cantidad: Number(p.cantidad),
          Precio_Unitario: Number(p.Precio || p.precioUnitario || 0),
        }));

        const { error: detErr } = await supabase.from("Detalle_Facturas").insert(detalles);
        if (detErr) console.error("Error al insertar detalles de factura:", detErr);

        // 3. Crear Entrega / Tracking
        await supabase.from("Entregas").insert({
          Factura_idFactura: idFactura,
          Usuarios_idUsuarios: idUsuario,
          Estado_Entrega: "En Proceso",
          Observaciones: "Pedido registrado por el cliente en plataforma web.",
        });

        // 4. Descontar Stock y registrar movimientos
        for (const item of productos) {
          const prodId = item.idProductos || item.id;
          const cant = Number(item.cantidad);

          // Obtener stock actual
          const { data: stockData } = await supabase
            .from("Stock")
            .select("Cantidad_Actual")
            .eq("Productos_idProductos", prodId)
            .maybeSingle();

          if (stockData) {
            const nuevaCantidad = Math.max(0, stockData.Cantidad_Actual - cant);
            await supabase
              .from("Stock")
              .update({ Cantidad_Actual: nuevaCantidad })
              .eq("Productos_idProductos", prodId);

            if (nuevaCantidad === 0) {
              await supabase.from("Productos").update({ Estado: "Agotado" }).eq("idProductos", prodId);
            }
          }

          // Registrar movimiento de salida
          await supabase.from("Movimientos_Inventario").insert({
            Productos_idProductos: prodId,
            Tipo_Movimiento: "Salida",
            Cantidad: cant,
            Observacion: `Venta Factura #${idFactura}`,
          });
        }

        return { ok: true, idFactura, message: "Pedido creado con éxito en Supabase" };
      } catch (err) {
        console.warn("Error creando pedido en Supabase:", err);
      }
    }

    // Fallback local
    const orders = getStoredLocalOrders();
    const idFactura = Date.now();
    const nueva = {
      idFacturas: idFactura,
      id: idFactura,
      Fecha: new Date().toISOString(),
      Estado: "Pendiente",
      Total: Number(total),
      Usuarios_idUsuarios: idUsuario,
      Nombres: datosEnvio.nombres || "Cliente",
      Apellidos: datosEnvio.apellidos || "",
      Estado_Entrega: "En Proceso",
      datosEnvio,
      detalles: productos.map((p) => ({
        idProductos: p.idProductos || p.id,
        Nombre_Producto: p.Nombre_Producto,
        Imagen: p.Imagen,
        Cantidad: p.cantidad,
        Precio_Unitario: p.Precio,
        Talla: p.Talla || "M",
        Color: p.Color || "Único",
      })),
    };

    orders.unshift(nueva);
    saveStoredLocalOrders(orders);
    return { ok: true, idFactura };
  },

  // Obtener pedidos del cliente
  async obtenerMisPedidos(idUsuario) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("Facturas")
          .select("*")
          .eq("Usuarios_idUsuarios", idUsuario)
          .order("Fecha", { ascending: false });

        if (!error && data) {
          return data.map((f) => {
            return {
              idFacturas: f.idFacturas,
              id: f.idFacturas,
              Fecha: f.Fecha,
              Estado: f.Estado,
              Total: Number(f.Total),
              Estado_Entrega: "En Proceso",
              Transportadora: "Coordinadora",
              Numero_Guia: "En asignación",
              Observaciones: "",
            };
          });
        }
      } catch (e) {
        console.warn("Error cargando pedidos en Supabase:", e);
      }
    }

    const orders = getStoredLocalOrders();
    return orders.filter((o) => o.Usuarios_idUsuarios === idUsuario || !o.Usuarios_idUsuarios);
  },

  // Obtener detalle de pedido (artículos)
  async obtenerDetallePedido(idFactura) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("Detalle_Facturas")
          .select("*")
          .eq("Factura_idFactura", idFactura);

        if (!error && data) {
          const productIds = data.map((d) => d.Productos_idProductos);
          const { data: productos } = await supabase.from("Productos").select("*").in("idProductos", productIds);
          const productosPorId = new Map((productos || []).map((p) => [p.idProductos, p]));
          return data.map((d) => {
            const producto = productosPorId.get(d.Productos_idProductos);
            return {
              idProductos: d.Productos_idProductos,
              Nombre_Producto: producto?.Nombre_Producto || "Producto",
              Imagen: producto?.Imagen || "/src/assets/icono.png",
              Tipo: producto?.Tipo || "",
              Cantidad: d.Cantidad,
              Precio_Unitario: Number(d.Precio_Unitario),
              Talla: "Única",
              Color: "Único",
            };
          });
        }
      } catch (e) {
        console.warn("Error obteniendo detalles del pedido en Supabase:", e);
      }
    }

    const orders = getStoredLocalOrders();
    const order = orders.find((o) => o.idFacturas === Number(idFactura) || o.id === Number(idFactura));
    return order?.detalles || [];
  },

  // Obtener estado de seguimiento y entrega
  async obtenerSeguimiento(idFactura) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("Entregas")
          .select("*")
          .eq("Factura_idFactura", idFactura)
          .maybeSingle();

        if (!error && data) {
          return {
            idEntregas: data.idEntregas,
            Fecha_entrega: data.Fecha_entrega,
            Estado_Entrega: data.Estado_Entrega,
            Observaciones: data.Observaciones,
            Transportadora: "Coordinadora Mercantil",
            Numero_Guia: "En asignación",
            EstadoFactura: "Pendiente",
          };
        }
      } catch (e) {
        console.warn("Error en seguimiento Supabase:", e);
      }
    }

    return {
      idEntregas: 1,
      Fecha_entrega: new Date().toLocaleDateString(),
      Estado_Entrega: "En Proceso",
      Observaciones: "El pedido está siendo alistado en bodega central de Tecnomatic MAV.",
      Transportadora: "Coordinadora Mercantil",
      Numero_Guia: "GUIA-87439201",
      EstadoFactura: "Preparando",
    };
  },

  // Obtener todas las facturas (Admin)
  async obtenerTodasLasFacturas() {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("Facturas")
          .select("*")
          .order("Fecha", { ascending: false });

        if (!error && data) {
          return data.map((f) => ({
            idFacturas: f.idFacturas,
            id: f.idFacturas,
            Fecha: f.Fecha,
            Estado: f.Estado,
            Total: Number(f.Total),
            Usuarios_idUsuarios: f.Usuarios_idUsuarios,
            Nombres: "Cliente",
            Apellidos: "",
            Correo: "",
            Telefono: "",
            Metodo_Pago: "",
          }));
        }
      } catch (e) {
        console.warn("Error obteniendo facturas en Supabase:", e);
      }
    }

    return getStoredLocalOrders();
  },

  // Actualizar estado de factura (Admin)
  async actualizarEstadoFactura(idFactura, estado) {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from("Facturas")
          .update({ Estado: estado })
          .eq("idFacturas", idFactura);

        if (!error) {
          // Si el estado de factura pasa a Enviado o Entregado, sincronizar entrega
          let nuevoEstadoEntrega = "En Proceso";
          if (estado === "Enviado") nuevoEstadoEntrega = "En Camino";
          if (estado === "Entregado") nuevoEstadoEntrega = "Entregado";
          if (estado === "Cancelado") nuevoEstadoEntrega = "Cancelado";

          await supabase
            .from("Entregas")
            .update({ Estado_Entrega: nuevoEstadoEntrega })
            .eq("Factura_idFactura", idFactura);

          return { ok: true };
        }
      } catch (e) {
        console.warn("Error actualizando estado en Supabase:", e);
      }
    }

    const orders = getStoredLocalOrders();
    const idx = orders.findIndex((o) => o.idFacturas === Number(idFactura) || o.id === Number(idFactura));
    if (idx > -1) {
      orders[idx].Estado = estado;
      saveStoredLocalOrders(orders);
    }
    return { ok: true };
  },

  // Eliminar pedido / Factura (Admin)
  async eliminarFactura(idFactura) {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from("Facturas").delete().eq("idFacturas", idFactura);
        if (!error) return { ok: true };
      } catch (e) {
        console.warn("Error eliminando factura en Supabase:", e);
      }
    }

    let orders = getStoredLocalOrders();
    orders = orders.filter((o) => o.idFacturas !== Number(idFactura) && o.id !== Number(idFactura));
    saveStoredLocalOrders(orders);
    return { ok: true };
  },
};
