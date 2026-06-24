import { useState } from "react";
import Productos from "../components/Productos";
import Cotizar from "../components/Cotizar";
import Mensaje from "../components/Mensaje";

function Cotizaciones() {
  const [productoSeleccionado, setProductoSeleccionado] = useState("");

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Módulo de Cotizaciones</h2>

      <Productos seleccionarProducto={setProductoSeleccionado} />
      <Cotizar productoSeleccionado={productoSeleccionado} />
      <Mensaje />
    </div>
  );
}

export default Cotizaciones;