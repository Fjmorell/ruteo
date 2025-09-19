import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DashboardAdmin from "./pages/DashboardAdmin"; // 👈 importa el admin
import AdminMapaGeneral from "./pages/AdminMapaGeneral";
import CrearChofer from "./pages/CrearChofer";
import LoginChofer from "./pages/LoginChofer";





function App() {
  return (
    <Router>
      <Routes>
        {/* Página inicial → Login */}
        <Route path="/" element={<Login />} />

        {/* Dashboard del chofer */}
        <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin" element={<DashboardAdmin />} /> {/* 👈 nueva ruta */}
                <Route path="/admin/mapa" element={<AdminMapaGeneral />} />
                <Route path="/admin/crear-chofer" element={<CrearChofer />} />
                <Route path="/login" element={<LoginChofer />} />




      </Routes>
    </Router>
  );
}

export default App;
