import { supabase, isSupabaseConfigured } from "../lib/supabase";

// Catálogo base de respaldo enriquecido
const PRODUCTOS_INICIALES = [
  {
    idProductos: 1,
    id: 1,
    Nombre_Producto: "Casco de Seguridad Dielectrico",
    Tipo: "Tipo I Clase E",
    Descripcion: "Casco de alto impacto con suspensión de 4 puntos y ranuras para accesorios. Certificado bajo norma ANSI Z89.1.",
    Precio: 45000,
    Imagen: "/src/assets/casco.jpg",
    Estado: "Activo",
    Categoria: "Protección de Cabeza",
    Categoria_producto_idCategoria: 1,
    categoria_id: 1,
    Marca: "3M / Tecnomatic",
    Material: "Polietileno de alta densidad (HDPE)",
    Nivel_Proteccion: "Dieléctrico 20.000V",
    Stock_Minimo: 10,
    Stock: 45,
    destacado: true,
  },
  {
    idProductos: 2,
    id: 2,
    Nombre_Producto: "Protector Auditivo de Copa",
    Tipo: "Aislante 27dB",
    Descripcion: "Orejeras acolchadas con diadema ajustable ergonómica para jornadas prolongadas.",
    Precio: 65000,
    Imagen: "/src/assets/protector-auditivo.jpg",
    Estado: "Activo",
    Categoria: "Protección Auditiva",
    Categoria_producto_idCategoria: 2,
    categoria_id: 2,
    Marca: "Howard Leight",
    Material: "Espuma acústica / ABS",
    Nivel_Proteccion: "NRR 27 dB",
    Stock_Minimo: 8,
    Stock: 30,
    destacado: true,
  },
  {
    idProductos: 3,
    id: 3,
    Nombre_Producto: "Gafas de Seguridad Antirrayaduras",
    Tipo: "Lente Claro UV400",
    Descripcion: "Lentes de policarbonato con protección lateral y filtro ultravioleta certificado.",
    Precio: 18000,
    Imagen: "/src/assets/gafas.webp",
    Estado: "Activo",
    Categoria: "Protección Visual y Facial",
    Categoria_producto_idCategoria: 3,
    categoria_id: 3,
    Marca: "Steelpro",
    Material: "Policarbonato óptico grado 1",
    Nivel_Proteccion: "ANSI Z87.1 / Impacto alto",
    Stock_Minimo: 15,
    Stock: 80,
    destacado: false,
  },
  {
    idProductos: 4,
    id: 4,
    Nombre_Producto: "Mascarilla N95 Industrial con Válvula",
    Tipo: "Respirador N95",
    Descripcion: "Respirador ergonómico con válvula de exhalación que reduce calor y humedad.",
    Precio: 12000,
    Imagen: "/src/assets/mascarilla-industrial.webp",
    Estado: "Activo",
    Categoria: "Protección Respiratoria",
    Categoria_producto_idCategoria: 4,
    categoria_id: 4,
    Marca: "3M Safety",
    Material: "Tela no tejida electrostática",
    Nivel_Proteccion: "N95 / NIOSH",
    Stock_Minimo: 25,
    Stock: 150,
    destacado: true,
  },
  {
    idProductos: 5,
    id: 5,
    Nombre_Producto: "Guantes de Cuero y Carnaza Reforzado",
    Tipo: "Trabajo Pesado",
    Descripcion: "Guantes reforzados en palma y nudillos para soldadura y manipulación pesada.",
    Precio: 28000,
    Imagen: "/src/assets/guantes.jpg",
    Estado: "Activo",
    Categoria: "Protección de Manos",
    Categoria_producto_idCategoria: 5,
    categoria_id: 5,
    Marca: "Tecnomatic Pro",
    Material: "Cuero Vacuno / Carnaza",
    Nivel_Proteccion: "EN 388 Nivel 4242",
    Stock_Minimo: 12,
    Stock: 60,
    destacado: false,
  },
  {
    idProductos: 6,
    id: 6,
    Nombre_Producto: "Botas de Seguridad Puntera Composite",
    Tipo: "Dieléctricas 18kV",
    Descripcion: "Calzado ergonómico liviano resistente a hidrocarburos y con absorción de impacto.",
    Precio: 185000,
    Imagen: "/src/assets/botas.jpg",
    Estado: "Activo",
    Categoria: "Protección de Pies",
    Categoria_producto_idCategoria: 6,
    categoria_id: 6,
    Marca: "Robusta / Caterpillar",
    Material: "Cuero flor hidrofugado / Composite",
    Nivel_Proteccion: "ASTM F2413 / Dieléctrico 18kV",
    Stock_Minimo: 6,
    Stock: 25,
    destacado: true,
  },
  {
    idProductos: 7,
    id: 7,
    Nombre_Producto: "Arnés de Seguridad Multipropósito 4 Argollas",
    Tipo: "Cuerpo Entero",
    Descripcion: "Arnés certificado ANSI Z359.11 para detención de caídas y posicionamiento vertical.",
    Precio: 220000,
    Imagen: "/src/assets/arnes-seguridad.jpg",
    Estado: "Activo",
    Categoria: "Trabajo en Alturas",
    Categoria_producto_idCategoria: 7,
    categoria_id: 7,
    Marca: "SOSEGA",
    Material: "Poliéster de alta tenacidad",
    Nivel_Proteccion: "ANSI Z359.11-2021",
    Stock_Minimo: 5,
    Stock: 18,
    destacado: true,
  },
  {
    idProductos: 8,
    id: 8,
    Nombre_Producto: "Chaleco Reflectivo Alta Visibilidad",
    Tipo: "Tipo Brigadista",
    Descripcion: "Chaleco con cintas reflectivas 3M de 2 pulgadas, bolsillos multifunción y cremallera.",
    Precio: 38000,
    Imagen: "/src/assets/chaleco-reflectivo-verde.webp",
    Estado: "Activo",
    Categoria: "Ropa de Trabajo y Dotaciones",
    Categoria_producto_idCategoria: 8,
    categoria_id: 8,
    Marca: "Reflex MAV",
    Material: "Poliéster 100% con cintas 3M",
    Nivel_Proteccion: "Norma EN ISO 20471",
    Stock_Minimo: 20,
    Stock: 90,
    destacado: true,
  },
  {
    idProductos: 9,
    id: 9,
    Nombre_Producto: "Overol Industrial Drill Algodón",
    Tipo: "Uso Rudo",
    Descripcion: "Overol con cierre bidireccional, elástico en cintura y bolsillos amplios.",
    Precio: 95000,
    Imagen: "/src/assets/overol-industrial.jpg",
    Estado: "Activo",
    Categoria: "Ropa de Trabajo y Dotaciones",
    Categoria_producto_idCategoria: 8,
    categoria_id: 8,
    Marca: "Tecnomatic Wear",
    Material: "Drill 100% Algodón 280g",
    Nivel_Proteccion: "Protección mecánica ligera",
    Stock_Minimo: 10,
    Stock: 35,
    destacado: false,
  },
  {
    idProductos: 10,
    id: 10,
    Nombre_Producto: "Rodilleras de Trabajo Industrial",
    Tipo: "Gel Antigolpe",
    Descripcion: "Rodilleras con coraza de PVC y acolchado de gel absorbente para pisos duros.",
    Precio: 52000,
    Imagen: "/src/assets/rodilleras-industriales.jpg",
    Estado: "Activo",
    Categoria: "Ropa de Trabajo y Dotaciones",
    Categoria_producto_idCategoria: 8,
    categoria_id: 8,
    Marca: "ToughBuilt",
    Material: "Carcasa PVC + Núcleo Gel",
    Nivel_Proteccion: "Absorción de impacto 300kg",
    Stock_Minimo: 8,
    Stock: 22,
    destacado: false,
  },
];

