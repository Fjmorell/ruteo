import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function ChoferTracker({ choferId }) {
  useEffect(() => {
    if (!choferId) return;

    // Ver si el navegador soporta geolocalización
    if (!navigator.geolocation) {
      alert("Tu dispositivo no soporta geolocalización.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        // Insertar en Supabase
        const { error } = await supabase.from("ubicaciones_choferes").insert([
          {
            chofer_id: choferId,
            lat: latitude,
            lng: longitude,
          },
        ]);

        if (error) {
          console.error("❌ Error guardando ubicación:", error.message);
        } else {
          console.log("✅ Ubicación guardada:", latitude, longitude);
        }
      },
      (err) => console.error("Error GPS:", err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );

    // Cleanup
    return () => navigator.geolocation.clearWatch(watchId);
  }, [choferId]);

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-lg font-bold text-gray-700 mb-2">📍 Seguimiento en vivo</h2>
      <p>Tu ubicación se está compartiendo en tiempo real.</p>
    </div>
  );
}
