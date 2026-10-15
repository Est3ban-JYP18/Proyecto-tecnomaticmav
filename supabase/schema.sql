-- ==============================================================================
-- TECNOMATIC MAV - SUPABASE POSTGRESQL SCHEMA COMPLETO
-- ==============================================================================

-- 1. Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabla de Roles
CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar roles por defecto
INSERT INTO public.roles (id, nombre_rol, descripcion) VALUES
    (1, 'admin', 'Administrador del sistema con control total'),
    (2, 'contador', 'Asesor y gestor de inventario/pedidos'),
    (3, 'cliente', 'Cliente final que realiza compras y solicitudes')
ON CONFLICT (id) DO UPDATE 
SET nombre_rol = EXCLUDED.nombre_rol, descripcion = EXCLUDED.descripcion;

-- 3. Tabla de Perfiles de Usuarios (Usuarios)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE, -- Referencia opcional a auth.users(id) de Supabase Auth
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    contrasena TEXT,
    telefono VARCHAR(30),
    direccion TEXT,
    ciudad VARCHAR(80),
    avatar_url TEXT,
    rol_id INT NOT NULL DEFAULT 3 REFERENCES public.roles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Categorías de Productos
CREATE TABLE IF NOT EXISTS public.categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    icono VARCHAR(100),
    imagen TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de Productos
