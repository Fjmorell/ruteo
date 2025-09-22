// src/components/MapaAdminGeneral.jsx
import { useEffect, useState, useRef } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { supabase } from "../lib/supabase";

const containerStyle = { width: "100%", height: "500px" };

export default function MapaAdminGeneral({ choferIdSeleccionado }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  });

  const [ubicaciones, setUbicaciones] = useState([]);
  const mapRef = useRef(null);

  const choferIdLogueado = localStorage.getItem("choferId");

  useEffect(() => {
    const fetchUbicaciones = async () => {
      const { data, error } = await supabase
        .from("vista_choferes_ubicaciones")
        .select("*");
      if (!error && data) setUbicaciones(data);
    };

    fetchUbicaciones();

    const channel = supabase
      .channel("ubicaciones_admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ubicaciones_actuales" },
        async (payload) => {
          if (payload.new) {
            const { data } = await supabase
              .from("vista_choferes_ubicaciones")
              .select("*")
              .eq("chofer_id", payload.new.chofer_id)
              .single();

            if (data) {
              setUbicaciones((prev) => {
                const filtered = prev.filter((u) => u.chofer_id !== data.chofer_id);
                return [...filtered, data];
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!choferIdSeleccionado && ubicaciones.length > 0 && mapRef.current) {
      const bounds = new window.google.maps.LatLngBounds();
      ubicaciones.forEach((u) => bounds.extend({ lat: u.lat, lng: u.lng }));
      mapRef.current.fitBounds(bounds);
    }
    if (choferIdSeleccionado && mapRef.current) {
      const chofer = ubicaciones.find((u) => u.chofer_id === choferIdSeleccionado);
      if (chofer) {
        mapRef.current.setCenter({ lat: chofer.lat, lng: chofer.lng });
        mapRef.current.setZoom(15);
      }
    }
  }, [ubicaciones, choferIdSeleccionado]);

  if (!isLoaded) return <p>Cargando mapa...</p>;
  if (ubicaciones.length === 0)
    return <p className="text-gray-500">No hay choferes con ubicación registrada</p>;

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-lg font-bold mb-4">
        🗺️ {choferIdSeleccionado ? "Ubicación del chofer" : "Ubicación de todos los choferes"}
      </h2>
      <GoogleMap
        onLoad={(map) => (mapRef.current = map)}
        mapContainerStyle={containerStyle}
        center={{ lat: -27.4712, lng: -58.8367 }}
        zoom={13}
      >
        {ubicaciones.map((u) => {
          let icon = "http://maps.google.com/mapfiles/ms/icons/grey-dot.png"; // ⚪ Inactivo

          if (u.activo) {
            icon = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"; // 🔵 Activo
          }

          if (choferIdLogueado && choferIdLogueado === u.chofer_id) {
            icon = "http://maps.google.com/mapfiles/ms/icons/green-dot.png"; // 🟢 Logueado
          }

          if (choferIdSeleccionado === u.chofer_id) {
            icon = "http://maps.google.com/mapfiles/ms/icons/red-dot.png"; // 🔴 Seleccionado
          }

          return (
            <Marker
              key={u.chofer_id}
              position={{ lat: u.lat, lng: u.lng }}
              label={{
                text: `${u.nombre || ""} ${u.apellido || ""}`,
                fontSize: "12px",
                fontWeight: "bold",
              }}
              icon={icon} // ✅ Solo usamos esta
            />
          );
        })}
      </GoogleMap>

      {/* 📌 Leyenda */}
      <div className="mt-4 text-sm text-gray-600">
        <p>🟢 Chofer logueado (este navegador)</p>
        <p>🔵 Chofer activo</p>
        <p>🔴 Chofer seleccionado</p>
        <p>⚪ Chofer inactivo</p>
      </div>
    </div>
  );
}
