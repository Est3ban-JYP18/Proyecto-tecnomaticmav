-- ==============================================================================
-- TECNOMATIC MAV - SEED DATA PARA SUPABASE
-- ==============================================================================

-- 1. Categorías
INSERT INTO public.categorias (id, nombre, descripcion, icono) VALUES
    (1, 'Protección de Cabeza', 'Cascos de seguridad tipo I y II, visores y barbuquejos de alta resistencia', 'ShieldAlert'),
    (2, 'Protección Auditiva', 'Protectores auditivos de copa y de inserción para entornos ruidosos', 'Volume2'),
    (3, 'Protección Visual y Facial', 'Gafas de seguridad antivaho y caretas para soldadura y esmerilado', 'Eye'),
    (4, 'Protección Respiratoria', 'Mascarillas y respiradores para material particulado, polvos y vapores', 'Wind'),
    (5, 'Protección de Manos', 'Guantes de nitrilo, cuero, carnaza y anticorte de alta durabilidad', 'Hand'),
    (6, 'Protección de Pies', 'Botas de seguridad con puntera de acero o composite dieléctricas', 'Footprints'),
    (7, 'Trabajo en Alturas', 'Arneses de cuerpo entero, eslingas de posicionamiento y líneas de vida', 'Anchor'),
    (8, 'Ropa de Trabajo y Dotaciones', 'Chalecos reflectivos, overoles, pantalones y chaquetas industriales', 'Shirt')
ON CONFLICT (id) DO UPDATE 
SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion, icono = EXCLUDED.icono;

-- 2. Productos Iniciales
INSERT INTO public.productos (id, nombre_producto, tipo, descripcion, precio, imagen, estado, categoria_id, destacado) VALUES
    (1, 'Casco de Seguridad Dielectrico', 'Tipo I Clase E', 'Casco de alto impacto con suspensión de 4 puntos y ranuras para accesorios. Certificado ANSI Z89.1.', 45000, '/src/assets/casco.jpg', 'Activo', 1, true),
    (2, 'Protector Auditivo de Copa', 'Aislante 27dB', 'Orejeras acolchadas con diadema ajustable ergonómica para jornadas prolongadas.', 65000, '/src/assets/protector-auditivo.jpg', 'Activo', 2, true),
    (3, 'Gafas de Seguridad Antirrayaduras', 'Lente Claro UV400', 'Lentes de policarbonato con protección lateral y filtro ultravioleta certificado.', 18000, '/src/assets/gafas.webp', 'Activo', 3, false),
    (4, 'Mascarilla N95 Industrial con Válvula', 'Respirador N95', 'Respirador ergonómico con válvula de exhalación que reduce calor y humedad.', 12000, '/src/assets/mascarilla-industrial.webp', 'Activo', 4, true),
    (5, 'Guantes de Cuero y Carnaza Reforzado', 'Trabajo Pesado', 'Guantes reforzados en palma y nudillos para soldadura y manipulación pesada.', 28000, '/src/assets/guantes.jpg', 'Activo', 5, false),
    (6, 'Botas de Seguridad Puntera Composite', 'Dieléctricas 18kV', 'Calzado ergonómico liviano resistente a hidrocarburos y con absorción de impacto.', 185000, '/src/assets/botas.jpg', 'Activo', 6, true),
    (7, 'Arnés de Seguridad Multipropósito 4 Argollas', 'Cuerpo Entero', 'Arnés certificado ANSI Z359.11 para detención de caídas y posicionamiento vertical.', 220000, '/src/assets/arnes-seguridad.jpg', 'Activo', 7, true),
    (8, 'Chaleco Reflectivo Alta Visibilidad', 'Tipo Brigadista', 'Chaleco con cintas reflectivas 3M de 2 pulgadas, bolsillos multifunción y cremallera.', 38000, '/src/assets/chaleco-reflectivo-verde.webp', 'Activo', 8, true),
    (9, 'Overol Industrial Drill Algodón', 'Uso Rudo', 'Overol con cierre bidireccional, elástico en cintura y bolsillos amplios.', 95000, '/src/assets/overol-industrial.jpg', 'Activo', 8, false),
    (10, 'Rodilleras de Trabajo Industrial', 'Gel Antigolpe', 'Rodilleras con coraza de PVC y acolchado de gel absorbente para pisos duros.', 52000, '/src/assets/rodilleras-industriales.jpg', 'Activo', 8, false)
ON CONFLICT (id) DO UPDATE 
SET nombre_producto = EXCLUDED.nombre_producto, precio = EXCLUDED.precio, estado = EXCLUDED.estado;

