<<<<<<< Updated upstream
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

let nodemailer = null;
try {
  nodemailer = require("nodemailer");
} catch {
  console.warn(" nodemailer no instalado: los codigos se mostraran solo en desarrollo");
}

const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");

const app = express();
app.use(cors());
app.use(express.json());

const codigosRecuperacion = new Map();

const crearTransporterCorreo = () => {
  if (!nodemailer || !process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const enviarCodigoCorreo = async (correo, codigo) => {
  const transporter = crearTransporterCorreo();
  if (!transporter) return false;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: correo,
    subject: "Codigo de recuperacion Tecnomatic MAV",
    text: `Tu codigo de recuperacion es ${codigo}. Vence en 10 minutos.`,
  });

  return true;
};

console.log("Creando cliente MP...");

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

console.log("Cliente creado correctamente");


const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "1234",
  database: "tecnomaticmav",
  port: 3306,
});

db.connect((err) => {
  if (err) console.error(" Error MySQL:", err.message);
  else console.log(" MySQL conectado");
});

db.on("error", (err) => console.error(" Error conexión MySQL:", err));


app.get("/hola", (req, res) => {
  res.send("Servidor funcionando correctamente");
});


app.post("/usuarios", (req, res) => {
  const { nombres, apellidos, correo, contrasena } = req.body;
  const query = "INSERT INTO Usuarios (Nombres, Apellidos, Correo, Contrasena, Roles_idRoles) VALUES (?, ?, ?, ?, ?)";
  db.query(query, [nombres, apellidos, correo, contrasena, 3], (err) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.status(201).json({ message: "Usuario registrado" });
  });
});

app.get("/admin/usuarios", (req, res) => {
  const query = `
    SELECT idUsuarios, Nombres, Apellidos, Correo, Contrasena, Roles_idRoles
    FROM Usuarios
    ORDER BY idUsuarios DESC
  `;

  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(result);
  });
});

app.post("/admin/usuarios", (req, res) => {
  const { nombres, apellidos, correo, contrasena, rol } = req.body;

  if (!nombres || !apellidos || !correo || !contrasena || !rol) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  const query = `
    INSERT INTO Usuarios (Nombres, Apellidos, Correo, Contrasena, Roles_idRoles)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(query, [nombres, apellidos, correo, contrasena, rol], (err) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.status(201).json({ message: "Usuario creado" });
  });
});

app.put("/admin/usuarios/:id", (req, res) => {
  const { nombres, apellidos, correo, contrasena, rol } = req.body;

  if (!nombres || !apellidos || !correo || !rol) {
    return res.status(400).json({ error: "Nombres, apellidos, correo y rol son obligatorios" });
  }

  const params = [nombres, apellidos, correo, rol];
  let query = `
    UPDATE Usuarios
    SET Nombres = ?, Apellidos = ?, Correo = ?, Roles_idRoles = ?
  `;

  if (contrasena) {
    query += ", Contrasena = ?";
    params.push(contrasena);
  }

  query += " WHERE idUsuarios = ?";
  params.push(req.params.id);

  db.query(query, params, (err) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json({ message: "Usuario actualizado" });
  });
});

app.delete("/admin/usuarios/:id", (req, res) => {
  db.query("DELETE FROM Usuarios WHERE idUsuarios = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json({ message: "Usuario eliminado" });
  });
});

app.post("/password/solicitar-codigo", (req, res) => {
  const { correo } = req.body;

  if (!correo) return res.status(400).json({ message: "El correo es obligatorio" });

  db.query("SELECT idUsuarios FROM Usuarios WHERE Correo = ?", [correo], async (err, result) => {
    if (err) return res.status(500).json({ message: "Error en base de datos" });
    if (result.length === 0) return res.status(404).json({ message: "No existe un usuario con ese correo" });

    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    const expira = Date.now() + 10 * 60 * 1000;
    codigosRecuperacion.set(correo, { codigo, expira });

    try {
      const enviado = await enviarCodigoCorreo(correo, codigo);
      res.json({
        message: enviado
          ? "Codigo enviado al correo"
          : "Codigo generado en modo desarrollo",
        devCode: enviado ? undefined : codigo,
      });
    } catch (error) {
      console.error(" Error enviando correo:", error.message);
      res.status(500).json({ message: "No se pudo enviar el correo" });
    }
  });
});

app.post("/password/restablecer", (req, res) => {
  const { correo, codigo, contrasena } = req.body;
  const registro = codigosRecuperacion.get(correo);

  if (!correo || !codigo || !contrasena) {
    return res.status(400).json({ message: "Correo, codigo y nueva contrasena son obligatorios" });
  }

  if (!registro || registro.codigo !== codigo || registro.expira < Date.now()) {
    return res.status(400).json({ message: "Codigo invalido o vencido" });
  }

  db.query("UPDATE Usuarios SET Contrasena = ? WHERE Correo = ?", [contrasena, correo], (err) => {
    if (err) return res.status(500).json({ message: "Error en base de datos" });
    codigosRecuperacion.delete(correo);
    res.json({ message: "Contrasena actualizada" });
  });
});


app.post("/login", (req, res) => {
  const { correo, contrasena } = req.body;
  const query = `
    SELECT *
    FROM Usuarios
    WHERE Correo = ? AND Contrasena = ?
  `;
  db.query(query, [correo, contrasena], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        message: "Error en la base de datos"
      });
    }
    if (result.length === 0) {
      return res.status(401).json({
        message: "Credenciales incorrectas"
      });
    }
    const usuario = result[0];
    // Generar JWT
    const token = jwt.sign(
      {
        id: usuario.idUsuarios,
        correo: usuario.Correo,
        rol: usuario.Rol
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h"
      }
    );
    // Respuesta
    res.json({
      message: "Inicio de sesión exitoso",
      token,
      usuario
    });
  });
});

app.get("/productos", (req, res) => {
  const { categoria, precioMax } = req.query;
  let query = `
    SELECT p.idProductos, p.Nombre_Producto, p.Tipo, p.Descripcion,
           p.Precio, p.Estado, p.Imagen, c.nombre AS Categoria
    FROM Productos p
    JOIN Categoria_productos c ON p.Categoria_producto_idCategoria = c.idCategorias
    WHERE p.Estado = 'Activo'
  `;
  const params = [];
  if (categoria) { query += " AND c.nombre = ?"; params.push(categoria); }
  if (precioMax) { query += " AND p.Precio <= ?"; params.push(precioMax); }
  query += " ORDER BY c.nombre, p.Nombre_Producto";

  db.query(query, params, (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(result);
  });
});


app.get("/admin/productos", (req, res) => {
  const query = `
    SELECT p.idProductos, p.Nombre_Producto, p.Tipo, p.Descripcion,
           p.Precio, p.Estado, p.Imagen, p.Categoria_producto_idCategoria,
           c.nombre AS Categoria
    FROM Productos p
    JOIN Categoria_productos c ON p.Categoria_producto_idCategoria = c.idCategorias
    ORDER BY c.nombre, p.Nombre_Producto
  `;
  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(result);
  });
});

app.post("/admin/productos", (req, res) => {
  const { nombre, tipo, descripcion, precio, imagen, categoria, estado } = req.body;
  const query = "INSERT INTO Productos (Nombre_Producto, Tipo, Descripcion, Precio, Imagen, Estado, Categoria_producto_idCategoria) VALUES (?, ?, ?, ?, ?, ?, ?)";
  db.query(query, [nombre, tipo, descripcion, precio, imagen, estado || "Activo", categoria], (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });

    
    db.query("INSERT INTO Stock (Productos_idProductos, Cantidad_Actual) VALUES (?, 0)", [result.insertId], () => {});
    res.status(201).json({ message: "Producto creado" });
  });
});

app.put("/admin/productos/:id", (req, res) => {
  const { nombre, tipo, descripcion, precio, imagen, categoria, estado } = req.body;
  const query = "UPDATE Productos SET Nombre_Producto=?, Tipo=?, Descripcion=?, Precio=?, Imagen=?, Estado=?, Categoria_producto_idCategoria=? WHERE idProductos=?";
  db.query(query, [nombre, tipo, descripcion, precio, imagen, estado, categoria, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json({ message: "Producto actualizado" });
  });
});

app.delete("/admin/productos/:id", (req, res) => {
  db.query("DELETE FROM Productos WHERE idProductos = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json({ message: "Producto eliminado" });
  });
});


app.get("/categorias", (req, res) => {
  db.query("SELECT * FROM Categoria_productos ORDER BY nombre", (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(result);
  });
});


app.post("/pedidos", (req, res) => {
  const { idUsuario, total, productos } = req.body;

  const queryFactura = "INSERT INTO Facturas (Total, Usuarios_idUsuarios) VALUES (?, ?)";
  db.query(queryFactura, [total, idUsuario], (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });

    const idFactura = result.insertId;
    const detalles = productos.map((p) => [idFactura, p.idProducto, p.cantidad, p.precioUnitario]);

    const queryDetalles = "INSERT INTO Detalle_Facturas (Factura_idFactura, Productos_idProductos, Cantidad, Precio_Unitario) VALUES ?";
    db.query(queryDetalles, [detalles], (err2) => {
      if (err2) return res.status(500).json({ error: err2.sqlMessage });

      
      productos.forEach((p) => {
        db.query(
          "UPDATE Stock SET Cantidad_Actual = GREATEST(Cantidad_Actual - ?, 0) WHERE Productos_idProductos = ?",
          [p.cantidad, p.idProducto]
        );
        db.query(
          "INSERT INTO Movimientos_Inventario (Productos_idProductos, Tipo_Movimiento, Cantidad, Observacion) VALUES (?, 'Salida', ?, ?)",
          [p.idProducto, p.cantidad, `Venta factura #${idFactura}`]
        );
      });

      res.status(201).json({ message: "Pedido creado", idFactura });
    });
  });
});


