import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function useLiveLocation(choferId, intervalMs = 15000) {
  useEffect(() => {
    if (!choferId) return;

    let interval = null;

    const reportar = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          const { error } = await supabase.from("ubicaciones_actuales").upsert({
            chofer_id: choferId, // 🔑 siempre el mismo que en tabla choferes
            lat,
            lng,
            updated_at: new Date(),
          });

          if (error) console.error("❌ Error guardando ubicación:", error.message);
          else console.log("✅ Ubicación enviada:", lat, lng);
        },
        (err) => {
          console.error("❌ Error obteniendo ubicación:", err.message);
        }
      );
    };

    // Reportar ahora y luego cada X segundos
    reportar();
    interval = setInterval(reportar, intervalMs);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [choferId, intervalMs]);
}
