import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = { width: "100%", height: "400px" };
const center = { lat: -27.4712, lng: -58.8367 };

export default function MapaChoferActual({ choferId }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries: ["places"],
  });

  const [ubicacion, setUbicacion] = useState(null);

  useEffect(() => {
    if (!choferId) return;

    const fetchUbicacion = async () => {
      const { data, error } = await supabase
        .from("ubicaciones_actuales")
        .select("lat, lng, updated_at")
        .eq("chofer_id", choferId)
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
        { event: "*", schema: "public", table: "ubicaciones_actuales", filter: `chofer_id=eq.${choferId}` },
        (payload) => {
          setUbicacion({ lat: Number(payload.new.lat), lng: Number(payload.new.lng) });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [choferId]);

  if (!isLoaded) return <p>Cargando mapa...</p>;

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-lg font-bold mb-4">📍 Tu ubicación actual</h2>
      <GoogleMap mapContainerStyle={containerStyle} center={ubicacion || center} zoom={14}>
        {ubicacion && <Marker position={ubicacion} icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png" />}
      </GoogleMap>
    </div>
  );
}