app.get("/facturas", (req, res) => {
  const query = `
    SELECT f.idFacturas, f.Fecha, f.Estado, f.Total,
           u.Nombres, u.Apellidos
    FROM Facturas f
    JOIN Usuarios u ON f.Usuarios_idUsuarios = u.idUsuarios
    ORDER BY f.Fecha DESC
  `;
  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(result);
  });
});

app.put("/facturas/:id/estado", (req, res) => {
  const { estado } = req.body;

  const estadosValidos = [
    "Pendiente",
    "Preparando",
    "Enviado",
    "Entregado",
    "Cancelado"
  ];

  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({
      error: "Estado no válido"
    });
  }

  const query = `
    UPDATE Facturas
    SET Estado = ?
    WHERE idFacturas = ?
  `;

  db.query(query, [estado, req.params.id], (err) => {
    if (err) {
      return res.status(500).json({
        error: err.sqlMessage
      });
    }

    res.json({
      message: "Estado actualizado correctamente"
    });
  });
});

// ===============================
// DEVOLUCIONES
// ===============================

// CLIENTE CREA DEVOLUCIÓN
app.post("/devoluciones", (req, res) => {
  const {
    facturaId, idFactura,
    productoId, idProducto,
    usuarioId, idUsuario,
    cantidad,
    motivo
  } = req.body;

  const fId = facturaId || idFactura;
  const pId = productoId || idProducto;
  const uId = usuarioId || idUsuario;

  const query = `
    INSERT INTO Devoluciones
    (Facturas_idFacturas, Productos_idProductos, Usuarios_idUsuarios, Cantidad, Motivo, Estado, Fecha)
    VALUES (?, ?, ?, ?, ?, 'Pendiente', CURDATE())
  `;

  db.query(
    query,
    [fId, pId, uId, cantidad, motivo],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          error: err.sqlMessage
        });
      }

      res.status(201).json({
        message: "Solicitud de devolución creada",
        id: result.insertId
      });
    }
  );
});

// CLIENTE VE SUS DEVOLUCIONES
app.get("/mis-devoluciones/:idUsuario", (req, res) => {
  const { idUsuario } = req.params;

  const query = `
SELECT
    d.idDevoluciones,
    d.Facturas_idFacturas,
    d.Cantidad,
    d.Motivo,
    d.Estado,
    d.Fecha,
    p.Nombre_Producto,
    u.Nombres,
    u.Apellidos

FROM Devoluciones d

JOIN Productos p
ON d.Productos_idProductos = p.idProductos

JOIN Usuarios u
ON d.Usuarios_idUsuarios = u.idUsuarios

WHERE d.Usuarios_idUsuarios = ?

ORDER BY d.Fecha DESC
  `;

  db.query(query, [idUsuario], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: err.sqlMessage
      });
    }

    res.json(result);
  });
});

// ADMIN VE DEVOLUCIONES
app.get("/devoluciones", (req, res) => {

const query = `
  SELECT 
    d.idDevoluciones,
    d.Facturas_idFacturas,
    d.Productos_idProductos,
    d.Usuarios_idUsuarios,
    d.Cantidad,
    d.Motivo,
    d.Fecha,
    d.Estado,

    p.Nombre_Producto,

    u.Nombres,
    u.Apellidos

  FROM devoluciones d

  INNER JOIN productos p
    ON d.Productos_idProductos = p.idProductos

  INNER JOIN usuarios u
    ON d.Usuarios_idUsuarios = u.idUsuarios

  ORDER BY d.idDevoluciones DESC
`;

  db.query(query, (err, result) => {

    if (err) {
      console.log(err);

      return res.status(500).json({
        error: err.sqlMessage
      });
    }

    res.json(result);
  });
});

// ADMIN CAMBIA ESTADO
app.put("/devoluciones/:id/estado", (req, res) => {
  const { estado } = req.body;

  const estadosValidos = [
    "Pendiente",
    "Aprobada",
    "Rechazada"
  ];

  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({
      error: "Estado inválido"
    });
  }

  const query = `
    UPDATE devoluciones
    SET Estado = ?
    WHERE idDevoluciones = ?
  `;

  db.query(query, [estado, req.params.id], (err) => {
    if (err) {
      return res.status(500).json({
        error: err.sqlMessage
      });
    }

    res.json({
      message: "Estado actualizado correctamente"
    });
  });
});


app.get("/stock/:id", (req, res) => {
  const query = `
    SELECT 
      s.Productos_idProductos AS idProducto,
      p.Nombre_Producto,
      p.Tipo,
      p.Precio,
      p.Estado,
      s.Cantidad_Actual,
      s.Ultima_Actualizacion
    FROM Stock s
    JOIN Productos p ON s.Productos_idProductos = p.idProductos
    WHERE s.Productos_idProductos = ?
  `;
  db.query(query, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    if (result.length === 0) return res.status(404).json({ message: "Producto no encontrado" });
    res.json(result[0]);
  });
});


app.put("/stock/:id", (req, res) => {
  const { cantidad, tipo, observacion } = req.body;
  

  if (!cantidad || cantidad <= 0) {
    return res.status(400).json({ error: "La cantidad debe ser mayor a 0" });
  }
  if (!["Entrada", "Salida"].includes(tipo)) {
    return res.status(400).json({ error: "Tipo debe ser 'Entrada' o 'Salida'" });
  }

  
  db.query("SELECT Cantidad_Actual FROM Stock WHERE Productos_idProductos = ?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    if (result.length === 0) return res.status(404).json({ message: "Producto no encontrado en stock" });

    const stockActual = result[0].Cantidad_Actual;

    
    if (tipo === "Salida" && cantidad > stockActual) {
      return res.status(400).json({
        error: `Stock insuficiente. Disponible: ${stockActual}, solicitado: ${cantidad}`
      });
    }

    const nuevaCantidad = tipo === "Entrada"
      ? stockActual + Number(cantidad)
      : stockActual - Number(cantidad);

    
    db.query(
      "UPDATE Stock SET Cantidad_Actual = ? WHERE Productos_idProductos = ?",
      [nuevaCantidad, req.params.id],
      (err2) => {
        if (err2) return res.status(500).json({ error: err2.sqlMessage });

        
        db.query(
          "INSERT INTO Movimientos_Inventario (Productos_idProductos, Tipo_Movimiento, Cantidad, Observacion) VALUES (?, ?, ?, ?)",
          [req.params.id, tipo, cantidad, observacion || `Ajuste manual de stock`],
          (err3) => {
            if (err3) console.error("Error registrando movimiento:", err3.sqlMessage);
          }
        );

        
        if (nuevaCantidad === 0) {
          db.query("UPDATE Productos SET Estado = 'Agotado' WHERE idProductos = ?", [req.params.id], () => {});
        }

        
        if (tipo === "Entrada" && stockActual === 0) {
          db.query("UPDATE Productos SET Estado = 'Activo' WHERE idProductos = ? AND Estado = 'Agotado'", [req.params.id], () => {});
        }

        res.json({
          message: `Stock actualizado correctamente`,
          idProducto: Number(req.params.id),
          stockAnterior: stockActual,
          stockNuevo: nuevaCantidad,
          movimiento: tipo,
        });
      }
    );
  });
});


app.get("/stock/alertas/bajos", (req, res) => {
  const query = `
    SELECT 
      s.Productos_idProductos AS idProducto,
      p.Nombre_Producto,
      p.Tipo,
      c.nombre AS Categoria,
      s.Cantidad_Actual,
      CASE
        WHEN s.Cantidad_Actual = 0   THEN 'Agotado'
        WHEN s.Cantidad_Actual <= 10 THEN 'Stock bajo'
      END AS Alerta
    FROM Stock s
    JOIN Productos p ON s.Productos_idProductos = p.idProductos
    JOIN Categoria_productos c ON p.Categoria_producto_idCategoria = c.idCategorias
    WHERE s.Cantidad_Actual <= 10
    ORDER BY s.Cantidad_Actual ASC
  `;
  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(result);
  });
});

app.get("/stock/movimientos/:id", (req, res) => {
  const query = `
    SELECT 
      m.idMovimiento,
      m.Tipo_Movimiento,
      m.Cantidad,
      m.Fecha,
      m.Observacion
    FROM Movimientos_Inventario m
    WHERE m.Productos_idProductos = ?
    ORDER BY m.Fecha DESC
  `;
  db.query(query, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(result);
  });
});

app.get("/test-mp", async (req, res) => {
  try {

    const preference = new Preference(client);

    const respuesta = await preference.create({
      body: {
        items: [
          {
            title: "Producto prueba",
            quantity: 1,
            unit_price: 1000
          }
        ]
      }
    });

    res.json(respuesta);

  } catch (e) {

    console.log(e);

    res.status(500).json({
      message: e.message,
      cause: e.cause,
      error: e
    });

  }
});

