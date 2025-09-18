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

    const channel = supabase
      .channel("ubicaciones_actuales")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ubicaciones_actuales", filter: `chofer_id=eq.${choferId}` },
        (payload) => setUbicacion(payload.new)
      )
      .subscribe();

    const fetchUltima = async () => {
      const { data } = await supabase
        .from("ubicaciones_actuales")
        .select("lat, lng, updated_at")
        .eq("chofer_id", choferId)
        .single();
      if (data) setUbicacion(data);
    };

    fetchUltima();
    return () => supabase.removeChannel(channel);
  }, [choferId]);

  if (!isLoaded) return <p>Cargando mapa...</p>;

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-lg font-bold mb-4">🗺️ Tu ubicación en vivo</h2>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={ubicacion ? { lat: ubicacion.lat, lng: ubicacion.lng } : { lat: -27.4712, lng: -58.8367 }}
        zoom={15}
      >
        {ubicacion && (
          <Marker
            position={{ lat: ubicacion.lat, lng: ubicacion.lng }}
            label="Yo"
            icon="http://maps.google.com/mapfiles/ms/icons/red-dot.png"
          />
        )}
      </GoogleMap>
    </div>
  );
}
