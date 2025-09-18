import { useState } from "react";
import FormChofer from "../components/FormChofer";
import FormVehiculo from "../components/FormVehiculo";
import FormBanco from "../components/FormBanco";
import FormDocumentos from "../components/FormDocumentos";
import { MapaRutas } from "../components/MapaRutas";
import logo from "../assets/logo-logistica-argentina.png";
import ChoferTracker from "../components/ChoferTracker";
import MapaChofer from "../components/MapaChofer"; // 👈 nuevo componente

export default function Dashboard() {
  const [active, setActive] = useState("datos");
  const [menuOpen, setMenuOpen] = useState(false);

  // 👇 UUID del chofer logueado (ahora está hardcodeado, después lo vas a traer del login)
  const choferId = "b5a8f906-250d-458f-b955-76889c100ff4";

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Botón Hamburguesa (mobile) */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-blue-800 text-white p-2 rounded"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside
        className={`w-64 bg-blue-800 text-white p-6 space-y-4 
          md:relative fixed inset-y-0 left-0 transform 
          ${menuOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0 transition-transform duration-300 ease-in-out z-40`}
      >
        <div className="mb-6 flex items-center justify-center">
          <img src={logo} alt="Logo Logística Argentina" className="w-32 h-auto" />
        </div>
        <ul className="space-y-2">
          <li>
            <button
              className={`w-full text-left px-4 py-2 rounded ${
                active === "datos" ? "bg-blue-600" : "hover:bg-blue-700"
              }`}
              onClick={() => {
                setActive("datos");
                setMenuOpen(false);
              }}
            >
              Datos Personales
            </button>
          </li>
          <li>
            <button
              className={`w-full text-left px-4 py-2 rounded ${
                active === "vehiculo" ? "bg-blue-600" : "hover:bg-blue-700"
              }`}
              onClick={() => {
                setActive("vehiculo");
                setMenuOpen(false);
              }}
            >
              Vehículo
            </button>
          </li>
          <li>
            <button
              className={`w-full text-left px-4 py-2 rounded ${
                active === "banco" ? "bg-blue-600" : "hover:bg-blue-700"
              }`}
              onClick={() => {
                setActive("banco");
                setMenuOpen(false);
              }}
            >
              Cuenta Bancaria
            </button>
          </li>
          <li>
            <button
              className={`w-full text-left px-4 py-2 rounded ${
                active === "documentos" ? "bg-blue-600" : "hover:bg-blue-700"
              }`}
              onClick={() => {
                setActive("documentos");
                setMenuOpen(false);
              }}
            >
              Documentos
            </button>
          </li>
          <li>
            <button
              className={`w-full text-left px-4 py-2 rounded ${
                active === "ruteo" ? "bg-blue-600" : "hover:bg-blue-700"
              }`}
              onClick={() => {
                setActive("ruteo");
                setMenuOpen(false);
              }}
            >
              Ruteo
            </button>
          </li>
          <li>
            <button
              className={`w-full text-left px-4 py-2 rounded ${
                active === "seguimiento" ? "bg-blue-600" : "hover:bg-blue-700"
              }`}
              onClick={() => {
                setActive("seguimiento");
                setMenuOpen(false);
              }}
            >
              Seguimiento
            </button>
          </li>
        </ul>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 p-8 md:ml-0 ml-0 md:mt-0 mt-16">
        <h1 className="text-3xl font-bold mb-6">Dashboard del Chofer</h1>

        {active === "datos" && <FormChofer />}
        {active === "vehiculo" && <FormVehiculo />}
        {active === "banco" && <FormBanco />}
        {active === "documentos" && <FormDocumentos />}
        {active === "ruteo" && <MapaRutas />}
        {active === "seguimiento" && (
          <div className="space-y-6">
            {/* Chofer envía ubicación */}
            <ChoferTracker choferId={choferId} />

            {/* Chofer ve su ubicación en el mapa */}
            <MapaChofer choferId={choferId} />
          </div>
        )}
      </main>
    </div>
  );
}