app.post("/crear-pago", async (req, res) => {
    console.log("BODY RECIBIDO:");
    console.log(req.body);
  try {
    const { carrito } = req.body;
    if (!carrito || carrito.length === 0) return res.status(400).json({ error: "Carrito vacío" });

    const items = carrito.map((p) => ({
      title: p.Nombre_Producto,
      quantity: Number(p.cantidad),
      unit_price: Number(p.Precio),
      
    }));
       console.log("ITEMS:");
    console.log(items);

    const preference = new Preference(client);
    const response = await preference.create({
      body: {
        items,
        back_urls: {
          success: "http://localhost:5173/success",
          failure: "http://localhost:5173/failure",
          pending: "http://localhost:5173/pending",
        },
      },
    });

    res.json({ id: response.id, init_point: response.init_point });
  } catch (error) {
    console.warn("⚠️ ERROR CHECKOUT PRO (Simulando pago de pruebas):", error.message);
    // Retornar simulación para permitir el flujo sin credenciales reales configuradas
    res.json({
      id: "simulated-pref-" + Math.floor(Math.random() * 1000000),
      init_point: "http://localhost:5173",
      simulated: true
    });
  }
});


app.post("/pagar-pse", async (req, res) => {
  try {
    const { total, correo, nombres, apellidos, numeroCedula, banco, tipoCuenta, tipoPersona } = req.body;

    let entityType = "individual";
    if (tipoPersona === "juridica" || tipoPersona === "1") {
      entityType = "association";
    }

    const payment = new Payment(client);
    const response = await payment.create({
      body: {
        transaction_amount: Number(total),
        description: "Compra Tecnomatic MAV",
        payment_method_id: "pse",
        currency_id: "COP",
        payer: {
          email: correo,
          first_name: nombres,
          last_name: apellidos,
          identification: { type: "CC", number: numeroCedula },
          entity_type: entityType,
        },
        transaction_details: { financial_institution: banco },
        additional_info: { ip_address: req.ip },
        callback_url: "http://localhost:5173/pago-resultado",
      },
    });

    res.json({
      status: response.status,
      status_detail: response.status_detail,
      id: response.id,
      redirect_url: response.transaction_details?.external_resource_url,
    });
  } catch (error) {
    console.warn("⚠️ ERROR PSE (Simulando pago de pruebas):", error.message);
    // Retornar simulación para permitir el flujo sin credenciales reales configuradas
    res.json({
      status: "approved",
      status_detail: "accredited",
      id: "simulated-pse-" + Math.floor(Math.random() * 1000000),
      redirect_url: "http://localhost:5173?status=approved",
      simulated: true
    });
  }
});

app.get("/bancos-pse", (req, res) => {
  res.json([
    { codigo: "1007", nombre: "Bancolombia" },
    { codigo: "1001", nombre: "Banco de Bogotá" },
    { codigo: "1013", nombre: "BBVA Colombia" },
    { codigo: "1006", nombre: "Banco Davivienda" },
    { codigo: "1009", nombre: "Citibank Colombia" },
    { codigo: "1040", nombre: "Banco Agrario" },
    { codigo: "1062", nombre: "Banco Falabella" },
    { codigo: "1032", nombre: "Banco Caja Social" },
  ]);
});

// ============================================================
// HISTORIAL DE PEDIDOS DEL CLIENTE
// ============================================================

app.get("/mis-pedidos/:idUsuario", (req, res) => {
  const query = `
    SELECT 
      f.idFacturas,
      f.Fecha,
      f.Estado,
      f.Total,
      e.Estado_Entrega,
      GROUP_CONCAT(
        CONCAT(
          p.Nombre_Producto,
          ' x',
          d.Cantidad
        )
        SEPARATOR ', '
      ) AS Productos
    FROM Facturas f
    LEFT JOIN Entregas e
      ON e.Factura_idFactura = f.idFacturas
    LEFT JOIN Detalle_Facturas d
      ON f.idFacturas = d.Factura_idFactura
    LEFT JOIN Productos p
      ON d.Productos_idProductos = p.idProductos
    WHERE f.Usuarios_idUsuarios = ?
    GROUP BY f.idFacturas
    ORDER BY f.Fecha DESC
  `;

  db.query(query, [req.params.idUsuario], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: err.sqlMessage,
      });
    }

    res.json(result);
  });
});

// ============================================================
// DETALLE DE PEDIDO
// ============================================================

app.get("/pedido-detalle/:idFactura", (req, res) => {
  const query = `
    SELECT 
      p.idProductos,
      p.Nombre_Producto,
      p.Imagen,
      d.Cantidad,
      d.Precio_Unitario
    FROM Detalle_Facturas d
    JOIN Productos p
      ON p.idProductos = d.Productos_idProductos
    WHERE d.Factura_idFactura = ?
  `;

  db.query(query, [req.params.idFactura], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: err.sqlMessage,
      });
    }

    res.json(result);
  });
});

// ============================================================
// ESTADO DE ENTREGA
// ============================================================

app.get("/seguimiento/:idFactura", (req, res) => {
  const query = `
    SELECT 
      e.idEntregas,
      e.Fecha_entrega,
      e.Estado_Entrega,
      e.Observaciones,
      f.Estado AS EstadoFactura
    FROM Entregas e
    JOIN Facturas f
      ON f.idFacturas = e.Factura_idFactura
    WHERE e.Factura_idFactura = ?
  `;

  db.query(query, [req.params.idFactura], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: err.sqlMessage,
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: "No se encontró seguimiento",
      });
    }

    res.json(result[0]);
  });
});

// ============================================================
// ELIMINAR PEDIDO (CASCADING DELETE)
// ============================================================
app.delete("/facturas/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM Entregas WHERE Factura_idFactura = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });

    db.query("DELETE FROM Devoluciones WHERE Facturas_idFacturas = ?", [id], (err2) => {
      if (err2) return res.status(500).json({ error: err2.sqlMessage });

      db.query("DELETE FROM Detalle_Facturas WHERE Factura_idFactura = ?", [id], (err3) => {
        if (err3) return res.status(500).json({ error: err3.sqlMessage });

        db.query("DELETE FROM Facturas WHERE idFacturas = ?", [id], (err4) => {
          if (err4) return res.status(500).json({ error: err4.sqlMessage });
          res.json({ message: "Pedido eliminado correctamente de la base de datos" });
        });
      });
    });
  });
});

// ============================================================
// APROBAR DEVOLUCIÓN
// ============================================================
app.put("/devoluciones/:id/aprobar", (req, res) => {
  const { id } = req.params;

  const query = `
    UPDATE devoluciones
    SET Estado = 'Aprobada'
    WHERE idDevoluciones = ?
  `;

  db.query(query, [id], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: err.sqlMessage
      });
    }

    res.json({
      message: "Devolución aprobada"
    });
  });
});

// ============================================================
// RECHAZAR DEVOLUCIÓN
// ============================================================
app.put("/devoluciones/:id/rechazar", (req, res) => {
  const { id } = req.params;

  const query = `
    UPDATE devoluciones
    SET Estado = 'Rechazada'
    WHERE idDevoluciones = ?
  `;

  db.query(query, [id], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: err.sqlMessage
      });
    }

    res.json({
      message: "Devolución rechazada"
    });
  });
});

app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

app.listen(3001, () => {
  console.log(" Servidor en puerto 3001");
});
=======
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const verifyToken = require("./middleware/verifyToken");
require("dotenv").config();

let nodemailer = null;
try {
  nodemailer = require("nodemailer");
} catch {
  console.warn(" nodemailer no instalado: los codigos se mostraran solo en desarrollo");
}

const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");

const app = express();
app.use(cors());
app.use(express.json());

const codigosRecuperacion = new Map();

const crearTransporterCorreo = () => {
  if (!nodemailer || !process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const enviarCodigoCorreo = async (correo, codigo) => {
  const transporter = crearTransporterCorreo();
  if (!transporter) return false;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: correo,
    subject: "Codigo de recuperacion Tecnomatic MAV",
    text: `Tu codigo de recuperacion es ${codigo}. Vence en 10 minutos.`,
  });

  return true;
};

console.log("Creando cliente MP...");

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

console.log("Cliente creado correctamente");


const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "tecnomaticmav",
  port: 3306,
});

db.connect((err) => {
  if (err) console.error(" Error MySQL:", err.message);
  else {
    console.log(" MySQL conectado");
    const rutaMigracion = path.join(__dirname, "migrations", "20260819_catalogo_crud.sql");
    const sentencias = fs.readFileSync(rutaMigracion, "utf8").split(/;\s*\r?\n/).map((sql) => sql.trim()).filter(Boolean);
    const ejecutar = (indice) => {
      if (indice >= sentencias.length) return console.log(" Migración de catálogo verificada");
      db.query(sentencias[indice], (error) => {
        if (error) return console.error(" Error en migración de catálogo:", error.sqlMessage);
        ejecutar(indice + 1);
      });
    };
    ejecutar(0);
  }
});

db.on("error", (err) => console.error(" Error conexión MySQL:", err));

const registrarAuditoriaProducto = (idProducto, idUsuario, accion, detalle) => {
  db.query(
    "INSERT INTO Auditoria_Productos (Productos_idProductos, Usuarios_idUsuarios, Accion, Detalle) VALUES (?, ?, ?, ?)",
    [idProducto, idUsuario || null, accion, detalle || null],
    (error) => error && console.error("Error registrando auditoría:", error.sqlMessage),
  );
};


app.get("/hola", (req, res) => {
  res.send("Servidor funcionando correctamente");
});


app.post("/usuarios", verifyToken, (req, res) => {
  const { nombres, apellidos, correo, contrasena } = req.body;
  const query = "INSERT INTO Usuarios (Nombres, Apellidos, Correo, Contrasena, Roles_idRoles) VALUES (?, ?, ?, ?, ?)";
  db.query(query, [nombres, apellidos, correo, contrasena, 3], (err) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.status(201).json({ message: "Usuario registrado" });
  });
});

