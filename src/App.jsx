import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DashboardAdmin from "./pages/DashboardAdmin"; // 👈 importa el admin


function App() {
  return (
    <Router>
      <Routes>
        {/* Página inicial → Login */}
        <Route path="/" element={<Login />} />

        {/* Dashboard del chofer */}
        <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin" element={<DashboardAdmin />} /> {/* 👈 nueva ruta */}

      </Routes>
    </Router>
  );
}

export default App;
