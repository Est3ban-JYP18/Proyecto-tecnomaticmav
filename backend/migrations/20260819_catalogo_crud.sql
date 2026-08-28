CREATE TABLE IF NOT EXISTS Producto_Atributos (
  Productos_idProductos INT NOT NULL PRIMARY KEY,
  Marca VARCHAR(100) NULL,
  Material VARCHAR(150) NULL,
  Nivel_Proteccion VARCHAR(150) NULL,
  Stock_Minimo INT NOT NULL DEFAULT 5,
  FOREIGN KEY (Productos_idProductos) REFERENCES Productos(idProductos) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Producto_Imagenes (
  idProductoImagen INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  Productos_idProductos INT NOT NULL,
  Url_Imagen VARCHAR(500) NOT NULL,
  Orden INT NOT NULL DEFAULT 0,
  FOREIGN KEY (Productos_idProductos) REFERENCES Productos(idProductos) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Producto_Variantes (
  idProductoVariante INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  Productos_idProductos INT NOT NULL,
  Color VARCHAR(80) NOT NULL DEFAULT 'Único',
  Talla VARCHAR(20) NOT NULL DEFAULT 'Única',
  Imagen VARCHAR(500) NULL,
  Stock INT NOT NULL DEFAULT 0,
  Activa TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_variante_producto_color_talla (Productos_idProductos, Color, Talla),
  FOREIGN KEY (Productos_idProductos) REFERENCES Productos(idProductos) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Resenas_Productos (
  idResena INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  Productos_idProductos INT NOT NULL,
  Usuarios_idUsuarios INT NULL,
  Calificacion TINYINT NOT NULL,
  Comentario TEXT NULL,
  Verificada TINYINT(1) NOT NULL DEFAULT 0,
  Fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (Calificacion BETWEEN 1 AND 5),
  FOREIGN KEY (Productos_idProductos) REFERENCES Productos(idProductos) ON DELETE CASCADE,
  FOREIGN KEY (Usuarios_idUsuarios) REFERENCES Usuarios(idUsuarios) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Alertas_Reposicion (
  idAlertaReposicion INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  Productos_idProductos INT NOT NULL,
  Correo VARCHAR(150) NOT NULL,
  Creada_En DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Notificada_En DATETIME NULL,
  UNIQUE KEY uq_alerta_producto_correo (Productos_idProductos, Correo),
  FOREIGN KEY (Productos_idProductos) REFERENCES Productos(idProductos) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Cupones (
  idCupon INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  Codigo VARCHAR(40) NOT NULL UNIQUE,
  Tipo ENUM('porcentaje', 'fijo') NOT NULL DEFAULT 'porcentaje',
  Valor DECIMAL(12,2) NOT NULL,
  Minimo_Compra DECIMAL(12,2) NOT NULL DEFAULT 0,
  Activo TINYINT(1) NOT NULL DEFAULT 1,
  Fecha_Inicio DATE NULL,
  Fecha_Fin DATE NULL
);

CREATE TABLE IF NOT EXISTS Productos_Papelera (
  Productos_idProductos INT NOT NULL PRIMARY KEY,
  Eliminado_En DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Eliminado_Por INT NULL,
  FOREIGN KEY (Productos_idProductos) REFERENCES Productos(idProductos) ON DELETE CASCADE,
  FOREIGN KEY (Eliminado_Por) REFERENCES Usuarios(idUsuarios) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Auditoria_Productos (
  idAuditoriaProducto INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  Productos_idProductos INT NOT NULL,
  Usuarios_idUsuarios INT NULL,
  Accion VARCHAR(60) NOT NULL,
  Detalle TEXT NULL,
  Creada_En DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (Productos_idProductos) REFERENCES Productos(idProductos) ON DELETE CASCADE,
  FOREIGN KEY (Usuarios_idUsuarios) REFERENCES Usuarios(idUsuarios) ON DELETE SET NULL
);