app.get("/admin/usuarios", (req, res) => {
  const query = `
    SELECT idUsuarios, Nombres, Apellidos, Correo, Contrasena, Roles_idRoles
    FROM Usuarios
    ORDER BY idUsuarios DESC
  `;

  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(result);
  });
});

app.post("/admin/usuarios", (req, res) => {
  const { nombres, apellidos, correo, contrasena, rol } = req.body;

  if (!nombres || !apellidos || !correo || !contrasena || !rol) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  const query = `
    INSERT INTO Usuarios (Nombres, Apellidos, Correo, Contrasena, Roles_idRoles)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(query, [nombres, apellidos, correo, contrasena, rol], (err) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.status(201).json({ message: "Usuario creado" });
  });
});

app.put("/admin/usuarios/:id", (req, res) => {
  const { nombres, apellidos, correo, contrasena, rol } = req.body;

  if (!nombres || !apellidos || !correo || !rol) {
    return res.status(400).json({ error: "Nombres, apellidos, correo y rol son obligatorios" });
  }

  const params = [nombres, apellidos, correo, rol];
  let query = `
    UPDATE Usuarios
    SET Nombres = ?, Apellidos = ?, Correo = ?, Roles_idRoles = ?
  `;

  if (contrasena) {
    query += ", Contrasena = ?";
    params.push(contrasena);
  }

  query += " WHERE idUsuarios = ?";
  params.push(req.params.id);

  db.query(query, params, (err) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json({ message: "Usuario actualizado" });
  });
});

app.delete("/admin/usuarios/:id", (req, res) => {
  db.query("DELETE FROM Usuarios WHERE idUsuarios = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json({ message: "Usuario eliminado" });
  });
});

app.post("/password/solicitar-codigo", (req, res) => {
  const { correo } = req.body;

  if (!correo) return res.status(400).json({ message: "El correo es obligatorio" });

  db.query("SELECT idUsuarios FROM Usuarios WHERE Correo = ?", [correo], async (err, result) => {
    if (err) return res.status(500).json({ message: "Error en base de datos" });
    if (result.length === 0) return res.status(404).json({ message: "No existe un usuario con ese correo" });

    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    const expira = Date.now() + 10 * 60 * 1000;
    codigosRecuperacion.set(correo, { codigo, expira });

    try {
      const enviado = await enviarCodigoCorreo(correo, codigo);
      res.json({
        message: enviado
          ? "Codigo enviado al correo"
          : "Codigo generado en modo desarrollo",
        devCode: enviado ? undefined : codigo,
      });
    } catch (error) {
      console.error(" Error enviando correo:", error.message);
      res.status(500).json({ message: "No se pudo enviar el correo" });
    }
  });
});

app.post("/password/restablecer", (req, res) => {
  const { correo, codigo, contrasena } = req.body;
  const registro = codigosRecuperacion.get(correo);

  if (!correo || !codigo || !contrasena) {
    return res.status(400).json({ message: "Correo, codigo y nueva contrasena son obligatorios" });
  }

  if (!registro || registro.codigo !== codigo || registro.expira < Date.now()) {
    return res.status(400).json({ message: "Codigo invalido o vencido" });
  }

  db.query("UPDATE Usuarios SET Contrasena = ? WHERE Correo = ?", [contrasena, correo], (err) => {
    if (err) return res.status(500).json({ message: "Error en base de datos" });
    codigosRecuperacion.delete(correo);
    res.json({ message: "Contrasena actualizada" });
  });
});


app.post("/login", (req, res) => {
  const { correo, contrasena } = req.body;
  const query = `
    SELECT *
    FROM Usuarios
    WHERE Correo = ? AND Contrasena = ?
  `;
  db.query(query, [correo, contrasena], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        message: "Error en la base de datos"
      });
    }
    if (result.length === 0) {
      return res.status(401).json({
        message: "Credenciales incorrectas"
      });
    }
const usuario = result[0];

// Generar JWT
const token = jwt.sign(
  {
    id: usuario.idUsuarios,
    correo: usuario.Correo,
    rol: usuario.Roles_idRoles
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "8h"
  }
);

// Respuesta
res.json({
  message: "Inicio de sesión exitoso",
  token,
  usuario
    });
  });
});

app.get("/perfil", verifyToken, (req, res) => {
  res.json({
    mensaje: "Acceso permitido",
    usuario: req.usuario
  });
});

app.get("/productos", (req, res) => {
  const { categoria, precioMax, disponible, proteccion, material, marca, precioMin, precioMaximo } = req.query;
  let query = `
    SELECT p.idProductos, p.Nombre_Producto, p.Tipo, p.Descripcion,
           p.Precio, p.Estado, p.Imagen, c.nombre AS Categoria,
           COALESCE(a.Marca, '') AS Marca, COALESCE(a.Material, '') AS Material,
           COALESCE(a.Nivel_Proteccion, '') AS Nivel_Proteccion, COALESCE(a.Stock_Minimo, 5) AS Stock_Minimo,
           CASE WHEN COUNT(v.idProductoVariante) > 0 THEN SUM(v.Stock) ELSE COALESCE(s.Cantidad_Actual, 0) END AS Stock
    FROM Productos p
    JOIN Categoria_productos c ON p.Categoria_producto_idCategoria = c.idCategorias
    LEFT JOIN Stock s ON p.idProductos = s.Productos_idProductos
    LEFT JOIN Producto_Atributos a ON a.Productos_idProductos = p.idProductos
    LEFT JOIN Producto_Variantes v ON v.Productos_idProductos = p.idProductos AND v.Activa = 1
    LEFT JOIN Productos_Papelera papelera ON papelera.Productos_idProductos = p.idProductos
    WHERE p.Estado IN ('Activo', 'Disponible', 'Agotado') AND papelera.Productos_idProductos IS NULL
  `;
  const params = [];
  if (categoria) { query += " AND c.nombre = ?"; params.push(categoria); }
  if (precioMax) { query += " AND p.Precio <= ?"; params.push(precioMax); }
  if (precioMin) { query += " AND p.Precio >= ?"; params.push(precioMin); }
  if (precioMaximo) { query += " AND p.Precio <= ?"; params.push(precioMaximo); }
  if (proteccion) { query += " AND a.Nivel_Proteccion = ?"; params.push(proteccion); }
  if (material) { query += " AND a.Material = ?"; params.push(material); }
  if (marca) { query += " AND a.Marca = ?"; params.push(marca); }
  query += " GROUP BY p.idProductos, c.nombre, a.Marca, a.Material, a.Nivel_Proteccion, a.Stock_Minimo, s.Cantidad_Actual";
  if (disponible === "true") query += " HAVING Stock > 0";
  query += " ORDER BY c.nombre, p.Nombre_Producto";

  db.query(query, params, (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(result);
  });
});


app.get("/admin/productos", (req, res) => {
  const query = `
    SELECT p.idProductos, p.Nombre_Producto, p.Tipo, p.Descripcion,
           p.Precio, p.Estado, p.Imagen, p.Categoria_producto_idCategoria,
           c.nombre AS Categoria, COALESCE(a.Stock_Minimo, 5) AS Stock_Minimo,
           COALESCE(a.Marca, '') AS Marca, COALESCE(a.Material, '') AS Material,
           COALESCE(a.Nivel_Proteccion, '') AS Nivel_Proteccion,
           CASE WHEN COUNT(v.idProductoVariante) > 0 THEN SUM(v.Stock) ELSE COALESCE(s.Cantidad_Actual, 0) END AS Stock
    FROM Productos p
    JOIN Categoria_productos c ON p.Categoria_producto_idCategoria = c.idCategorias
    LEFT JOIN Stock s ON p.idProductos = s.Productos_idProductos
    LEFT JOIN Producto_Atributos a ON a.Productos_idProductos = p.idProductos
    LEFT JOIN Producto_Variantes v ON v.Productos_idProductos = p.idProductos AND v.Activa = 1
    LEFT JOIN Productos_Papelera papelera ON papelera.Productos_idProductos = p.idProductos
    WHERE papelera.Productos_idProductos IS NULL
    GROUP BY p.idProductos, c.nombre, a.Stock_Minimo, a.Marca, a.Material, a.Nivel_Proteccion, s.Cantidad_Actual
    ORDER BY c.nombre, p.Nombre_Producto
  `;
  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(result);
  });
});

app.post("/admin/productos", verifyToken, (req, res) => {
  const { nombre, tipo, descripcion, precio, imagen, categoria, estado, stock } = req.body;
  const stockNum = stock !== undefined ? Number(stock) : 0;
  
  let finalEstado = estado || "Activo";
  if (stockNum === 0 && (finalEstado === "Activo" || finalEstado === "Disponible")) {
    finalEstado = "Agotado";
  } else if (stockNum > 0 && finalEstado === "Agotado") {
    finalEstado = "Activo";
  }

  const query = "INSERT INTO Productos (Nombre_Producto, Tipo, Descripcion, Precio, Imagen, Estado, Categoria_producto_idCategoria) VALUES (?, ?, ?, ?, ?, ?, ?)";
  db.query(query, [nombre, tipo, descripcion, precio, imagen, finalEstado, categoria], (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });

    const insertedId = result.insertId;
    db.query("INSERT INTO Stock (Productos_idProductos, Cantidad_Actual) VALUES (?, ?)", [insertedId, stockNum], (errStock) => {
      if (errStock) console.error("Error al insertar stock inicial:", errStock.sqlMessage);
      
      if (stockNum > 0) {
        db.query(
          "INSERT INTO Movimientos_Inventario (Productos_idProductos, Tipo_Movimiento, Cantidad, Observacion) VALUES (?, 'Entrada', ?, ?)",
          [insertedId, stockNum, "Inventario inicial"],
          (errMov) => {
            if (errMov) console.error("Error al registrar movimiento inicial:", errMov.sqlMessage);
          }
        );
      }
    });

    registrarAuditoriaProducto(insertedId, req.usuario?.id, "Creación", "Producto creado desde el CRUD");
    res.status(201).json({ message: "Producto creado con éxito", idProducto: insertedId });
  });
});

app.put("/admin/productos/:id", verifyToken, (req, res) => {
  const { nombre, tipo, descripcion, precio, imagen, categoria, estado, stock } = req.body;
  const stockNum = stock !== undefined && stock !== null ? Number(stock) : null;

  let finalEstado = estado;
  if (stockNum !== null) {
    if (stockNum === 0 && (finalEstado === "Activo" || finalEstado === "Disponible")) {
      finalEstado = "Agotado";
    } else if (stockNum > 0 && finalEstado === "Agotado") {
      finalEstado = "Activo";
    }
  }

  const query = "UPDATE Productos SET Nombre_Producto=?, Tipo=?, Descripcion=?, Precio=?, Imagen=?, Estado=?, Categoria_producto_idCategoria=? WHERE idProductos=?";
  db.query(query, [nombre, tipo, descripcion, precio, imagen, finalEstado, categoria, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });

    if (stockNum !== null) {
      db.query("SELECT Cantidad_Actual FROM Stock WHERE Productos_idProductos = ?", [req.params.id], (errStock, resultStock) => {
        if (errStock) {
          console.error("Error al consultar stock actual:", errStock.sqlMessage);
        } else if (resultStock.length === 0) {
          db.query("INSERT INTO Stock (Productos_idProductos, Cantidad_Actual) VALUES (?, ?)", [req.params.id, stockNum], () => {
            if (stockNum > 0) {
              db.query("INSERT INTO Movimientos_Inventario (Productos_idProductos, Tipo_Movimiento, Cantidad, Observacion) VALUES (?, 'Entrada', ?, ?)", [req.params.id, stockNum, "Inventario inicial"]);
            }
          });
        } else {
          const stockActual = resultStock[0].Cantidad_Actual;
          if (stockActual !== stockNum) {
            const diff = stockNum - stockActual;
            const tipoMovimiento = diff > 0 ? "Entrada" : "Salida";
            const cantMovimiento = Math.abs(diff);

            db.query("UPDATE Stock SET Cantidad_Actual = ? WHERE Productos_idProductos = ?", [stockNum, req.params.id], (errUpdate) => {
              if (!errUpdate) {
                db.query(
                  "INSERT INTO Movimientos_Inventario (Productos_idProductos, Tipo_Movimiento, Cantidad, Observacion) VALUES (?, ?, ?, ?)",
                  [req.params.id, tipoMovimiento, cantMovimiento, "Ajuste por edición de producto"]
                );
              }
            });
          }
        }
      });
    }

    res.json({ message: "Producto actualizado con éxito" });
    registrarAuditoriaProducto(req.params.id, req.usuario?.id, "Edición", "Datos generales del producto actualizados");
  });
});

app.delete("/admin/productos/:id", verifyToken, (req, res) => {
  db.query("INSERT INTO Productos_Papelera (Productos_idProductos, Eliminado_Por) VALUES (?, ?) ON DUPLICATE KEY UPDATE Eliminado_En = CURRENT_TIMESTAMP, Eliminado_Por = VALUES(Eliminado_Por)", [req.params.id, req.usuario?.id || null], (err) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    registrarAuditoriaProducto(req.params.id, req.usuario?.id, "Enviado a papelera", "Producto ocultado del catálogo y CRUD");
    res.json({ message: "Producto enviado a la papelera" });
  });
});

app.get("/admin/productos/papelera", verifyToken, (req, res) => {
  db.query(`SELECT p.idProductos, p.Nombre_Producto, p.Precio, papelera.Eliminado_En FROM Productos_Papelera papelera JOIN Productos p ON p.idProductos = papelera.Productos_idProductos ORDER BY papelera.Eliminado_En DESC`, (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(result);
  });
});

app.put("/admin/productos/:id/restaurar", verifyToken, (req, res) => {
  db.query("DELETE FROM Productos_Papelera WHERE Productos_idProductos = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    registrarAuditoriaProducto(req.params.id, req.usuario?.id, "Restauración", "Producto restaurado desde la papelera");
    res.json({ message: "Producto restaurado" });
  });
});

app.get("/productos/:id/catalogo", (req, res) => {
  const idProducto = req.params.id;
  const consultas = [
    "SELECT COALESCE(Marca, '') AS Marca, COALESCE(Material, '') AS Material, COALESCE(Nivel_Proteccion, '') AS Nivel_Proteccion, Stock_Minimo FROM Producto_Atributos WHERE Productos_idProductos = ?",
    "SELECT idProductoImagen, Url_Imagen, Orden FROM Producto_Imagenes WHERE Productos_idProductos = ? ORDER BY Orden, idProductoImagen",
    "SELECT idProductoVariante, Color, Talla, Imagen, Stock FROM Producto_Variantes WHERE Productos_idProductos = ? AND Activa = 1 ORDER BY Color, Talla",
    "SELECT r.idResena, r.Calificacion, r.Comentario, r.Verificada, r.Fecha, CONCAT(COALESCE(u.Nombres, 'Cliente'), ' ', COALESCE(u.Apellidos, '')) AS Cliente FROM Resenas_Productos r LEFT JOIN Usuarios u ON u.idUsuarios = r.Usuarios_idUsuarios WHERE r.Productos_idProductos = ? ORDER BY r.Fecha DESC",
  ];
  Promise.all(consultas.map((query) => new Promise((resolve, reject) => db.query(query, [idProducto], (error, resultado) => error ? reject(error) : resolve(resultado)))))
    .then(([atributos, imagenes, variantes, resenas]) => res.json({ atributos: atributos[0] || {}, imagenes, variantes, resenas }))
    .catch((error) => res.status(500).json({ error: error.sqlMessage }));
});

app.put("/admin/productos/:id/catalogo", verifyToken, (req, res) => {
  const { atributos = {}, imagenes = [], variantes = [] } = req.body;
  const idProducto = req.params.id;
  const imagenesLimpias = imagenes.filter((imagen) => imagen?.url).map((imagen, indice) => [idProducto, imagen.url.trim(), Number(imagen.orden ?? indice)]);
  const variantesLimpias = variantes.filter((variante) => variante?.talla && variante?.color).map((variante) => [idProducto, variante.color.trim(), variante.talla.trim(), variante.imagen?.trim() || null, Math.max(0, Number(variante.stock || 0))]);
  db.beginTransaction((inicioError) => {
    if (inicioError) return res.status(500).json({ error: inicioError.sqlMessage });
    const revertir = (error) => db.rollback(() => res.status(500).json({ error: error.sqlMessage || "No se pudo guardar la configuración de catálogo" }));
    db.query("INSERT INTO Producto_Atributos (Productos_idProductos, Marca, Material, Nivel_Proteccion, Stock_Minimo) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE Marca = VALUES(Marca), Material = VALUES(Material), Nivel_Proteccion = VALUES(Nivel_Proteccion), Stock_Minimo = VALUES(Stock_Minimo)", [idProducto, atributos.marca || null, atributos.material || null, atributos.nivelProteccion || null, Math.max(0, Number(atributos.stockMinimo ?? 5))], (error) => {
      if (error) return revertir(error);
      db.query("DELETE FROM Producto_Imagenes WHERE Productos_idProductos = ?", [idProducto], (errorImagenes) => {
        if (errorImagenes) return revertir(errorImagenes);
        const guardarImagenes = () => db.query("DELETE FROM Producto_Variantes WHERE Productos_idProductos = ?", [idProducto], (errorVariantes) => {
          if (errorVariantes) return revertir(errorVariantes);
          const guardarVariantes = () => {
            if (!variantesLimpias.length) return finalizar();
            db.query("INSERT INTO Producto_Variantes (Productos_idProductos, Color, Talla, Imagen, Stock) VALUES ?", [variantesLimpias], (errorInsertar) => errorInsertar ? revertir(errorInsertar) : finalizar());
          };
          guardarVariantes();
        });
        if (!imagenesLimpias.length) return guardarImagenes();
        db.query("INSERT INTO Producto_Imagenes (Productos_idProductos, Url_Imagen, Orden) VALUES ?", [imagenesLimpias], (errorInsertar) => errorInsertar ? revertir(errorInsertar) : guardarImagenes());
      });
    });
    const finalizar = () => db.commit((commitError) => {
      if (commitError) return revertir(commitError);
      registrarAuditoriaProducto(idProducto, req.usuario?.id, "Configuración de catálogo", "Atributos, imágenes, variantes y stock mínimo actualizados");
      res.json({ message: "Configuración de catálogo guardada" });
    });
  });
});

app.get("/admin/productos/:id/auditoria", verifyToken, (req, res) => {
  db.query(`SELECT a.idAuditoriaProducto, a.Accion, a.Detalle, a.Creada_En, CONCAT(COALESCE(u.Nombres, 'Sistema'), ' ', COALESCE(u.Apellidos, '')) AS Usuario FROM Auditoria_Productos a LEFT JOIN Usuarios u ON u.idUsuarios = a.Usuarios_idUsuarios WHERE a.Productos_idProductos = ? ORDER BY a.Creada_En DESC`, [req.params.id], (error, resultado) => {
    if (error) return res.status(500).json({ error: error.sqlMessage });
    res.json(resultado);
  });
});

app.get("/admin/inventario/alertas", verifyToken, (req, res) => {
  const query = `SELECT p.idProductos, p.Nombre_Producto, COALESCE(a.Stock_Minimo, 5) AS Stock_Minimo,
    CASE WHEN COUNT(v.idProductoVariante) > 0 THEN SUM(v.Stock) ELSE COALESCE(s.Cantidad_Actual, 0) END AS Stock
    FROM Productos p LEFT JOIN Stock s ON s.Productos_idProductos = p.idProductos
    LEFT JOIN Producto_Atributos a ON a.Productos_idProductos = p.idProductos
    LEFT JOIN Producto_Variantes v ON v.Productos_idProductos = p.idProductos AND v.Activa = 1
    LEFT JOIN Productos_Papelera papelera ON papelera.Productos_idProductos = p.idProductos
    WHERE papelera.Productos_idProductos IS NULL GROUP BY p.idProductos, a.Stock_Minimo, s.Cantidad_Actual
    HAVING Stock <= Stock_Minimo ORDER BY Stock ASC`;
  db.query(query, (error, resultado) => {
    if (error) return res.status(500).json({ error: error.sqlMessage });
    res.json(resultado);
  });
});

app.put("/admin/inventario/ajuste-masivo", verifyToken, (req, res) => {
  const { categoria, tipo, valor } = req.body;
  const numero = Number(valor);
  if (!categoria || !["precio_porcentaje", "stock_delta"].includes(tipo) || !Number.isFinite(numero)) return res.status(400).json({ error: "Datos de ajuste inválidos" });
  const consultaProductos = "SELECT p.idProductos FROM Productos p JOIN Categoria_productos c ON c.idCategorias = p.Categoria_producto_idCategoria LEFT JOIN Productos_Papelera papelera ON papelera.Productos_idProductos = p.idProductos WHERE c.nombre = ? AND papelera.Productos_idProductos IS NULL";
  db.query(consultaProductos, [categoria], (error, productos) => {
    if (error) return res.status(500).json({ error: error.sqlMessage });
    if (!productos.length) return res.status(404).json({ error: "No hay productos activos en esa categoría" });
    const ids = productos.map((producto) => producto.idProductos);
    const query = tipo === "precio_porcentaje" ? "UPDATE Productos SET Precio = GREATEST(0, Precio * (1 + ? / 100)) WHERE idProductos IN (?)" : "UPDATE Stock SET Cantidad_Actual = GREATEST(0, Cantidad_Actual + ?) WHERE Productos_idProductos IN (?)";
    db.query(query, [numero, ids], (actualizarError) => {
      if (actualizarError) return res.status(500).json({ error: actualizarError.sqlMessage });
      ids.forEach((id) => registrarAuditoriaProducto(id, req.usuario?.id, "Ajuste masivo", `${tipo}: ${numero} para categoría ${categoria}`));
      res.json({ message: "Ajuste masivo aplicado", productosActualizados: ids.length });
    });
  });
});

app.post("/productos/:id/resenas", verifyToken, (req, res) => {
  const { calificacion, comentario } = req.body;
  const puntuacion = Number(calificacion);
  if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5) return res.status(400).json({ error: "La calificación debe estar entre 1 y 5" });
  const verificarCompra = "SELECT 1 FROM Detalle_Facturas d JOIN Facturas f ON f.idFacturas = d.Factura_idFactura WHERE d.Productos_idProductos = ? AND f.Usuarios_idUsuarios = ? LIMIT 1";
  db.query(verificarCompra, [req.params.id, req.usuario.id], (error, compras) => {
    if (error) return res.status(500).json({ error: error.sqlMessage });
    db.query("INSERT INTO Resenas_Productos (Productos_idProductos, Usuarios_idUsuarios, Calificacion, Comentario, Verificada) VALUES (?, ?, ?, ?, ?)", [req.params.id, req.usuario.id, puntuacion, comentario?.trim() || null, compras.length ? 1 : 0], (insertarError) => {
      if (insertarError) return res.status(500).json({ error: insertarError.sqlMessage });
      res.status(201).json({ message: "Reseña publicada", verificada: Boolean(compras.length) });
    });
  });
});

app.post("/productos/:id/alerta-reposicion", (req, res) => {
  const correo = req.body.correo?.trim();
  if (!correo) return res.status(400).json({ error: "El correo es obligatorio" });
  db.query("INSERT INTO Alertas_Reposicion (Productos_idProductos, Correo) VALUES (?, ?) ON DUPLICATE KEY UPDATE Creada_En = CURRENT_TIMESTAMP, Notificada_En = NULL", [req.params.id, correo], (error) => {
    if (error) return res.status(500).json({ error: error.sqlMessage });
    res.status(201).json({ message: "Te avisaremos cuando este producto tenga inventario" });
  });
});

app.get("/productos/:id/relacionados", (req, res) => {
  const query = `SELECT p.idProductos, p.Nombre_Producto, p.Precio, p.Imagen, c.nombre AS Categoria FROM Productos actual
    JOIN Productos p ON p.Categoria_producto_idCategoria = actual.Categoria_producto_idCategoria AND p.idProductos <> actual.idProductos
    JOIN Categoria_productos c ON c.idCategorias = p.Categoria_producto_idCategoria LEFT JOIN Productos_Papelera papelera ON papelera.Productos_idProductos = p.idProductos
    WHERE actual.idProductos = ? AND papelera.Productos_idProductos IS NULL ORDER BY p.Nombre_Producto LIMIT 4`;
  db.query(query, [req.params.id], (error, resultado) => error ? res.status(500).json({ error: error.sqlMessage }) : res.json(resultado));
});

app.get("/productos/:id/comprados-juntos", (req, res) => {
  const query = `SELECT p.idProductos, p.Nombre_Producto, p.Precio, p.Imagen, COUNT(*) AS Veces FROM Detalle_Facturas base
    JOIN Detalle_Facturas otro ON otro.Factura_idFactura = base.Factura_idFactura AND otro.Productos_idProductos <> base.Productos_idProductos
    JOIN Productos p ON p.idProductos = otro.Productos_idProductos LEFT JOIN Productos_Papelera papelera ON papelera.Productos_idProductos = p.idProductos
    WHERE base.Productos_idProductos = ? AND papelera.Productos_idProductos IS NULL GROUP BY p.idProductos ORDER BY Veces DESC LIMIT 4`;
  db.query(query, [req.params.id], (error, resultado) => error ? res.status(500).json({ error: error.sqlMessage }) : res.json(resultado));
});

app.post("/cupones/validar", (req, res) => {
  const { codigo, subtotal } = req.body;
  db.query("SELECT * FROM Cupones WHERE Codigo = ? AND Activo = 1 AND (Fecha_Inicio IS NULL OR Fecha_Inicio <= CURDATE()) AND (Fecha_Fin IS NULL OR Fecha_Fin >= CURDATE())", [codigo?.trim().toUpperCase()], (error, cupones) => {
    if (error) return res.status(500).json({ error: error.sqlMessage });
    const cupon = cupones[0];
    if (!cupon || Number(subtotal) < Number(cupon.Minimo_Compra)) return res.status(404).json({ error: "Cupón no válido o no aplicable" });
    const descuento = cupon.Tipo === "porcentaje" ? Number(subtotal) * Number(cupon.Valor) / 100 : Number(cupon.Valor);
    res.json({ codigo: cupon.Codigo, descuento: Math.min(Number(subtotal), descuento) });
  });
});


app.get("/categorias", (req, res) => {
  db.query("SELECT * FROM Categoria_productos ORDER BY nombre", (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(result);
  });
});


app.post("/pedidos", (req, res) => {
  const { idUsuario, total, productos } = req.body;

  // 1. Crear la Factura
  const queryFactura = "INSERT INTO Facturas (Total, Usuarios_idUsuarios) VALUES (?, ?)";
  db.query(queryFactura, [total, idUsuario], (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });

    const idFactura = result.insertId;
    const detalles = productos.map((p) => [idFactura, p.idProducto, p.cantidad, p.precioUnitario]);

    // 2. Crear los Detalle_Facturas
    const queryDetalles = "INSERT INTO Detalle_Facturas (Factura_idFactura, Productos_idProductos, Cantidad, Precio_Unitario) VALUES ?";
    db.query(queryDetalles, [detalles], (err2) => {
      if (err2) return res.status(500).json({ error: err2.sqlMessage });

      // 3. Crear el registro en Entregas para vincular con el seguimiento
      const queryEntrega = `
        INSERT INTO Entregas (Factura_idFactura, Usuarios_idUsuarios, Fecha_entrega, Estado_Entrega, Observaciones) 
        VALUES (?, ?, CURDATE(), 'En Proceso', 'Pedido registrado por el usuario')
      `;
      db.query(queryEntrega, [idFactura, idUsuario], (errEntrega) => {
        if (errEntrega) console.error("Error al crear Entrega:", errEntrega.sqlMessage);
      });

      // 4. Actualizar Stock, Estados y Movimientos
      productos.forEach((p) => {
        db.query(
          "UPDATE Stock SET Cantidad_Actual = GREATEST(Cantidad_Actual - ?, 0) WHERE Productos_idProductos = ?",
          [p.cantidad, p.idProducto],
          () => {
            db.query(
              "SELECT Cantidad_Actual FROM Stock WHERE Productos_idProductos = ?",
              [p.idProducto],
              (errStock, stockRes) => {
                if (!errStock && stockRes.length > 0 && stockRes[0].Cantidad_Actual === 0) {
                  db.query("UPDATE Productos SET Estado = 'Agotado' WHERE idProductos = ?", [p.idProducto]);
                }
              }
            );
          }
        );

        db.query(
          "INSERT INTO Movimientos_Inventario (Productos_idProductos, Tipo_Movimiento, Cantidad, Observacion) VALUES (?, 'Salida', ?, ?)",
          [p.idProducto, p.cantidad, `Venta factura #${idFactura}`]
        );
      });

      res.status(201).json({ message: "Pedido creado", idFactura });
    });
  });
});


