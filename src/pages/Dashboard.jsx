import { useState } from "react";
import TablaCotizaciones from "../components/TablaCotizaciones";
import TablaProductos from "../components/TablaProductos";
import ResumenAdmin from "../components/ResumenAdmin";

function Dashboard({ usuario, setPagina }) {
  const [seccion, setSeccion] = useState("resumen");

  return (
    <div className="container mt-5">
      <h2 className="fw-bold">
        Bienvenido, {usuario?.nombre || usuario?.nombres || "Usuario"}
      </h2>

      <div className="row g-4 mt-4">
        <div className="col-md-4">
          <button
            className={`btn w-100 ${seccion === "resumen" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setSeccion("resumen")}
          >
            Ver resumen
          </button>
        </div>

        <div className="col-md-4">
          <button
            className={`btn w-100 ${seccion === "cotizaciones" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setSeccion("cotizaciones")}
          >
            Pedidos y Cotizaciones
          </button>
        </div>

        <div className="col-md-4">
          <button
            className={`btn w-100 ${seccion === "productos" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setSeccion("productos")}
          >
            Productos
          </button>
        </div>
      </div>

      <div className="mt-5">
        {seccion === "resumen" && <ResumenAdmin />}
        {seccion === "cotizaciones" && <TablaCotizaciones />}
        {seccion === "productos" && <TablaProductos />}
      </div>

      <div className="text-end mt-5">
        <button
          className="btn btn-danger"
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("usuario");
            setPagina("home");
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default Dashboard;