import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import DashboardChofer from "./pages/DashboardChofer"; // 👈 chofer
import DashboardAdmin from "./pages/DashboardAdmin";   // 👈 admin
import AdminMapaGeneral from "./pages/AdminMapaGeneral";
import CrearChofer from "./pages/CrearChofer";
import LoginChofer from "./pages/LoginChofer";
import AdminChoferDetalle from "./pages/AdminChoferDetalle";


function App() {
  return (
    <Router>
      <Routes>
        {/* Página inicial → Login Admin */}
        <Route path="/" element={<Login />} />

        {/* Dashboard del chofer */}
        <Route path="/dashboard" element={<DashboardChofer />} />

        {/* Dashboard del admin */}
        <Route path="/admin" element={<DashboardAdmin />} />
        <Route path="/admin/mapa" element={<AdminMapaGeneral />} />
        <Route path="/admin/crear-chofer" element={<CrearChofer />} />

        {/* Login de chofer */}
        <Route path="/login" element={<LoginChofer />} />
        <Route path="/admin/chofer/:choferId" element={<AdminChoferDetalle />} />

      </Routes>
    </Router>
  );
}

export default App;
