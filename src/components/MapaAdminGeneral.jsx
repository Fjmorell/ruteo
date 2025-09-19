// src/components/MapaAdminGeneral.jsx
import { useEffect, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { supabase } from "../lib/supabase";

const containerStyle = { width: "100%", height: "500px" };

export default function MapaAdminGeneral({ choferIdSeleccionado }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  });

  const [ubicaciones, setUbicaciones] = useState([]);

  useEffect(() => {
    const fetchUbicaciones = async () => {
      const { data, error } = await supabase
        .from("ubicaciones_actuales")
        .select(`
          chofer_id,
          lat,
          lng,
          updated_at,
          choferes (
            nombre,
            apellido
          )
        `);

      if (!error && data) setUbicaciones(data);
    };

    fetchUbicaciones();

    const channel = supabase
      .channel("ubicaciones_admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ubicaciones_actuales" },
        (payload) => {
          if (payload.new) {
            setUbicaciones((prev) => {
              const filtered = prev.filter(
                (u) => u.chofer_id !== payload.new.chofer_id
              );
              return [...filtered, payload.new];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!isLoaded) return <p>Cargando mapa...</p>;
  if (ubicaciones.length === 0)
    return <p className="text-gray-500">No hay choferes con ubicación registrada</p>;

  const ubicacionCentro = choferIdSeleccionado
    ? ubicaciones.find((u) => u.chofer_id === choferIdSeleccionado)
    : ubicaciones[0];

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-lg font-bold mb-4">
        🗺️ {choferIdSeleccionado ? "Ubicación del chofer" : "Ubicación de todos los choferes"}
      </h2>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={{
          lat: ubicacionCentro?.lat || -27.4712,
          lng: ubicacionCentro?.lng || -58.8367,
        }}
        zoom={choferIdSeleccionado ? 15 : 13}
      >
        {ubicaciones.map((u) => (
          <Marker
            key={u.chofer_id}
            position={{ lat: u.lat, lng: u.lng }}
            label={{
              text: `${u.choferes?.nombre || ""} ${u.choferes?.apellido || ""}`,
              fontSize: "12px",
              fontWeight: "bold",
            }}
            icon={
              choferIdSeleccionado === u.chofer_id
                ? "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                : "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            }
          />
        ))}
      </GoogleMap>
    </div>
  );
}