CREATE TABLE IF NOT EXISTS public.productos (
    id SERIAL PRIMARY KEY,
    nombre_producto VARCHAR(150) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(12, 2) NOT NULL CHECK (precio >= 0),
    imagen TEXT,
    estado VARCHAR(30) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Disponible', 'Agotado', 'Inactivo')),
    categoria_id INT NOT NULL REFERENCES public.categorias(id) ON DELETE RESTRICT,
    destacado BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabla de Atributos Técnicos del Producto
CREATE TABLE IF NOT EXISTS public.producto_atributos (
    producto_id INT PRIMARY KEY REFERENCES public.productos(id) ON DELETE CASCADE,
    marca VARCHAR(100),
    material VARCHAR(150),
    nivel_proteccion VARCHAR(150),
    stock_minimo INT NOT NULL DEFAULT 5,
    especificaciones JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Galería de Imágenes Adicionales
CREATE TABLE IF NOT EXISTS public.producto_imagenes (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    url_imagen TEXT NOT NULL,
    orden INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Variantes de Producto (Tallas, Colores, Stock por variante)
CREATE TABLE IF NOT EXISTS public.producto_variantes (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    color VARCHAR(80) NOT NULL DEFAULT 'Único',
    talla VARCHAR(20) NOT NULL DEFAULT 'Única',
    imagen TEXT,
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    activa BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_variante_color_talla UNIQUE (producto_id, color, talla)
);

-- 9. Stock General del Producto
CREATE TABLE IF NOT EXISTS public.stock (
    producto_id INT PRIMARY KEY REFERENCES public.productos(id) ON DELETE CASCADE,
    cantidad_actual INT NOT NULL DEFAULT 0 CHECK (cantidad_actual >= 0),
    ultima_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Movimientos de Inventario (Kárdex)
CREATE TABLE IF NOT EXISTS public.movimientos_inventario (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('Entrada', 'Salida', 'Ajuste')),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    observacion TEXT,
    fecha TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Cupones de Descuento
CREATE TABLE IF NOT EXISTS public.cupones (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(40) NOT NULL UNIQUE,
    tipo VARCHAR(20) NOT NULL DEFAULT 'porcentaje' CHECK (tipo IN ('porcentaje', 'fijo')),
    valor NUMERIC(12, 2) NOT NULL CHECK (valor > 0),
    minimo_compra NUMERIC(12, 2) NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT true,
    fecha_inicio DATE,
    fecha_fin DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Facturas / Pedidos
CREATE TABLE IF NOT EXISTS public.facturas (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    fecha TIMESTAMPTZ DEFAULT NOW(),
    total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
    estado VARCHAR(30) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Preparando', 'Enviado', 'Entregado', 'Cancelado')),
    metodo_pago VARCHAR(50) DEFAULT 'Tarjeta / PSE / Efectivo',
    descuento NUMERIC(12, 2) DEFAULT 0,
    codigo_cupon VARCHAR(40),
    datos_envio JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Detalle de Facturas
CREATE TABLE IF NOT EXISTS public.detalle_facturas (
    id SERIAL PRIMARY KEY,
    factura_id INT NOT NULL REFERENCES public.facturas(id) ON DELETE CASCADE,
    producto_id INT NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12, 2) NOT NULL CHECK (precio_unitario >= 0),
    talla VARCHAR(20) DEFAULT 'M',
    color VARCHAR(80) DEFAULT 'Único'
);

-- 14. Entregas y Seguimiento (Tracking)
CREATE TABLE IF NOT EXISTS public.entregas (
    id SERIAL PRIMARY KEY,
    factura_id INT NOT NULL REFERENCES public.facturas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    fecha_entrega DATE DEFAULT CURRENT_DATE,
    estado_entrega VARCHAR(50) NOT NULL DEFAULT 'En Proceso' CHECK (estado_entrega IN ('En Proceso', 'En Camino', 'Entregado', 'Reprogramado', 'Cancelado')),
    observaciones TEXT,
    transportadora VARCHAR(100) DEFAULT 'Coordinadora / Servientrega',
    numero_guia VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Devoluciones
CREATE TABLE IF NOT EXISTS public.devoluciones (
    id SERIAL PRIMARY KEY,
    factura_id INT NOT NULL REFERENCES public.facturas(id) ON DELETE CASCADE,
    producto_id INT NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    motivo TEXT NOT NULL,
    motivo_categoria VARCHAR(100),
    metodo_reembolso VARCHAR(80),
    metodo_retorno VARCHAR(80),
    direccion_retorno TEXT,
    evidencia_url TEXT,
    estado VARCHAR(30) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Aprobada', 'Rechazada')),
    estado_tracking VARCHAR(50) NOT NULL DEFAULT 'Solicitada' CHECK (estado_tracking IN ('Solicitada', 'En Revision', 'Aprobada', 'Producto Recibido', 'Resuelta', 'Rechazada')),
    comentarios_admin TEXT,
    codigo_cupon VARCHAR(50),
    fecha TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Reseñas y Calificaciones de Productos
CREATE TABLE IF NOT EXISTS public.resenas_productos (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    calificacion SMALLINT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    comentario TEXT,
    verificada BOOLEAN NOT NULL DEFAULT false,
    fecha TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Alertas de Reposición de Stock
CREATE TABLE IF NOT EXISTS public.alertas_reposicion (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    correo VARCHAR(150) NOT NULL,
    creada_en TIMESTAMPTZ DEFAULT NOW(),
    notificada_en TIMESTAMPTZ,
    CONSTRAINT uq_alerta_producto_correo UNIQUE (producto_id, correo)
);

-- 18. Papelera de Productos (Soft Delete)
CREATE TABLE IF NOT EXISTS public.productos_papelera (
    producto_id INT PRIMARY KEY REFERENCES public.productos(id) ON DELETE CASCADE,
    eliminado_en TIMESTAMPTZ DEFAULT NOW(),
    eliminado_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL
);

-- 19. Auditoría de Productos
CREATE TABLE IF NOT EXISTS public.auditoria_productos (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    accion VARCHAR(80) NOT NULL,
    detalle TEXT,
    creada_en TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Cotizaciones Industriales
CREATE TABLE IF NOT EXISTS public.cotizaciones (
    id SERIAL PRIMARY KEY,
    cliente VARCHAR(150) NOT NULL,
    correo VARCHAR(150) NOT NULL,
    telefono VARCHAR(50),
    productos JSONB NOT NULL DEFAULT '[]'::jsonb,
    mensaje TEXT,
    estado VARCHAR(30) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Cotizado', 'Enviado', 'Cerrado', 'Rechazado')),
    total_estimado NUMERIC(12, 2) DEFAULT 0,
    fecha TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- POLÍTICAS DE SEGURIDAD RLS (Row Level Security)
-- ==============================================================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producto_atributos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producto_imagenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producto_variantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devoluciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resenas_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_reposicion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos_papelera ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura publica de roles" ON public.roles FOR SELECT USING (true);
CREATE POLICY "Permitir acceso completo a usuarios" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir lectura publica de categorias" ON public.categorias FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de productos" ON public.productos FOR SELECT USING (true);
CREATE POLICY "Permitir gestion de productos" ON public.productos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir lectura de atributos" ON public.producto_atributos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir imagenes" ON public.producto_imagenes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir variantes" ON public.producto_variantes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir stock" ON public.stock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir movimientos" ON public.movimientos_inventario FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir cupones" ON public.cupones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir facturas" ON public.facturas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir detalle facturas" ON public.detalle_facturas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir entregas" ON public.entregas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir devoluciones" ON public.devoluciones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir resenas" ON public.resenas_productos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir alertas" ON public.alertas_reposicion FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir papelera" ON public.productos_papelera FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir auditoria" ON public.auditoria_productos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir cotizaciones" ON public.cotizaciones FOR ALL USING (true) WITH CHECK (true);
