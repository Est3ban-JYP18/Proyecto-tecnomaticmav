import { useEffect, useState } from "react";
import Swal from "sweetalert2";

function MisPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  const usuario = JSON.parse(localStorage.getItem("usuario"));

  useEffect(() => {
    obtenerPedidos();
  }, []);

  const obtenerPedidos = async () => {
    try {
      const res = await fetch(
        `http://localhost:3001/mis-pedidos/${usuario.idUsuarios}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error al obtener pedidos");
      }

      setPedidos(data);
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los pedidos",
        confirmButtonColor: "#4F7A96",
      });
    } finally {
      setLoading(false);
    }
  };

  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case "Pagada":
        return "success";

      case "Pendiente":
        return "warning";

      case "Cancelada":
        return "danger";

      default:
        return "secondary";
    }
  };

  const obtenerColorEntrega = (estado) => {
    switch (estado) {
      case "Entregado":
        return "success";

      case "En Proceso":
        return "primary";

      case "Devuelto":
        return "danger";

      default:
        return "secondary";
    }
  };

  return (
    <div className="container py-5">
      <div className="d-flex align-items-center mb-4">
        <i
          className="bi bi-bag-check-fill me-3"
          style={{
            fontSize: "2rem",
            color: "#4F7A96",
          }}
        ></i>

        <div>
          <h2 className="fw-bold mb-0">Mis Pedidos</h2>

          <small className="text-muted">
            Historial de compras realizadas
          </small>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div
            className="spinner-border"
            style={{ color: "#4F7A96" }}
            role="status"
          ></div>

          <p className="mt-3 text-muted">
            Cargando pedidos...
          </p>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="card shadow-sm border-0 text-center p-5">
          <i
            className="bi bi-cart-x"
            style={{
              fontSize: "4rem",
              color: "#999",
            }}
          ></i>

          <h4 className="mt-3">No tienes pedidos</h4>

          <p className="text-muted">
            Aún no has realizado compras en la plataforma.
          </p>
        </div>
      ) : (
        <div className="row">
          {pedidos.map((pedido) => (
            <div
              key={pedido.idFacturas}
              className="col-12 mb-4"
            >
              <div
                className="card border-0 shadow-sm"
                style={{
                  borderRadius: "16px",
                }}
              >
                <div className="card-body">
                  <div className="row align-items-center">

                    {/* FACTURA */}
                    <div className="col-md-3 mb-3 mb-md-0">
                      <h5 className="fw-bold">
                        Pedido #{pedido.idFacturas}
                      </h5>

                      <small className="text-muted">
                        {new Date(pedido.Fecha).toLocaleString()}
                      </small>
                    </div>

                    {/* TOTAL */}
                    <div className="col-md-2 mb-3 mb-md-0">
                      <span className="fw-bold">
                        ${Number(pedido.Total).toLocaleString()}
                      </span>
                    </div>

                    {/* ESTADO FACTURA */}
                    <div className="col-md-3 mb-3 mb-md-0">
                      <span
                        className={`badge bg-${obtenerColorEstado(
                          pedido.Estado
                        )}`}
                      >
                        {pedido.Estado}
                      </span>
                    </div>

                    {/* ENTREGA */}
                    <div className="col-md-2 mb-3 mb-md-0">
                      <span
                        className={`badge bg-${obtenerColorEntrega(
                          pedido.Estado_Entrega
                        )}`}
                      >
                        {pedido.Estado_Entrega || "Sin entrega"}
                      </span>
                    </div>

                    {/* BOTONES */}
                    <div className="col-md-2 text-md-end">

                      {/* VER */}
                      <button
                        className="btn text-white mb-2 w-100"
                        style={{
                          background: "#4F7A96",
                          borderRadius: "10px",
                        }}
                        onClick={() => {
                          Swal.fire({
                            icon: "info",
                            title: `Pedido #${pedido.idFacturas}`,
                            html: `
                              <div style="text-align:left">
                                <p>
                                  <b>Fecha:</b><br/>
                                  ${new Date(
                                    pedido.Fecha
                                  ).toLocaleString()}
                                </p>

                                <p>
                                  <b>Total:</b><br/>
                                  $${Number(
                                    pedido.Total
                                  ).toLocaleString()}
                                </p>

                                <p>
                                  <b>Estado:</b><br/>
                                  ${pedido.Estado}
                                </p>

                                <p>
                                  <b>Entrega:</b><br/>
                                  ${
                                    pedido.Estado_Entrega ||
                                    "Sin entrega"
                                  }
                                </p>
                              </div>
                            `,
                            confirmButtonColor: "#4F7A96",
                          });
                        }}
                      >
                        <i className="bi bi-eye me-2"></i>
                        Ver
                      </button>

                      {/* DEVOLUCIÓN */}
                      <button
                        className="btn btn-warning w-100"
                        onClick={async () => {

                          const { value: motivo } = await Swal.fire({
                            title: "Motivo de devolución",
                            input: "text",
                            inputPlaceholder:
                              "Escribe el motivo",
                            showCancelButton: true,
                            confirmButtonText: "Enviar",
                          });

                          if (!motivo) return;

                          try {
                            const res = await fetch(
                              "http://localhost:3001/devoluciones",
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type":
                                    "application/json",
                                },
                                body: JSON.stringify({
                                  facturaId:
                                    pedido.idFacturas,

                                  productoId: 1,

                                  usuarioId:
                                    usuario.idUsuarios,

                                  cantidad: 1,

                                  motivo,
                                }),
                              }
                            );

                            const data = await res.json();

                            if (!res.ok) {
                              throw new Error(data.error);
                            }

                            Swal.fire({
                              icon: "success",
                              title: "Solicitud enviada",
                              text:
                                "La devolución fue registrada",
                              confirmButtonColor:
                                "#4F7A96",
                            });

                          } catch (error) {
                            Swal.fire({
                              icon: "error",
                              title: "Error",
                              text: error.message,
                            });
                          }
                        }}
                      >
                        Solicitar devolución
                      </button>

                    </div>

                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MisPedidos;