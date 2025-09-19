// src/components/MapaChofer.jsx
import { useEffect, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { supabase } from "../lib/supabase";

const containerStyle = { width: "100%", height: "400px" };

export default function MapaChofer({ choferId }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  });

  const [ubicacion, setUbicacion] = useState(null);

  useEffect(() => {
    if (!choferId) return;

    // 🔹 Suscripción en tiempo real
    const channel = supabase
      .channel("ubicaciones_actuales")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ubicaciones_actuales",
          filter: `chofer_id=eq.${choferId}`, // 👈 confirmá nombre columna
        },
        (payload) => {
          if (payload.new) {
            setUbicacion(payload.new);
          }
        }
      )
      .subscribe();

    // 🔹 Traer última ubicación
    const fetchUltima = async () => {
      const { data, error } = await supabase
        .from("ubicaciones_actuales")
        .select("lat, lng, updated_at")
        .eq("chofer_id", choferId) // 👈 confirmá nombre columna
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setUbicacion(data);
      }
    };

    fetchUltima();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [choferId]);

  if (!isLoaded) return <p>Cargando mapa...</p>;
  if (!ubicacion) return <p>No hay ubicación registrada para este chofer</p>;

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-lg font-bold mb-4">🗺️ Ubicación en vivo</h2>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={{ lat: ubicacion.lat, lng: ubicacion.lng }}
        zoom={15}
      >
        <Marker
          position={{ lat: ubicacion.lat, lng: ubicacion.lng }}
          label="Chofer"
          icon="http://maps.google.com/mapfiles/ms/icons/red-dot.png"
        />
      </GoogleMap>
    </div>
  );
}
