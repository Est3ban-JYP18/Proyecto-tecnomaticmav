import { useState, useEffect } from "react";

function Cotizar() {
  const [cargando, setCargando] = useState(false);
  const [usuario, setUsuario] = useState(null);

  // 🟢 Estados para inputs (controlados)
  const [cliente, setCliente] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");

  // 🔥 Cargar usuario logueado
  useEffect(() => {
    const user = localStorage.getItem("usuario");

    if (user) {
      const userParse = JSON.parse(user);
      setUsuario(userParse);

      // 🔥 Autorellenar
      setCliente(userParse.nombre || "");
      setCorreo(userParse.correo || "");
      setTelefono(userParse.telefono || "");
    }
  }, []);

  // 🟢 Productos disponibles
  const productosDisponibles = [
    "Chaqueta Industrial",
    "Botas de Seguridad",
    "Guantes Anticorte",
    "Casco Industrial",
  ];

  const [productosSeleccionados, setProductosSeleccionados] = useState([
    { producto: "", cantidad: 1 },
  ]);

  const agregarProducto = () => {
    setProductosSeleccionados([
      ...productosSeleccionados,
      { producto: "", cantidad: 1 },
    ]);
  };

  const eliminarProducto = (index) => {
    const nuevos = [...productosSeleccionados];
    nuevos.splice(index, 1);
    setProductosSeleccionados(nuevos);
  };

  const handleChange = (index, campo, valor) => {
    const nuevos = [...productosSeleccionados];
    nuevos[index][campo] = valor;
    setProductosSeleccionados(nuevos);
  };

  const cotizar = async (e) => {
    e.preventDefault();

    if (productosSeleccionados.some((p) => !p.producto)) {
      alert("Selecciona todos los productos");
      return;
    }

    setCargando(true);

    const data = {
      Cliente: cliente,
      Correo: correo,
      Telefono: telefono,
      Productos: productosSeleccionados,
      Estado: "Pendiente",
      Fecha: new Date().toLocaleDateString(),
    };

    try {
      const respuesta = await fetch(
        "https://69c55e5e8a5b6e2dec2c4b3c.mockapi.io/cotizaciones",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!respuesta.ok) throw new Error("Error en la petición");

      alert("✅ Cotización enviada correctamente");

      setProductosSeleccionados([{ producto: "", cantidad: 1 }]);

    } catch (error) {
      console.error(error);
      alert("❌ Hubo un error al enviar la cotización");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center mt-5">
      <div className="card shadow-lg p-4" style={{ maxWidth: "600px", width: "100%" }}>
        <h3 className="text-center mb-4 text-primary">
          Solicitar Cotización
        </h3>

        <form onSubmit={cotizar}>

          {/* Nombre */}
          <div className="mb-3">
            <label className="form-label fw-bold">Nombre</label>
            <input
              className="form-control"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              required
            />
          </div>

          {/* Correo */}
          <div className="mb-3">
            <label className="form-label fw-bold">Correo</label>
            <input
              type="email"
              className="form-control"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>

          {/* Teléfono */}
          <div className="mb-3">
            <label className="form-label fw-bold">Teléfono</label>
            <input
              type="text"
              className="form-control"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              required
            />
          </div>

          {/* Productos */}
          <div className="mb-3">
            <label className="form-label fw-bold">Productos</label>

            {productosSeleccionados.map((item, index) => (
              <div key={index} className="d-flex gap-2 mb-2">

                <select
                  className="form-select"
                  value={item.producto}
                  onChange={(e) =>
                    handleChange(index, "producto", e.target.value)
                  }
                  required
                >
                  <option value="">Seleccionar producto</option>
                  {productosDisponibles.map((p, i) => (
                    <option key={i} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={item.cantidad}
                  onChange={(e) =>
                    handleChange(index, "cantidad", e.target.value)
                  }
                  required
                />

                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => eliminarProducto(index)}
                >
                  X
                </button>
              </div>
            ))}

            <button
              type="button"
              className="btn btn-secondary mt-2"
              onClick={agregarProducto}
            >
              + Agregar producto
            </button>
          </div>

          {/* Botón */}
          <div className="d-grid mt-4">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={cargando}
            >
              {cargando ? "Enviando..." : "Cotizar ahora"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Cotizar;