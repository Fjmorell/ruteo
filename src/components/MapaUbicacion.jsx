import { useEffect, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { supabase } from "../lib/supabase";

const containerStyle = {
  width: "100%",
  height: "400px",
};

export default function MapaUbicacion({ choferId }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  });

  const [posicion, setPosicion] = useState(null);

  useEffect(() => {
    if (!choferId) return;

    // === GEOLOCALIZACIÓN en vivo ===
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosicion({ lat: latitude, lng: longitude });

        console.log("📍 Ubicación enviada:", latitude, longitude);

        try {
          // 1. Guardar en historial
          await supabase.from("ubicaciones_historial").insert([
            {
              chofer_id: choferId,
              lat: latitude,
              lng: longitude,
            },
          ]);

          // 2. Guardar/Actualizar en ubicaciones_actuales
          await supabase.from("ubicaciones_actuales").upsert([
            {
              chofer_id: choferId,
              lat: latitude,
              lng: longitude,
              updated_at: new Date(),
            },
          ]);
        } catch (error) {
          console.error("❌ Error guardando ubicación:", error.message);
        }
      },
      (err) => console.error("Error al obtener ubicación:", err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [choferId]);

  return (
    <div>
      {isLoaded && posicion ? (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={posicion}
          zoom={14}
        >
          <Marker position={posicion} />
        </GoogleMap>
      ) : (
        <p>Cargando mapa...</p>
      )}
    </div>
  );
}
