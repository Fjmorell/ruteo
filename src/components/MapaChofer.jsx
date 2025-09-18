// src/components/MapaChofer.jsx
import { useEffect, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { supabase } from "../lib/supabase";

const containerStyle = {
  width: "100%",
  height: "400px",
};

export default function MapaChofer({ choferId }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyCQ5AidfjBOg7VI2sgkbpnKHPBGAoLQ15w', 
  });

  const [ubicacion, setUbicacion] = useState(null);

  useEffect(() => {
    if (!choferId) return;

    // Escucha SOLO a este chofer
    const channel = supabase
      .channel("ubicacion-chofer")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ubicaciones_choferes", filter: `chofer_id=eq.${choferId}` },
        (payload) => {
          setUbicacion(payload.new);
        }
      )
      .subscribe();

    // Traer última ubicación inicial
    const fetchUltima = async () => {
      const { data } = await supabase
        .from("ubicaciones_choferes")
        .select("lat,lng,created_at")
        .eq("chofer_id", choferId)
        .order("created_at", { ascending: false })
        .limit(1);
      if (data && data[0]) setUbicacion(data[0]);
    };

    fetchUltima();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [choferId]);

  if (!isLoaded) return <p>Cargando mapa...</p>;

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-lg font-bold mb-4">🗺️ Tu ubicación en vivo</h2>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={
          ubicacion
            ? { lat: ubicacion.lat, lng: ubicacion.lng }
            : { lat: -27.4712, lng: -58.8367 }
        }
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
