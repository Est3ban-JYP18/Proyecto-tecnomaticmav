// App main component
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


function App() {
  const [pagina, setPagina] = useState("home");
  const [usuario, setUsuario] = useState(null);
  
  // Estado del Carrito de Compras Global
  const [carrito, setCarrito] = useState(() => {
    const saved = localStorage.getItem("carrito");
    return saved ? JSON.parse(saved) : [];
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
  const agregarAlCarrito = (producto) => {
    setCarrito((prev) => {
      // Comparar por idProductos de MySQL
      const index = prev.findIndex((item) => item.idProductos === producto.idProductos);
      if (index > -1) {
        const nuevo = [...prev];
        nuevo[index].cantidad += 1;
        return nuevo;
      } else {
        return [...prev, { ...producto, cantidad: 1 }];
      }
    });
  };

  const eliminarDelCarrito = (id) => {
    setCarrito((prev) => prev.filter((item) => item.idProductos !== id));
  };

  const actualizarCantidad = (id, cantidad) => {
    setCarrito((prev) =>
      prev.map((item) =>
        item.idProductos === id ? { ...item, cantidad: Math.max(1, cantidad) } : item
      )
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
        return usuario?.rol === "admin"
          ? <TablaCotizaciones />
          : <Home setPagina={setPagina} />;

      case "tablaProductos":
        return usuario?.rol === "admin"
          ? <TablaProductos />
          : <Home setPagina={setPagina} />;

      case "tablaUsuarios":
        return usuario?.rol === "admin"
          ? <TablaUsuarios />
          : <Home setPagina={setPagina} />;

      case "devoluciones":
        return usuario?.rol === "admin"
          ? <Devoluciones />
          : <Home setPagina={setPagina} />;

      case "misPedidos":
        return usuario?.rol === "cliente"
          ? <MisPedidos usuario={usuario} setPagina={setPagina} />
          : <Home setPagina={setPagina} />;

      case "panel":
        return usuario?.rol === "contador"
          ? <Panel />
          : <Home setPagina={setPagina} />;

      default:
        return <Home setPagina={setPagina} />;
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar setPagina={setPagina} usuario={usuario} cantidadCarrito={carrito.reduce((acc, p) => acc + p.cantidad, 0)} />
      <main className="flex-fill">{renderPagina()}</main>
      <Footer setPagina={setPagina} />
    </div>
  );
}

export default App;