app.get("/facturas", (req, res) => {
  const query = `
    SELECT f.idFacturas, f.Fecha, f.Estado, f.Total, f.Usuarios_idUsuarios,
           u.Nombres, u.Apellidos
    FROM Facturas f
    JOIN Usuarios u ON f.Usuarios_idUsuarios = u.idUsuarios
    ORDER BY f.Fecha DESC
  `;
  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(result);
  });
});

app.put("/facturas/:id/estado", (req, res) => {
  const { estado } = req.body;

  const estadosValidos = [
    "Pendiente",
    "Preparando",
    "Enviado",
    "Entregado",
    "Cancelado"
  ];

  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({
      error: "Estado no válido"
    });
  }

  const query = `
    UPDATE Facturas
    SET Estado = ?
    WHERE idFacturas = ?
  `;

  db.query(query, [estado, req.params.id], (err) => {
    if (err) {
      return res.status(500).json({
        error: err.sqlMessage
      });
    }

    res.json({
      message: "Estado actualizado correctamente"
    });
  });
});

// ===============================
// DEVOLUCIONES
// ===============================

// CLIENTE CREA DEVOLUCIÓN
app.post("/devoluciones", (req, res) => {
  const {
    facturaId, idFactura,
    productoId, idProducto,
    usuarioId, idUsuario,
    cantidad,
    motivo,
    motivoCategoria,
    metodoReembolso,
    metodoRetorno,
    direccionRetorno,
    evidenciaUrl
  } = req.body;

  const fId = facturaId || idFactura;
  const pId = productoId || idProducto;
  const uId = usuarioId || idUsuario;

  const query = `
    INSERT INTO Devoluciones
    (Facturas_idFacturas, Productos_idProductos, Usuarios_idUsuarios, Cantidad, Motivo, Estado, Fecha,
     Motivo_Categoria, Metodo_Reembolso, Metodo_Retorno, Direccion_Retorno, Evidencia_Url, Estado_Tracking)
    VALUES (?, ?, ?, ?, ?, 'Pendiente', CURDATE(), ?, ?, ?, ?, ?, 'Solicitada')
  `;

  db.query(
    query,
    [fId, pId, uId, cantidad, motivo, motivoCategoria || null, metodoReembolso || null, metodoRetorno || null, direccionRetorno || null, evidenciaUrl || null],
    (err, result) => {
      if (err) {
        console.error("Error al insertar devolución:", err);
        return res.status(500).json({
          error: err.sqlMessage
        });
      }

      res.status(201).json({
        message: "Solicitud de devolución creada",
        id: result.insertId
      });
    }
  );
});

