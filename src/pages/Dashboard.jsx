import TablaCotizaciones from "../components/TablaCotizaciones";
import TablaProductos from "../components/TablaProductos";
import ResumenAdmin from "../components/ResumenAdmin";

function Dashboard({ usuario, setPagina }) {
  const [seccion, setSeccion] = useState("resumen");

  return (
    <div className="container mt-5">
      <h2 className="fw-bold">
        Bienvenido, {usuario?.nombres}
      </h2>

      <div className="row g-4 mt-4">
        <div className="col-md-4">
          <button
            className="btn btn-dark w-100"
            onClick={() => setSeccion("resumen")}
          >
            Ver resumen
          </button>
        </div>

        <div className="col-md-4">
          <button
            className="btn btn-dark w-100"
            onClick={() => setSeccion("cotizaciones")}
          >
            Cotizaciones
          </button>
        </div>

        <div className="col-md-4">
          <button
            className="btn btn-dark w-100"
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







































/* 
function Dashboard({ usuario, setPagina }) {
  return (
    <div className="container mt-5">

      
      <div className="mb-4">
        <h2 className="fw-bold">Bienvenido, {usuario?.correo}</h2>
        <p className="text-muted">Panel de control del sistema</p>
      </div>

      
      <div className="row g-4">

        
        <div className="col-md-4">
          <div className="card shadow-sm h-100 text-center p-3">
            <h5 className="fw-bold">Inventario</h5>
            <p>Gestiona los productos disponibles</p>
            <button className="btn btn-dark">
              Ver Inventario
            </button>
          </div>
        </div>

        
        <div className="col-md-4">
          <div className="card shadow-sm h-100 text-center p-3">
            <h5 className="fw-bold">Cotizaciones</h5>
            <p>Crea y consulta cotizaciones</p>
            <button className="btn btn-dark">
              Ir a Cotizaciones
            </button>
          </div>
        </div>

        
        <div className="col-md-4">
          <div className="card shadow-sm h-100 text-center p-3">
            <h5 className="fw-bold">Perfil</h5>
            <p>Consulta tu información</p>
            <button className="btn btn-dark">
              Ver Perfil
            </button>
          </div>
        </div>

      </div>

      
      <div className="mt-5 text-end">
        <button
          className="btn btn-danger"
          onClick={() => {
            localStorage.removeItem("token");
            setPagina("home");
          }}
        >
          Cerrar Sesión
        </button>
      </div>

    </div>
  );
} 

export default Dashboard;
*/



/*
import { useState } from "react";
import Productos from "../components/Productos.jsx";
import Cotizar from "../components/Cotizar.jsx";
import Mensaje from "../components/Mensaje.jsx";

function Dashboard({ usuario, setPagina }) {
  const [productoSeleccionado, setProductoSeleccionado] = useState("");

  const logout = () => {
    localStorage.removeItem("token");
    setPagina("home");
  };

  return (
    <div style={{ padding: "20px" }}>
      
      <h2>Bienvenido, {usuario?.correo}</h2>

      <button onClick={logout}>Cerrar sesión</button>

      <hr />

      <Productos seleccionarProducto={setProductoSeleccionado} />
      <Cotizar productoSeleccionado={productoSeleccionado} />
      <Mensaje />

    </div>
  );
}

export default Dashboard;
*/ 