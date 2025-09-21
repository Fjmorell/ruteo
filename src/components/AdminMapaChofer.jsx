// src/components/AdminMapaChofer.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = { width: "100%", height: "600px" };
const center = { lat: -27.4712, lng: -58.8367 };

export default function AdminMapaChofer() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries: ["places"],
  });

  const [choferes, setChoferes] = useState({});

  useEffect(() => {
    const fetchUbicaciones = async () => {
      const { data, error } = await supabase
        .from("ubicaciones_actuales")
        .select("chofer_id, lat, lng, updated_at, choferes (nombre, apellido)");

      if (!error && data) {
        const mapa = {};
        data.forEach((u) => {
          mapa[u.chofer_id] = {
            lat: Number(u.lat),
            lng: Number(u.lng),
            nombre: u.choferes?.nombre || "Chofer",
            apellido: u.choferes?.apellido || "",
            updated_at: u.updated_at,
          };
        });
        setChoferes(mapa);
      }
    };

    fetchUbicaciones();

    // 🔴 Escuchar cambios en tiempo real
    const subscription = supabase
      .channel("ubicaciones_actuales")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ubicaciones_actuales" },
        (payload) => {
          const u = payload.new;
          setChoferes((prev) => {
            const anterior = prev[u.chofer_id] || {};
            return {
              ...prev,
              [u.chofer_id]: {
                ...anterior, // 👈 mantiene nombre y apellido
                lat: Number(u.lat),
                lng: Number(u.lng),
                updated_at: u.updated_at,
              },
            };
          });
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
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={14}>
        {Object.entries(choferes).map(([choferId, u]) => (
          <Marker
            key={choferId}
            position={{ lat: u.lat, lng: u.lng }}
            label={`${u.nombre || "Chofer"}`}
            icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
          />
        ))}
      </GoogleMap>
    </div>
  );
}
