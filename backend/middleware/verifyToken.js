const jwt = require("jsonwebtoken");


function verifyToken(req, res, next) {
  // Obtener el header Authorization
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({
      message: "Acceso denegado. Token no proporcionado."
    });
  }

  // Debe venir como: Bearer eyJhbGc...
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Token inválido."
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Guardamos los datos del usuario para usarlos después
    req.usuario = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token inválido o expirado."
    });
  }
}

module.exports = verifyToken;