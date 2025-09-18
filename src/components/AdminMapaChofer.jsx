import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "600px",
};

const center = { lat: -27.4712, lng: -58.8367 };

export default function AdminMapaChofer() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "TU_API_KEY_GOOGLE_MAPS",
    libraries: ["places"],
  });

  const [choferes, setChoferes] = useState({}); // { choferId: {lat, lng, updated_at} }

  useEffect(() => {
    // 🔹 Traer últimas ubicaciones al cargar
    const fetchUbicaciones = async () => {
      const { data, error } = await supabase
        .from("ubicaciones_choferes")
        .select("chofer_id, lat, lng, created_at")
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      else {
        const ultimas = {};
        data.forEach((u) => {
          if (!ultimas[u.chofer_id]) {
            ultimas[u.chofer_id] = u;
          }
        });
        setChoferes(ultimas);
      }
    };

    fetchUbicaciones();

    // 🔹 Escuchar cambios en tiempo real
    const subscription = supabase
      .channel("ubicaciones")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ubicaciones_choferes" },
        (payload) => {
          const u = payload.new;
          setChoferes((prev) => ({
            ...prev,
            [u.chofer_id]: u,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  if (!isLoaded) return <p>Cargando mapa...</p>;

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-lg font-bold mb-4">🗺️ Seguimiento en tiempo real</h2>
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13}>
        {Object.entries(choferes).map(([choferId, u]) => (
          <Marker
            key={choferId}
            position={{ lat: u.lat, lng: u.lng }}
            label={`Chofer ${choferId.substring(0, 4)}`}
            icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
          />
        ))}
      </GoogleMap>
    </div>
  );
}
