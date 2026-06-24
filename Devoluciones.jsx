import { useEffect, useState } from "react";
import Swal from "sweetalert2";

function Devoluciones() {

  const [devoluciones, setDevoluciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // OBTENER DEVOLUCIONES
  const obtenerDevoluciones = async () => {

    try {

      const res = await fetch(
        "http://localhost:3001/devoluciones"
      );

      const data = await res.json();

      console.log(data);

      if (Array.isArray(data)) {

        // SI EL ESTADO VIENE NULL
        const devolucionesFormateadas = data.map((d) => ({
          ...d,
          Estado: d.Estado || "Pendiente",
        }));

        setDevoluciones(devolucionesFormateadas);

      } else {

        setDevoluciones([]);
        console.error("La API no devolvió un array");

      }

    } catch (error) {

      console.error(error);
      setDevoluciones([]);

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    obtenerDevoluciones();
  }, []);

  // APROBAR
  const aprobar = async (id) => {

    try {

      const res = await fetch(
        `http://localhost:3001/devoluciones/${id}/aprobar`,
        {
          method: "PUT",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      // ESPERAR ACTUALIZACIÓN
      await obtenerDevoluciones();

      Swal.fire({
        icon: "success",
        title: "Devolución aprobada",
      });

    } catch (error) {

      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
    }
  };

  // RECHAZAR
  const rechazar = async (id) => {

    try {

      const res = await fetch(
        `http://localhost:3001/devoluciones/${id}/rechazar`,
        {
          method: "PUT",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      // ESPERAR ACTUALIZACIÓN
      await obtenerDevoluciones();

      Swal.fire({
        icon: "success",
        title: "Devolución rechazada",
      });

    } catch (error) {

      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
    }
  };

  // COLOR ESTADO
  const colorEstado = (estado) => {

    switch (estado) {

      case "Pendiente":
        return "warning";

      case "Aprobada":
        return "success";

      case "Rechazada":
        return "danger";

      default:
        return "secondary";
    }
  };

  return (

    <div className="container py-5">

      <div className="d-flex align-items-center mb-4">

        <i
          className="bi bi-arrow-return-left me-3"
          style={{
            fontSize: "2rem",
            color: "#4F7A96",
          }}
        ></i>

        <div>

          <h2 className="fw-bold mb-0">
            Gestión de Devoluciones
          </h2>

          <small className="text-muted">
            Panel administrativo
          </small>

        </div>

      </div>

      {loading ? (

        <div className="text-center py-5">

          <div
            className="spinner-border"
            style={{ color: "#4F7A96" }}
          ></div>

        </div>

      ) : devoluciones.length === 0 ? (

        <div className="alert alert-info">
          No hay devoluciones registradas.
        </div>

      ) : (

        <div className="table-responsive">

          <table className="table table-hover align-middle">

            <thead className="table-dark">

              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Producto</th>
                <th>Factura</th>
                <th>Cantidad</th>
                <th>Motivo</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>

            </thead>

            <tbody>

              {devoluciones.map((d) => (

                <tr key={d.idDevoluciones}>

                  <td>{d.idDevoluciones}</td>

                  <td>
                    {d.Nombres} {d.Apellidos}
                  </td>

                  <td>{d.Nombre_Producto}</td>

                  <td>
                    #{d.Facturas_idFacturas}
                  </td>

                  <td>{d.Cantidad}</td>

                  <td>{d.Motivo}</td>

                  <td>

                    <span
                      className={`badge bg-${colorEstado(d.Estado)}`}
                    >
                      {d.Estado}
                    </span>

                  </td>

                  <td>
                    {new Date(d.Fecha).toLocaleString()}
                  </td>

                  <td>

                    {d.Estado === "Pendiente" && (

                      <div className="d-flex gap-2">

                        <button
                          className="btn btn-success btn-sm"
                          onClick={() =>
                            aprobar(d.idDevoluciones)
                          }
                        >
                          Aprobar
                        </button>

                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() =>
                            rechazar(d.idDevoluciones)
                          }
                        >
                          Rechazar
                        </button>

                      </div>

                    )}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

    </div>
  );
}

export default Devoluciones;