-- 3. Atributos Técnicos
INSERT INTO public.producto_atributos (producto_id, marca, material, nivel_proteccion, stock_minimo) VALUES
    (1, '3M / Tecnomatic', 'Polietileno de alta densidad (HDPE)', 'Dieléctrico hasta 20.000V (ANSI Z89.1)', 10),
    (2, 'Howard Leight', 'Espuma acústica / ABS', 'NRR 27 dB', 8),
    (3, 'Steelpro', 'Policarbonato óptico grado 1', 'ANSI Z87.1 / Impacto alto', 15),
    (4, '3M Safety', 'Tela no tejida electrostática', 'N95 / NIOSH', 25),
    (5, 'Tecnomatic Pro', 'Cuero Vacuno / Carnaza', 'EN 388 Nivel 4242', 12),
    (6, 'Robusta / Caterpillar', 'Cuero flor hidrofugado / Composite', 'ASTM F2413 / Dieléctrico 18kV', 6),
    (7, 'SOSEGA', 'Poliéster de alta tenacidad', 'ANSI Z359.11-2021', 5),
    (8, 'Reflex MAV', 'Poliéster 100% con cintas 3M', 'Norma EN ISO 20471', 20),
    (9, 'Tecnomatic Wear', 'Drill 100% Algodón 280g', 'Protección mecánica ligera', 10),
    (10, 'ToughBuilt', 'Carcasa PVC + Núcleo Gel', 'Absorción de impacto 300kg', 8)
ON CONFLICT (producto_id) DO NOTHING;

-- 4. Stock General
INSERT INTO public.stock (producto_id, cantidad_actual) VALUES
    (1, 45),
    (2, 30),
    (3, 80),
    (4, 150),
    (5, 60),
    (6, 25),
    (7, 18),
    (8, 90),
    (9, 35),
    (10, 22)
ON CONFLICT (producto_id) DO UPDATE SET cantidad_actual = EXCLUDED.cantidad_actual;

-- 5. Variantes de Producto (Tallas / Colores)
INSERT INTO public.producto_variantes (producto_id, color, talla, stock, activa) VALUES
    (1, 'Blanco', 'Única', 20, true),
    (1, 'Amarillo', 'Única', 15, true),
    (1, 'Azul', 'Única', 10, true),
    (6, 'Café', '39', 5, true),
    (6, 'Café', '40', 8, true),
    (6, 'Café', '41', 7, true),
    (6, 'Café', '42', 5, true),
    (8, 'Verde Neón', 'M', 30, true),
    (8, 'Verde Neón', 'L', 35, true),
    (8, 'Naranja', 'L', 25, true),
    (9, 'Azul Marino', 'M', 15, true),
    (9, 'Azul Marino', 'L', 20, true)
ON CONFLICT DO NOTHING;

-- 6. Cupones de Descuento
INSERT INTO public.cupones (codigo, tipo, valor, minimo_compra, activo) VALUES
    ('TECNOMATIC10', 'porcentaje', 10, 50000, true),
    ('SEGURIDAD20', 'porcentaje', 20, 150000, true),
    ('BIENVENIDO', 'fijo', 15000, 80000, true),
    ('PROMOVIP', 'porcentaje', 15, 100000, true)
ON CONFLICT (codigo) DO NOTHING;

-- 7. Usuarios Demo / Base
INSERT INTO public.usuarios (id, nombres, apellidos, correo, contrasena, rol_id, telefono, ciudad) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Administrador', 'General', 'admin@tecnomaticmav.com', 'admin123', 1, '3001234567', 'Bogotá'),
    ('a0000000-0000-0000-0000-000000000002', 'Carlos', 'Contador', 'contador@tecnomaticmav.com', 'contador123', 2, '3109876543', 'Medellín'),
    ('a0000000-0000-0000-0000-000000000003', 'Juan', 'Pérez', 'cliente@tecnomaticmav.com', 'cliente123', 3, '3205556677', 'Cali')
ON CONFLICT (correo) DO NOTHING;

-- 8. Reseñas iniciales
INSERT INTO public.resenas_productos (producto_id, usuario_id, calificacion, comentario, verificada) VALUES
    (1, 'a0000000-0000-0000-0000-000000000003', 5, 'Excelente calidad de casco, muy liviano y con excelente ajuste.', true),
    (6, 'a0000000-0000-0000-0000-000000000003', 5, 'Las botas son comodísimas para trabajar 10 horas de pie y la puntera no pesa nada.', true),
    (8, 'a0000000-0000-0000-0000-000000000003', 4, 'El chaleco tiene muy buena visibilidad nocturna y múltiples bolsillos útiles.', true)
ON CONFLICT DO NOTHING;