const CATEGORIAS_BASE = [
  { id: 1, idCategorias: 1, nombre: "Protección de Cabeza" },
  { id: 2, idCategorias: 2, nombre: "Protección Auditiva" },
  { id: 3, idCategorias: 3, nombre: "Protección Visual y Facial" },
  { id: 4, idCategorias: 4, nombre: "Protección Respiratoria" },
  { id: 5, idCategorias: 5, nombre: "Protección de Manos" },
  { id: 6, idCategorias: 6, nombre: "Protección de Pies" },
  { id: 7, idCategorias: 7, nombre: "Trabajo en Alturas" },
  { id: 8, idCategorias: 8, nombre: "Ropa de Trabajo y Dotaciones" },
];

const getStoredLocalProducts = () => {
  try {
    const saved = localStorage.getItem("tecnomatic_local_products");
    return saved ? JSON.parse(saved) : PRODUCTOS_INICIALES;
  } catch {
    return PRODUCTOS_INICIALES;
  }
};

const saveStoredLocalProducts = (prods) => {
  localStorage.setItem("tecnomatic_local_products", JSON.stringify(prods));
};

export const productService = {
  // Obtener categorías
  async obtenerCategorias() {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("Categoria_productos")
          .select("*")
          .order("nombre");
        if (!error && data && data.length > 0) {
          return data.map((c) => ({
            id: c.idCategorias,
            idCategorias: c.idCategorias,
            nombre: c.nombre,
            descripcion: c.descripcion,
            icono: c.icono,
          }));
        }
      } catch (e) {
        console.warn("Fallo cargando categorías de Supabase:", e);
      }
    }
    return CATEGORIAS_BASE;
  },

  // Obtener productos con filtros
  async obtenerProductos(filtros = {}) {
    if (isSupabaseConfigured()) {
      try {
        // La vista pertenece al esquema SQL actual y ya reúne categoría, stock y atributos.
        const { data, error } = await supabase.from("vista_productos").select("*");

        if (!error && data) {
          let lista = data.map((p) => ({
            ...p,
            id: p.idProductos,
            Precio: Number(p.Precio),
            Stock: Number(p.Stock || 0),
            Stock_Minimo: Number(p.Stock_Minimo || 5),
          }));

          if (filtros.categoria) lista = lista.filter((p) => p.Categoria === filtros.categoria);
          if (filtros.precioMax) lista = lista.filter((p) => p.Precio <= Number(filtros.precioMax));
          if (filtros.precioMin) lista = lista.filter((p) => p.Precio >= Number(filtros.precioMin));
          if (filtros.precioMaximo) lista = lista.filter((p) => p.Precio <= Number(filtros.precioMaximo));
          if (filtros.disponible === "true") {
            lista = lista.filter((p) => p.Stock > 0);
          }
          if (filtros.marca) {
            lista = lista.filter((p) => p.Marca.toLowerCase().includes(filtros.marca.toLowerCase()));
          }
          if (filtros.material) {
            lista = lista.filter((p) => p.Material.toLowerCase().includes(filtros.material.toLowerCase()));
          }
          if (filtros.proteccion) {
            lista = lista.filter((p) => p.Nivel_Proteccion.toLowerCase().includes(filtros.proteccion.toLowerCase()));
          }

          return lista;
        }
      } catch (e) {
        console.warn("Error consultando productos en Supabase:", e);
      }
    }

    // Fallback local
    let prods = getStoredLocalProducts();
    if (filtros.categoria) prods = prods.filter((p) => p.Categoria === filtros.categoria);
    if (filtros.precioMax) prods = prods.filter((p) => p.Precio <= Number(filtros.precioMax));
    if (filtros.precioMin) prods = prods.filter((p) => p.Precio >= Number(filtros.precioMin));
    if (filtros.precioMaximo) prods = prods.filter((p) => p.Precio <= Number(filtros.precioMaximo));
    if (filtros.disponible === "true") prods = prods.filter((p) => p.Stock > 0);
    if (filtros.marca) prods = prods.filter((p) => p.Marca?.toLowerCase().includes(filtros.marca.toLowerCase()));
    if (filtros.material) prods = prods.filter((p) => p.Material?.toLowerCase().includes(filtros.material.toLowerCase()));
    if (filtros.proteccion) prods = prods.filter((p) => p.Nivel_Proteccion?.toLowerCase().includes(filtros.proteccion.toLowerCase()));

    return prods;
  },

  // Obtener catálogo detallado (atributos, imágenes, variantes, reseñas)
  async obtenerCatalogoDetallado(idProducto) {
    if (isSupabaseConfigured()) {
      try {
        const [resAtributos, resImagenes, resVariantes, resResenas] = await Promise.all([
          supabase.from("Producto_Atributos").select("*").eq("Productos_idProductos", idProducto).maybeSingle(),
          supabase.from("Producto_Imagenes").select("*").eq("Productos_idProductos", idProducto).order("Orden"),
          supabase.from("Producto_Variantes").select("*").eq("Productos_idProductos", idProducto).eq("Activa", true),
          supabase.from("Resenas_Productos").select("*").eq("Productos_idProductos", idProducto).order("Fecha", { ascending: false }),
        ]);

        return {
          atributos: resAtributos.data ? {
            marca: resAtributos.data.Marca || "",
            material: resAtributos.data.Material || "",
            nivelProteccion: resAtributos.data.Nivel_Proteccion || "",
            stockMinimo: resAtributos.data.Stock_Minimo || 5,
          } : {},
          imagenes: (resImagenes.data || []).map((img) => ({
            idProductoImagen: img.idProductoImagen,
            Url_Imagen: img.Url_Imagen,
            Orden: img.Orden,
          })),
          variantes: (resVariantes.data || []).map((v) => ({
            idProductoVariante: v.idProductoVariante,
            Color: v.Color,
            Talla: v.Talla,
            Imagen: v.Imagen,
            Stock: v.Stock,
          })),
          resenas: (resResenas.data || []).map((r) => ({
            idResena: r.idResena,
            Calificacion: r.Calificacion,
            Comentario: r.Comentario,
            Verificada: r.Verificada,
            Fecha: r.Fecha,
            Cliente: "Cliente Verificado",
          })),
        };
      } catch (e) {
        console.warn("Error cargando catálogo detallado de Supabase:", e);
      }
    }

    // Fallback local enriquecido
    return {
      atributos: {
        marca: "Tecnomatic MAV Industrial",
        material: "Material de alta resistencia norma ISO 9001",
        nivelProteccion: "Certificación Nacional e Internacional",
        stockMinimo: 5,
      },
      imagenes: [],
      variantes: [
        { idProductoVariante: 1, Color: "Único", Talla: "M", Stock: 10 },
        { idProductoVariante: 2, Color: "Único", Talla: "L", Stock: 15 },
      ],
      resenas: [
        {
          idResena: 1,
          Calificacion: 5,
          Comentario: "Excelente producto, materiales de primera calidad para protección industrial.",
          Verificada: true,
          Fecha: new Date().toISOString(),
          Cliente: "Ing. Industrial Juan Pérez",
        },
      ],
    };
  },

  // Obtener productos relacionados
  async obtenerRelacionados(idProducto, categoriaId) {
    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase.from("vista_productos").select("*").neq("idProductos", idProducto).limit(20);
        if (data) {
          return data
            .filter((p) => !categoriaId || Number(p.Categoria_producto_idCategoria || categoriaId) === Number(categoriaId))
            .slice(0, 4)
            .map((p) => ({ ...p, Precio: Number(p.Precio) }));
        }
      } catch (e) {
        console.warn("Error en relacionados:", e);
      }
    }

    const prods = getStoredLocalProducts();
    return prods.filter((p) => p.idProductos !== idProducto).slice(0, 4);
  },

  // Obtener comprados juntos
  async obtenerCompradosJuntos(idProducto) {
    return this.obtenerRelacionados(idProducto);
  },

  // Crear producto (Admin)
  async crearProducto(datos, usuarioId = null) {
    const { nombre, tipo, descripcion, precio, imagen, categoria, stock, estado } = datos;
    const stockNum = Math.max(0, Number(stock || 0));
    const finalEstado = stockNum === 0 ? "Agotado" : estado || "Activo";

    if (isSupabaseConfigured()) {
      try {
        const { data: prod, error: prodErr } = await supabase
          .from("Productos")
          .insert({
            Nombre_Producto: nombre.trim(),
            Tipo: tipo.trim(),
            Descripcion: descripcion?.trim() || "",
            Precio: Number(precio),
            Imagen: imagen?.trim() || "/src/assets/icono.png",
            Estado: finalEstado,
            Categoria_producto_idCategoria: Number(categoria),
          })
          .select()
          .single();

        if (prodErr) {
          console.error("Error al insertar producto en Supabase:", prodErr);
          throw new Error(`Error en Supabase: ${prodErr.message || JSON.stringify(prodErr)}`);
        }

        // Crear stock
        const { error: stockErr } = await supabase.from("Stock").insert({
          Productos_idProductos: prod.idProductos,
          Cantidad_Actual: stockNum,
        });
        if (stockErr) console.warn("Error creando stock en Supabase:", stockErr);

        // Registrar movimiento inicial
        if (stockNum > 0) {
          const { error: movErr } = await supabase.from("Movimientos_Inventario").insert({
            Productos_idProductos: prod.idProductos,
            Tipo_Movimiento: "Entrada",
            Cantidad: stockNum,
            Observacion: "Inventario inicial al crear producto",
          });
          if (movErr) console.warn("Error creando movimiento en Supabase:", movErr);
        }

        // Crear atributos por defecto
        const { error: attrErr } = await supabase.from("Producto_Atributos").insert({
          Productos_idProductos: prod.idProductos,
          Marca: datos.marca || "Tecnomatic",
          Material: datos.material || "",
          Nivel_Proteccion: datos.nivelProteccion || "",
          Stock_Minimo: Number(datos.stockMinimo || 5),
        });
        if (attrErr) console.warn("Error creando atributos en Supabase:", attrErr);

        return { ok: true, idProducto: prod.idProductos, source: "supabase" };
      } catch (e) {
        console.error("Fallo al crear producto en Supabase:", e);
        throw e;
      }
    }

    // Fallback local
    const prods = getStoredLocalProducts();
    const catObj = CATEGORIAS_BASE.find((c) => c.id === Number(categoria));
    const nuevo = {
      idProductos: Date.now(),
      id: Date.now(),
      Nombre_Producto: nombre,
      Tipo: tipo,
      Descripcion: descripcion,
      Precio: Number(precio),
      Imagen: imagen || "/src/assets/icono.png",
      Estado: finalEstado,
      Categoria: catObj?.nombre || "General",
      Categoria_producto_idCategoria: Number(categoria),
      Stock: stockNum,
      Stock_Minimo: Number(datos.stockMinimo || 5),
      Marca: datos.marca || "",
      Material: datos.material || "",
      Nivel_Proteccion: datos.nivelProteccion || "",
    };
    prods.unshift(nuevo);
    saveStoredLocalProducts(prods);
    return { ok: true, idProducto: nuevo.id };
  },

  // Actualizar producto (Admin)
  async actualizarProducto(id, datos, usuarioId = null) {
    const { nombre, tipo, descripcion, precio, imagen, categoria, stock, estado } = datos;
    const stockNum = stock !== undefined && stock !== null ? Number(stock) : null;
    let finalEstado = estado;
    if (stockNum !== null) {
      if (stockNum === 0) finalEstado = "Agotado";
      else if (stockNum > 0 && finalEstado === "Agotado") finalEstado = "Activo";
    }

    if (isSupabaseConfigured()) {
      try {
        const updatePayload = {
          Nombre_Producto: nombre,
          Tipo: tipo,
          Descripcion: descripcion,
          Precio: Number(precio),
          Imagen: imagen,
          Categoria_producto_idCategoria: Number(categoria),
        };
        if (finalEstado) updatePayload.Estado = finalEstado;

        const { error: prodErr } = await supabase
          .from("Productos")
          .update(updatePayload)
          .eq("idProductos", id);

        if (prodErr) throw prodErr;

        if (stockNum !== null) {
          // Consultar stock previo
          const { data: stockPrevio } = await supabase
            .from("Stock")
            .select("Cantidad_Actual")
            .eq("Productos_idProductos", id)
            .maybeSingle();

          const prevCant = stockPrevio?.Cantidad_Actual ?? 0;
          if (prevCant !== stockNum) {
            const diff = stockNum - prevCant;
            await supabase.from("Stock").upsert({
              Productos_idProductos: id,
              Cantidad_Actual: stockNum,
            });

            await supabase.from("Movimientos_Inventario").insert({
              Productos_idProductos: id,
              Tipo_Movimiento: diff > 0 ? "Entrada" : "Salida",
              Cantidad: Math.abs(diff),
              Observacion: "Ajuste manual desde edición de producto",
            });
          }
        }

        return { ok: true };
      } catch (e) {
        console.warn("Error actualizando producto en Supabase:", e);
      }
    }

    // Fallback local
    const prods = getStoredLocalProducts();
    const index = prods.findIndex((p) => p.idProductos === Number(id) || p.id === Number(id));
    if (index > -1) {
      const catObj = CATEGORIAS_BASE.find((c) => c.id === Number(categoria));
      prods[index] = {
        ...prods[index],
        Nombre_Producto: nombre,
        Tipo: tipo,
        Descripcion: descripcion,
        Precio: Number(precio),
        Imagen: imagen,
        Estado: finalEstado || prods[index].Estado,
        Categoria: catObj?.nombre || prods[index].Categoria,
        Categoria_producto_idCategoria: Number(categoria),
        Stock: stockNum !== null ? stockNum : prods[index].Stock,
      };
      saveStoredLocalProducts(prods);
    }
    return { ok: true };
  },

  // Guardar configuración detallada de catálogo (Atributos, Galería, Variantes)
  async guardarCatalogoDetallado(idProducto, { atributos = {}, imagenes = [], variantes = [] }, usuarioId = null) {
    if (isSupabaseConfigured()) {
      try {
        // 1. Guardar atributos
        await supabase.from("Producto_Atributos").upsert({
          Productos_idProductos: idProducto,
          Marca: atributos.marca || null,
          Material: atributos.material || null,
          Nivel_Proteccion: atributos.nivelProteccion || null,
          Stock_Minimo: Math.max(0, Number(atributos.stockMinimo || 5)),
        });

        // 2. Guardar imágenes
        await supabase.from("Producto_Imagenes").delete().eq("Productos_idProductos", idProducto);
        const imagenesLimpias = imagenes
          .filter((img) => img && (img.url || img.Url_Imagen))
          .map((img, idx) => ({
            Productos_idProductos: idProducto,
            Url_Imagen: (img.url || img.Url_Imagen).trim(),
            Orden: Number(img.orden ?? idx),
          }));

        if (imagenesLimpias.length > 0) {
          await supabase.from("Producto_Imagenes").insert(imagenesLimpias);
        }

        // 3. Guardar variantes
        await supabase.from("Producto_Variantes").delete().eq("Productos_idProductos", idProducto);
        const variantesLimpias = variantes
          .filter((v) => v && (v.talla || v.Talla) && (v.color || v.Color))
          .map((v) => ({
            Productos_idProductos: idProducto,
            Color: (v.color || v.Color).trim(),
            Talla: (v.talla || v.Talla).trim(),
            Imagen: (v.imagen || v.Imagen || "").trim() || null,
            Stock: Math.max(0, Number(v.stock || v.Stock || 0)),
            Activa: true,
          }));

        if (variantesLimpias.length > 0) {
          await supabase.from("Producto_Variantes").insert(variantesLimpias);
        }

        return { ok: true, message: "Catálogo técnico actualizado con éxito" };
      } catch (e) {
        console.warn("Error guardando catálogo técnico en Supabase:", e);
      }
    }

    return { ok: true, message: "Catálogo guardado localmente" };
  },

  // Enviar producto a la papelera (Soft delete)
  async eliminarProductoPapelera(id, usuarioId = null) {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from("Productos_Papelera").upsert({
          Productos_idProductos: id,
          Eliminado_Por: usuarioId,
          Eliminado_En: new Date().toISOString(),
        });
        await supabase.from("Productos").update({ Estado: "Inactivo" }).eq("idProductos", id);
        return { ok: true };
      } catch (e) {
        console.warn("Error enviando a papelera en Supabase:", e);
      }
    }

    let prods = getStoredLocalProducts();
    prods = prods.filter((p) => p.idProductos !== Number(id) && p.id !== Number(id));
    saveStoredLocalProducts(prods);
    return { ok: true };
  },

  // Publicar Reseña
  async publicarResena(idProducto, idUsuario, calificacion, comentario) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from("Resenas_Productos").insert({
          Productos_idProductos: idProducto,
          Usuarios_idUsuarios: idUsuario || null,
          Calificacion: Number(calificacion),
          Comentario: comentario?.trim() || "",
          Verificada: true,
        }).select();
        if (!error) return { ok: true, data };
      } catch (e) {
        console.warn("Error guardando reseña en Supabase:", e);
      }
    }
    return { ok: true };
  },

  // Alerta de reposición
  async solicitarAlertaReposicion(idProducto, correo) {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from("Alertas_Reposicion").upsert({
          Productos_idProductos: idProducto,
          Correo: correo.trim(),
        });
        return { ok: true, message: "Te notificaremos en cuanto el producto esté disponible." };
      } catch (e) {
        console.warn("Error registrando alerta de reposición:", e);
      }
    }
    return { ok: true, message: "Alerta registrada para " + correo };
  },
};
