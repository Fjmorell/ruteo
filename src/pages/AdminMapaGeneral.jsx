// src/pages/AdminMapaGeneral.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = { width: "100%", height: "600px" };
const center = { lat: -27.4712, lng: -58.8367 };

export default function AdminMapaGeneral() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
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

    // 🔴 Suscripción en tiempo real (INSERT + UPDATE)
    const channel = supabase
      .channel("ubicaciones_admin")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ubicaciones_actuales" },
        (payload) => {
          console.log("➕ Nuevo chofer:", payload.new);
          const u = payload.new;
          setChoferes((prev) => ({
            ...prev,
            [u.chofer_id]: {
              lat: Number(u.lat),
              lng: Number(u.lng),
              updated_at: u.updated_at,
              // 👇 si ya estaba en estado, mantiene nombre/apellido
              ...(prev[u.chofer_id] || {}),
            },
          }));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ubicaciones_actuales" },
        (payload) => {
          console.log("♻️ Actualización chofer:", payload.new);
          const u = payload.new;
          setChoferes((prev) => {
            const anterior = prev[u.chofer_id] || {};
            return {
              ...prev,
              [u.chofer_id]: {
                ...anterior, // 👈 mantiene nombre/apellido
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
      supabase.removeChannel(channel);
    };
  }, []);

  if (!isLoaded) return <p>Cargando mapa...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🗺️ Ubicación de todos los choferes</h1>
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13}>
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