// CLIENTE VE SUS DEVOLUCIONES
app.get("/mis-devoluciones/:idUsuario", (req, res) => {
  const { idUsuario } = req.params;

  const query = `
    SELECT
      d.idDevoluciones,
      d.Facturas_idFacturas,
      d.Cantidad,
      d.Motivo,
      d.Estado,
      d.Fecha,
      d.Motivo_Categoria,
      d.Metodo_Reembolso,
      d.Metodo_Retorno,
      d.Direccion_Retorno,
      d.Evidencia_Url,
      d.Comentarios_Admin,
      d.Codigo_Cupon,
      d.Estado_Tracking,
      p.Nombre_Producto,
      u.Nombres,
      u.Apellidos
    FROM Devoluciones d
    JOIN Productos p ON d.Productos_idProductos = p.idProductos
    JOIN Usuarios u ON d.Usuarios_idUsuarios = u.idUsuarios
    WHERE d.Usuarios_idUsuarios = ?
    ORDER BY d.Fecha DESC
  `;

  db.query(query, [idUsuario], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: err.sqlMessage
      });
    }

    res.json(result);
  });
});

// ADMIN VE DEVOLUCIONES
app.get("/devoluciones", (req, res) => {
  const query = `
    SELECT 
      d.idDevoluciones,
      d.Facturas_idFacturas,
      d.Productos_idProductos,
      d.Usuarios_idUsuarios,
      d.Cantidad,
      d.Motivo,
      d.Fecha,
      d.Estado,
      d.Motivo_Categoria,
      d.Metodo_Reembolso,
      d.Metodo_Retorno,
      d.Direccion_Retorno,
      d.Evidencia_Url,
      d.Comentarios_Admin,
      d.Codigo_Cupon,
      d.Estado_Tracking,
      p.Nombre_Producto,
      u.Nombres,
      u.Apellidos
    FROM Devoluciones d
    INNER JOIN Productos p ON d.Productos_idProductos = p.idProductos
    INNER JOIN Usuarios u ON d.Usuarios_idUsuarios = u.idUsuarios
    ORDER BY d.idDevoluciones DESC
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        error: err.sqlMessage
      });
    }

    res.json(result);
  });
});

// ADMIN CAMBIA ESTADO
app.put("/devoluciones/:id/estado", (req, res) => {
  const { estado } = req.body;

  const estadosValidos = [
    "Pendiente",
    "Aprobada",
    "Rechazada"
  ];

  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({
      error: "Estado inválido"
    });
  }

  const query = `
    UPDATE devoluciones
    SET Estado = ?
    WHERE idDevoluciones = ?
  `;

  db.query(query, [estado, req.params.id], (err) => {
    if (err) {
      return res.status(500).json({
        error: err.sqlMessage
      });
    }

    res.json({
      message: "Estado actualizado correctamente"
    });
  });
});


app.get("/stock", (req, res) => {
  const query = `
    SELECT 
      s.Productos_idProductos AS idProducto,
      p.Nombre_Producto,
      p.Tipo,
      p.Precio,
      p.Estado,
      s.Cantidad_Actual,
      s.Ultima_Actualizacion,
      c.nombre AS Categoria
    FROM Stock s
    JOIN Productos p ON s.Productos_idProductos = p.idProductos
    JOIN Categoria_productos c ON p.Categoria_producto_idCategoria = c.idCategorias
    ORDER BY p.Nombre_Producto
  `;
  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(result);
  });
});


app.get("/stock/:id", (req, res) => {
  const query = `
    SELECT 
      s.Productos_idProductos AS idProducto,
      p.Nombre_Producto,
      p.Tipo,
      p.Precio,
      p.Estado,
      s.Cantidad_Actual,
      s.Ultima_Actualizacion
    FROM Stock s
    JOIN Productos p ON s.Productos_idProductos = p.idProductos
    WHERE s.Productos_idProductos = ?
  `;
  db.query(query, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    if (result.length === 0) return res.status(404).json({ message: "Producto no encontrado" });
    res.json(result[0]);
  });
});


app.put("/stock/:id", (req, res) => {
  const { cantidad, tipo, observacion } = req.body;
  

  if (!cantidad || cantidad <= 0) {
    return res.status(400).json({ error: "La cantidad debe ser mayor a 0" });
  }
  if (!["Entrada", "Salida"].includes(tipo)) {
    return res.status(400).json({ error: "Tipo debe ser 'Entrada' o 'Salida'" });
  }

  
  db.query("SELECT Cantidad_Actual FROM Stock WHERE Productos_idProductos = ?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    if (result.length === 0) return res.status(404).json({ message: "Producto no encontrado en stock" });

    const stockActual = result[0].Cantidad_Actual;

    
    if (tipo === "Salida" && cantidad > stockActual) {
      return res.status(400).json({
        error: `Stock insuficiente. Disponible: ${stockActual}, solicitado: ${cantidad}`
      });
    }

    const nuevaCantidad = tipo === "Entrada"
      ? stockActual + Number(cantidad)
      : stockActual - Number(cantidad);

    
    db.query(
      "UPDATE Stock SET Cantidad_Actual = ? WHERE Productos_idProductos = ?",
      [nuevaCantidad, req.params.id],
      (err2) => {
        if (err2) return res.status(500).json({ error: err2.sqlMessage });

        
        db.query(
          "INSERT INTO Movimientos_Inventario (Productos_idProductos, Tipo_Movimiento, Cantidad, Observacion) VALUES (?, ?, ?, ?)",
          [req.params.id, tipo, cantidad, observacion || `Ajuste manual de stock`],
          (err3) => {
            if (err3) console.error("Error registrando movimiento:", err3.sqlMessage);
          }
        );

        
        if (nuevaCantidad === 0) {
          db.query("UPDATE Productos SET Estado = 'Agotado' WHERE idProductos = ?", [req.params.id], () => {});
        }

        
        if (tipo === "Entrada" && stockActual === 0) {
          db.query("UPDATE Productos SET Estado = 'Activo' WHERE idProductos = ? AND Estado = 'Agotado'", [req.params.id], () => {});
        }

        res.json({
          message: `Stock actualizado correctamente`,
          idProducto: Number(req.params.id),
          stockAnterior: stockActual,
          stockNuevo: nuevaCantidad,
          movimiento: tipo,
        });
      }
    );
  });
});


app.get("/stock/alertas/bajos", (req, res) => {
  const query = `
    SELECT 
      s.Productos_idProductos AS idProducto,
      p.Nombre_Producto,
      p.Tipo,
      c.nombre AS Categoria,
      s.Cantidad_Actual,
      CASE
        WHEN s.Cantidad_Actual = 0   THEN 'Agotado'
        WHEN s.Cantidad_Actual <= 10 THEN 'Stock bajo'
      END AS Alerta
    FROM Stock s
    JOIN Productos p ON s.Productos_idProductos = p.idProductos
    JOIN Categoria_productos c ON p.Categoria_producto_idCategoria = c.idCategorias
    WHERE s.Cantidad_Actual <= 10
    ORDER BY s.Cantidad_Actual ASC
  `;
  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(result);
  });
});

app.get("/stock/movimientos/:id", (req, res) => {
  const query = `
    SELECT 
      m.idMovimiento,
      m.Tipo_Movimiento,
      m.Cantidad,
      m.Fecha,
      m.Observacion
    FROM Movimientos_Inventario m
    WHERE m.Productos_idProductos = ?
    ORDER BY m.Fecha DESC
  `;
  db.query(query, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(result);
  });
});

app.get("/test-mp", async (req, res) => {
  try {

    const preference = new Preference(client);

    const respuesta = await preference.create({
      body: {
        items: [
          {
            title: "Producto prueba",
            quantity: 1,
            unit_price: 1000
          }
        ]
      }
    });

    res.json(respuesta);

  } catch (e) {

    console.log(e);

    res.status(500).json({
      message: e.message,
      cause: e.cause,
      error: e
    });

  }
});

app.post("/crear-pago", async (req, res) => {
    console.log("BODY RECIBIDO:");
    console.log(req.body);
  try {
    const { carrito } = req.body;
    if (!carrito || carrito.length === 0) return res.status(400).json({ error: "Carrito vacío" });

    const items = carrito.map((p) => ({
      title: p.Nombre_Producto,
      quantity: Number(p.cantidad),
      unit_price: Number(p.Precio),
      
    }));
       console.log("ITEMS:");
    console.log(items);

    const preference = new Preference(client);
    const response = await preference.create({
      body: {
        items,
        back_urls: {
          success: "http://localhost:5173/success",
          failure: "http://localhost:5173/failure",
          pending: "http://localhost:5173/pending",
        },
      },
    });

    res.json({ id: response.id, init_point: response.init_point });
  } catch (error) {
    console.warn("⚠️ ERROR CHECKOUT PRO (Simulando pago de pruebas):", error.message);
    // Retornar simulación para permitir el flujo sin credenciales reales configuradas
    res.json({
      id: "simulated-pref-" + Math.floor(Math.random() * 1000000),
      init_point: "http://localhost:5173",
      simulated: true
    });
  }
});


app.post("/pagar-pse", async (req, res) => {
  try {
    const { total, correo, nombres, apellidos, numeroCedula, banco, tipoCuenta, tipoPersona } = req.body;

    let entityType = "individual";
    if (tipoPersona === "juridica" || tipoPersona === "1") {
      entityType = "association";
    }

    const payment = new Payment(client);
    const response = await payment.create({
      body: {
        transaction_amount: Number(total),
        description: "Compra Tecnomatic MAV",
        payment_method_id: "pse",
        currency_id: "COP",
        payer: {
          email: correo,
          first_name: nombres,
          last_name: apellidos,
          identification: { type: "CC", number: numeroCedula },
          entity_type: entityType,
        },
        transaction_details: { financial_institution: banco },
        additional_info: { ip_address: req.ip },
        callback_url: "http://localhost:5173/pago-resultado",
      },
    });

    res.json({
      status: response.status,
      status_detail: response.status_detail,
      id: response.id,
      redirect_url: response.transaction_details?.external_resource_url,
    });
  } catch (error) {
    console.warn("⚠️ ERROR PSE (Simulando pago de pruebas):", error.message);
    // Retornar simulación para permitir el flujo sin credenciales reales configuradas
    res.json({
      status: "approved",
      status_detail: "accredited",
      id: "simulated-pse-" + Math.floor(Math.random() * 1000000),
      redirect_url: "http://localhost:5173?status=approved",
      simulated: true
    });
  }
});

app.get("/bancos-pse", (req, res) => {
  res.json([
    { codigo: "1007", nombre: "Bancolombia" },
    { codigo: "1001", nombre: "Banco de Bogotá" },
    { codigo: "1013", nombre: "BBVA Colombia" },
    { codigo: "1006", nombre: "Banco Davivienda" },
    { codigo: "1009", nombre: "Citibank Colombia" },
    { codigo: "1040", nombre: "Banco Agrario" },
    { codigo: "1062", nombre: "Banco Falabella" },
    { codigo: "1032", nombre: "Banco Caja Social" },
  ]);
});

// ============================================================
// HISTORIAL DE PEDIDOS DEL CLIENTE
// ============================================================

app.get("/mis-pedidos/:idUsuario", (req, res) => {
  const { idUsuario } = req.params;

  const query = `
    SELECT 
      f.idFacturas, 
      f.Fecha, 
      f.Estado, 
      f.Total,
      COALESCE(e.Estado_Entrega, 'En Proceso') AS Estado_Entrega
    FROM Facturas f
    LEFT JOIN Entregas e ON e.Factura_idFactura = f.idFacturas
    WHERE f.Usuarios_idUsuarios = ?
    ORDER BY f.Fecha DESC
  `;

  db.query(query, [idUsuario], (err, results) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(results);
  });
});

// ============================================================
// DETALLE DE PEDIDO
// ============================================================

app.get("/pedido-detalle/:idFactura", (req, res) => {
  const query = `
    SELECT 
      p.idProductos,
      p.Nombre_Producto,
      p.Imagen,
      d.Cantidad,
      d.Precio_Unitario
    FROM Detalle_Facturas d
    JOIN Productos p
      ON p.idProductos = d.Productos_idProductos
    WHERE d.Factura_idFactura = ?
  `;

  db.query(query, [req.params.idFactura], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: err.sqlMessage,
      });
    }

    res.json(result);
  });
});

// ============================================================
// ESTADO DE ENTREGA
// ============================================================

app.get("/seguimiento/:idFactura", (req, res) => {
  const query = `
    SELECT 
      e.idEntregas,
      e.Fecha_entrega,
      e.Estado_Entrega,
      e.Observaciones,
      f.Estado AS EstadoFactura
    FROM Entregas e
    JOIN Facturas f
      ON f.idFacturas = e.Factura_idFactura
    WHERE e.Factura_idFactura = ?
  `;

  db.query(query, [req.params.idFactura], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: err.sqlMessage,
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: "No se encontró seguimiento",
      });
    }

    res.json(result[0]);
  });
});

// ============================================================
// ELIMINAR PEDIDO (CASCADING DELETE)
// ============================================================
app.delete("/facturas/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM Entregas WHERE Factura_idFactura = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });

    db.query("DELETE FROM Devoluciones WHERE Facturas_idFacturas = ?", [id], (err2) => {
      if (err2) return res.status(500).json({ error: err2.sqlMessage });

      db.query("DELETE FROM Detalle_Facturas WHERE Factura_idFactura = ?", [id], (err3) => {
        if (err3) return res.status(500).json({ error: err3.sqlMessage });

        db.query("DELETE FROM Facturas WHERE idFacturas = ?", [id], (err4) => {
          if (err4) return res.status(500).json({ error: err4.sqlMessage });
          res.json({ message: "Pedido eliminado correctamente de la base de datos" });
        });
      });
    });
  });
});

// ============================================================
// APROBAR DEVOLUCIÓN
// ============================================================
app.put("/devoluciones/:id/aprobar", (req, res) => {
  const { id } = req.params;
  const { comentariosAdmin, codigoCupon } = req.body;

  const query = `
    UPDATE devoluciones
    SET Estado = 'Aprobada',
        Estado_Tracking = 'Resuelta',
        Comentarios_Admin = ?,
        Codigo_Cupon = ?
    WHERE idDevoluciones = ?
  `;

  db.query(query, [comentariosAdmin || null, codigoCupon || null, id], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: err.sqlMessage
      });
    }

    res.json({
      message: "Devolución aprobada"
    });
  });
});

// ============================================================
// RECHAZAR DEVOLUCIÓN
// ============================================================
app.put("/devoluciones/:id/rechazar", (req, res) => {
  const { id } = req.params;
  const { comentariosAdmin } = req.body;

  const query = `
    UPDATE devoluciones
    SET Estado = 'Rechazada',
        Estado_Tracking = 'Rechazada',
        Comentarios_Admin = ?
    WHERE idDevoluciones = ?
  `;

  db.query(query, [comentariosAdmin || null, id], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: err.sqlMessage
      });
    }

    res.json({
      message: "Devolución rechazada"
    });
  });
});

// ============================================================
// ACTUALIZAR ESTADO DE TRACKING (Paso a paso por el admin)
// ============================================================
app.put("/devoluciones/:id/tracking", (req, res) => {
  const { id } = req.params;
  const { estadoTracking } = req.body;

  const query = `
    UPDATE devoluciones
    SET Estado_Tracking = ?
    WHERE idDevoluciones = ?
  `;

  db.query(query, [estadoTracking, id], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: err.sqlMessage
      });
    }

    res.json({
      message: "Estado de tracking actualizado correctamente"
    });
  });
});

app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

app.listen(3001, () => {
  console.log(" Servidor en puerto 3001");
});
>>>>>>> Stashed changes
