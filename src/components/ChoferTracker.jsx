// src/components/ChoferTracker.jsx
import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function ChoferTracker({ choferId }) {
  useEffect(() => {
    if (!choferId) return;

    if (!navigator.geolocation) {
      alert("Tu dispositivo no soporta geolocalización.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        try {
          // Insertar siempre en historial
          const { error: errorHistorial } = await supabase
            .from("ubicaciones_historial")
            .insert({
              chofer_id: choferId,
              lat: latitude,
              lng: longitude,
            });

          if (errorHistorial) {
            console.error("❌ Error historial:", errorHistorial.message);
          }

          // Actualizar en actuales
          const { error: errorActual } = await supabase
            .from("ubicaciones_actuales")
            .upsert({
              chofer_id: choferId,
              lat: latitude,
              lng: longitude,
              updated_at: new Date().toISOString(),
            });

          if (errorActual) {
            console.error("❌ Error actuales:", errorActual.message);
          }

          console.log("✅ Ubicación enviada:", latitude, longitude);
        } catch (error) {
          console.error("❌ Error general:", error.message);
        }
      },
      (err) => console.error("Error GPS:", err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [choferId]);

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-lg font-bold text-gray-700 mb-2">
        📍 Seguimiento en vivo
      </h2>
      <p>Tu ubicación se está compartiendo en tiempo real.</p>
    </div>
  );
}
