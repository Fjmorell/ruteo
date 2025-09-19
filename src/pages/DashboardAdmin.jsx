// src/pages/DashboardAdmin.jsx
import { useState, useEffect } from "react";
import logo from "../assets/logo-logistica-argentina.png";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import FormCrearChofer from "../components/FormCrearChofer";
import MapaChofer from "../components/MapaChofer";
import MapaAdminGeneral from "../components/MapaAdminGeneral";


export default function DashboardAdmin() {
  const [active, setActive] = useState("seguimiento");
  const [menuOpen, setMenuOpen] = useState(false);
  const [choferes, setChoferes] = useState([]);
  const [editChofer, setEditChofer] = useState(null);
  const [choferSeleccionado, setChoferSeleccionado] = useState(null);
  const navigate = useNavigate();

  // 🔹 cargar choferes
  const fetchChoferes = async () => {
    const { data, error } = await supabase.from("choferes").select("*");
    if (!error) setChoferes(data);
  };

  useEffect(() => {
    if (active === "crearChofer" || active === "seguimiento") {
      fetchChoferes();
    }
  }, [active]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // 🔹 Guardar edición (tabla choferes + Auth vía Edge Function)
  const handleUpdate = async () => {
    if (!editChofer) return;

    const { error } = await supabase
      .from("choferes")
      .update({
        nombre: editChofer.nombre,
        apellido: editChofer.apellido,
        email: editChofer.email,
        telefono: editChofer.telefono,
        direccion: editChofer.direccion,
      })
      .eq("id", editChofer.id);

    if (error) {
      alert("❌ Error al actualizar en tabla: " + error.message);
      return;
    }

    try {
      const res = await fetch(
        "https://ijptwyglnrpizhrwfgnq.functions.supabase.co/update-chofer",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: editChofer.id,
            email: editChofer.email,
            telefono: editChofer.telefono,
            direccion: editChofer.direccion,
            nombre: editChofer.nombre,
            apellido: editChofer.apellido,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert("⚠️ Editado en tabla, pero no en Auth. Revisar función Edge.");
      } else {
        alert("✅ Chofer actualizado correctamente");
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Editado en tabla, pero error al conectar con Auth");
    }

    setEditChofer(null);
    fetchChoferes();
  };

  // 🔹 Eliminar chofer
  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este chofer?")) return;

    const chofer = choferes.find((c) => c.id === id);

    const { error } = await supabase.from("choferes").delete().eq("id", id);
    if (error) {
      alert("❌ Error al eliminar de choferes: " + error.message);
      return;
    }

    const res = await fetch(
      "https://ijptwyglnrpizhrwfgnq.functions.supabase.co/delete-chofer",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      }
    );

    if (res.ok) {
      alert(`✅ Chofer eliminado: ${chofer?.email}`);
      fetchChoferes();
    } else {
      alert("⚠️ Eliminado de tabla, pero no de Auth. Revisar función Edge.");
    }
  };

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
        <div className="mb-6 flex flex-col items-center justify-center">
          <img src={logo} alt="Logo Logística Argentina" className="w-32 h-auto" />
          <button
            onClick={handleLogout}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
          >
            Cerrar sesión
          </button>
        </div>
        <ul className="space-y-2">
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
          <li>
            <button
              className={`w-full text-left px-4 py-2 rounded ${
                active === "crearChofer" ? "bg-blue-600" : "hover:bg-blue-700"
              }`}
              onClick={() => {
                setActive("crearChofer");
                setMenuOpen(false);
              }}
            >
              Crear Chofer
            </button>
          </li>
        </ul>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 p-8 md:ml-0 ml-0 md:mt-0 mt-16">
        <h1 className="text-3xl font-bold mb-6">Dashboard del Admin</h1>

        {/* 🔹 Seguimiento */}
{active === "seguimiento" && (
  <div className="space-y-6">
    <h2 className="text-xl font-bold">📍 Seguimiento en vivo</h2>
    <p className="text-gray-600">Selecciona un chofer para centrar el mapa en él o ver todos juntos.</p>

    {/* Lista de choferes */}
    <div className="bg-white shadow rounded p-4">
      <ul className="divide-y">
        {choferes.map((c) => (
          <li key={c.id} className="py-2 flex justify-between items-center">
            <span>
              {c.nombre} {c.apellido} — {c.telefono || "sin teléfono"}
            </span>
            <div className="space-x-2">
              <button
                onClick={() =>
                  setChoferSeleccionado(
                    choferSeleccionado === c.id ? null : c.id
                  )
                }
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                {choferSeleccionado === c.id ? "Ver todos" : "Ver ubicación"}
              </button>
              <Link
                to={`/admin/chofer/${c.id}`}
                className="bg-gray-600 text-white px-3 py-1 rounded"
              >
                Detalle
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>

    {/* Mapa con todos o uno solo */}
    <MapaAdminGeneral choferIdSeleccionado={choferSeleccionado} />
  </div>
)}



        {/* 🔹 Crear Chofer */}
        {active === "crearChofer" && (
          <div className="space-y-6">
            <FormCrearChofer onCreated={fetchChoferes} />
            <div className="bg-white shadow rounded p-6">
              <h2 className="text-xl font-bold mb-4">Choferes registrados</h2>
              {choferes.length === 0 ? (
                <p className="text-gray-500">No hay choferes aún.</p>
              ) : (
                <ul className="divide-y">
                  {choferes.map((c) => (
                    <li key={c.id} className="py-3 flex justify-between items-center">
                      {editChofer?.id === c.id ? (
                        <div className="flex flex-col md:flex-row gap-2 flex-1">
                          <input
                            value={editChofer.nombre || ""}
                            onChange={(e) =>
                              setEditChofer({ ...editChofer, nombre: e.target.value })
                            }
                            className="border p-1 rounded"
                          />
                          <input
                            value={editChofer.apellido || ""}
                            onChange={(e) =>
                              setEditChofer({ ...editChofer, apellido: e.target.value })
                            }
                            className="border p-1 rounded"
                          />
                          <input
                            value={editChofer.email || ""}
                            onChange={(e) =>
                              setEditChofer({ ...editChofer, email: e.target.value })
                            }
                            className="border p-1 rounded"
                          />
                          <input
                            value={editChofer.telefono || ""}
                            onChange={(e) =>
                              setEditChofer({ ...editChofer, telefono: e.target.value })
                            }
                            className="border p-1 rounded"
                          />
                          <input
                            value={editChofer.direccion || ""}
                            onChange={(e) =>
                              setEditChofer({ ...editChofer, direccion: e.target.value })
                            }
                            className="border p-1 rounded"
                          />
                          <button
                            onClick={handleUpdate}
                            className="bg-green-600 text-white px-2 py-1 rounded"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditChofer(null)}
                            className="bg-gray-400 text-white px-2 py-1 rounded"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          <Link
                            to={`/admin/chofer/${c.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {c.nombre} {c.apellido}
                          </Link>{" "}
                          — {c.email} — {c.telefono}
                          <div className="space-x-2">
                            <button
                              onClick={() => setEditChofer(c)}
                              className="bg-blue-600 text-white px-2 py-1 rounded"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="bg-red-600 text-white px-2 py-1 rounded"
                            >
                              Eliminar
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
