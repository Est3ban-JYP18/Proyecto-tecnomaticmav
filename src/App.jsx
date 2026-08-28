import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Productos from "./components/Productos";
import Navbar from "./components/Navbar";
import Informacion from "./components/Informacion";
import Footer from "./components/Footer";
import TablaCotizaciones from "./components/TablaCotizaciones";
import TablaProductos from "./components/TablaProductos";
import Carrito from "./components/Carrito";
import Panel from "./components/Panel";
import TablaUsuarios from "./components/TablaUsuarios";
import MisPedidos from "./components/MisPedidos";
import Devoluciones from "./components/Devoluciones";
import Swal from "sweetalert2";

function App() {
  const [pagina, setPagina] = useState("home");
  const [usuario, setUsuario] = useState(null);

  // Estado del Carrito de Compras Global
  const [carrito, setCarrito] = useState(() => {
    const saved = localStorage.getItem("carrito");
    try {
      // Los artículos antiguos no tenían talla; se conservan como talla M.
      return saved
        ? JSON.parse(saved).map((item) => ({
            ...item,
            Talla: item.Talla || "M",
            Color: item.Color || "Único",
          }))
        : [];
    } catch {
      return [];
    }
  });

  // Persistir carrito en localStorage
  useEffect(() => {
    localStorage.setItem("carrito", JSON.stringify(carrito));
  }, [carrito]);

  // Cargar usuario persistido y mapear rol
  useEffect(() => {
    const user = localStorage.getItem("usuario");
    if (user) {
      const parsedUser = JSON.parse(user);
      // Asegurar el mapeo de Roles_idRoles si existe
      if (parsedUser.Roles_idRoles && !parsedUser.rol) {
        if (parsedUser.Roles_idRoles === 1) parsedUser.rol = "admin";
        else if (parsedUser.Roles_idRoles === 2) parsedUser.rol = "contador";
        else parsedUser.rol = "cliente";
      }
      setUsuario(parsedUser);
    }
  }, []);

  const handleLogin = (user) => {
    setUsuario(user);
    setPagina("home");
  };

  // Funciones de Carrito
  const agregarAlCarrito = (producto, talla = "M", color = "Único") => {
    const stockDisponible =
      producto.Stock !== undefined ? Number(producto.Stock) : 9999;

    if (stockDisponible <= 0) {
      Swal.fire({
        icon: "error",
        title: "Producto Agotado",
        text: "Lo sentimos, este producto no cuenta con unidades disponibles en este momento.",
        confirmButtonColor: "#0047AB",
      });
      return;
    }

    setCarrito((prev) => {
      // Cada combinación producto + talla tiene su propia línea en el carrito.
      const index = prev.findIndex(
        (item) =>
          item.idProductos === producto.idProductos && item.Talla === talla && item.Color === color,
      );
      const cantidadTotalProducto = prev
        .filter((item) => item.idProductos === producto.idProductos)
        .reduce((total, item) => total + item.cantidad, 0);
      if (index > -1) {
        const nuevo = [...prev];
        if (cantidadTotalProducto < stockDisponible) {
          nuevo[index].cantidad += 1;
        } else {
          Swal.fire({
            icon: "warning",
            title: "Límite de Stock Alcanzado",
            text: `No puedes agregar más unidades de las disponibles (${stockDisponible} unidades en inventario).`,
            confirmButtonColor: "#0047AB",
          });
        }
        return nuevo;
      } else {
        if (cantidadTotalProducto >= stockDisponible) {
          Swal.fire({
            icon: "warning",
            title: "Límite de Stock Alcanzado",
            text: `No puedes agregar más unidades de las disponibles (${stockDisponible} unidades en inventario).`,
            confirmButtonColor: "#0047AB",
          });
          return prev;
        }
        return [...prev, { ...producto, Talla: talla, Color: color, cantidad: 1 }];
      }
    });
  };

  const eliminarDelCarrito = (id, talla, color) => {
    setCarrito((prev) =>
      prev.filter((item) => !(item.idProductos === id && item.Talla === talla && (item.Color || "Único") === color)),
    );
  };

  const actualizarCantidad = (id, talla, color, cantidad) => {
    setCarrito((prev) =>
      prev.map((item) => {
        if (item.idProductos === id && item.Talla === talla && (item.Color || "Único") === color) {
          const stockDisponible =
            item.Stock !== undefined ? Number(item.Stock) : 9999;
          const cantidadOtrasTallas = prev
            .filter((otro) => !(otro.idProductos === id && otro.Talla === talla && (otro.Color || "Único") === color))
            .reduce((total, otro) => total + otro.cantidad, 0);
          const maximoParaEstaTalla = Math.max(
            0,
            stockDisponible - cantidadOtrasTallas,
          );
          if (cantidad > maximoParaEstaTalla) {
            Swal.fire({
              icon: "warning",
              title: "Límite de Stock Alcanzado",
              text: `Solo hay ${stockDisponible} unidades disponibles de este producto.`,
              confirmButtonColor: "#0047AB",
            });
            return { ...item, cantidad: Math.max(1, maximoParaEstaTalla) };
          }
          return { ...item, cantidad: Math.max(1, cantidad) };
        }
        return item;
      }),
    );
  };

  const vaciarCarrito = () => {
    setCarrito([]);
  };

  const renderPagina = () => {
    switch (pagina) {
      case "login":
        return <Login onLogin={handleLogin} />;

      case "productos":
        return (
          <Productos
            agregarAlCarrito={agregarAlCarrito}
            carrito={carrito}
            usuario={usuario}
            setPagina={setPagina}
          />
        );

      case "carrito":
        return (
          <Carrito
            carrito={carrito}
            eliminarDelCarrito={eliminarDelCarrito}
            actualizarCantidad={actualizarCantidad}
            vaciarCarrito={vaciarCarrito}
            usuario={usuario}
            setPagina={setPagina}
          />
        );

      case "informacion":
        return <Informacion />;

      case "tablaCotizaciones":
        return usuario?.rol === "admin" ? (
          <TablaCotizaciones />
        ) : (
          <Home setPagina={setPagina} />
        );

      case "tablaProductos":
        return usuario?.rol === "admin" ? (
          <TablaProductos />
        ) : (
          <Home setPagina={setPagina} />
        );

      case "tablaUsuarios":
        return usuario?.rol === "admin" ? (
          <TablaUsuarios />
        ) : (
          <Home setPagina={setPagina} />
        );

      case "devoluciones":
        return usuario?.rol === "admin" ? (
          <Devoluciones />
        ) : (
          <Home setPagina={setPagina} />
        );

      case "misPedidos":
        console.log("Usuario en MisPedidos:", usuario);
        return usuario?.rol === "cliente" ? (
          <MisPedidos usuario={usuario} setPagina={setPagina} />
        ) : (
          <Home setPagina={setPagina} />
        );

      case "panel":
        return usuario?.rol === "contador" ? (
          <Panel />
        ) : (
          <Home setPagina={setPagina} />
        );

      default:
        return <Home setPagina={setPagina} />;
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar
        setPagina={setPagina}
        usuario={usuario}
        cantidadCarrito={carrito.reduce((acc, p) => acc + p.cantidad, 0)}
      />
      <main className="flex-fill">{renderPagina()}</main>
      <Footer setPagina={setPagina} />
    </div>
  );
}

export default App;
