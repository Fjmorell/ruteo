import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import FormCrearChofer from "../components/FormCrearChofer";

const containerStyle = { width: "100%", height: "500px" };
const center = { lat: -27.4712, lng: -58.8367 };

export default function DashboardAdmin() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  });

  const [choferes, setChoferes] = useState([]);
  const [choferSeleccionado, setChoferSeleccionado] = useState(null);
  const [ubicacion, setUbicacion] = useState(null);

  // 🔹 Función para traer choferes
  const fetchChoferes = async () => {
    const { data, error } = await supabase
      .from("choferes")
      .select("id, nombre, apellido, telefono");

    if (!error) setChoferes(data);
    else console.error("Error cargando choferes:", error.message);
  };

  // 🔹 Al cargar la página, traemos choferes
  useEffect(() => {
    fetchChoferes();
  }, []);

  // 🔹 Suscribirse a cambios de ubicación del chofer seleccionado
  useEffect(() => {
    if (!choferSeleccionado) return;

    const fetchUbicacion = async () => {
      const { data, error } = await supabase
        .from("ubicaciones_actuales")
        .select("lat, lng, updated_at")
        .eq("chofer_id", choferSeleccionado.id)
        .single();

      if (!error && data) {
        setUbicacion({ lat: Number(data.lat), lng: Number(data.lng) });
      }
    };

    fetchUbicacion();

    const subscription = supabase
      .channel("ubicaciones_actuales")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ubicaciones_actuales",
          filter: `chofer_id=eq.${choferSeleccionado.id}`,
        },
        (payload) => {
          setUbicacion({
            lat: Number(payload.new.lat),
            lng: Number(payload.new.lng),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [choferSeleccionado]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">📍 Panel de Administración de Choferes</h1>

      {/* Formulario para crear chofer */}
      <FormCrearChofer onCreated={fetchChoferes} />

      {/* Lista de choferes */}
      <div className="bg-white shadow-md rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Choferes disponibles</h2>
        <ul className="space-y-2">
          {choferes.map((c) => (
            <li key={c.id}>
              <button
                className={`w-full text-left px-4 py-2 rounded ${
                  choferSeleccionado?.id === c.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
                onClick={() => setChoferSeleccionado(c)}
              >
                {c.nombre} {c.apellido} – {c.telefono}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Mapa del chofer seleccionado */}
      {choferSeleccionado && (
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">
            Ubicación de {choferSeleccionado.nombre} {choferSeleccionado.apellido}
          </h2>
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={ubicacion || center}
              zoom={14}
            >
              {ubicacion && (
                <Marker
                  position={ubicacion}
                  icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                />
              )}
            </GoogleMap>
          ) : (
            <p>Cargando mapa...</p>
          )}
        </div>
      )}
    </div>
  );
}
