import { useEffect, useState } from "react";
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
import { supabase } from "../lib/supabase";

const containerStyle = { width: "100%", height: "500px" };

export default function MapaAdminGeneral() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  });

  const [ubicaciones, setUbicaciones] = useState([]);
  const [selectedChofer, setSelectedChofer] = useState(null);

  useEffect(() => {
    const fetchUbicaciones = async () => {
      const { data, error } = await supabase
        .from("ubicaciones_actuales")
        .select(`
          chofer_id,
          lat,
          lng,
          updated_at,
          choferes ( nombre, apellido, telefono )
        `);

      if (!error && data) setUbicaciones(data);
    };

    fetchUbicaciones();

    const channel = supabase
      .channel("ubicaciones_admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ubicaciones_actuales" },
        (payload) => {
          if (payload.new) {
            setUbicaciones((prev) => {
              const filtered = prev.filter(
                (u) => u.chofer_id !== payload.new.chofer_id
              );
              return [...filtered, payload.new];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!isLoaded) return <p>Cargando mapa...</p>;
  if (ubicaciones.length === 0)
    return <p className="text-gray-500">No hay choferes con ubicación registrada</p>;

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-lg font-bold mb-4">🗺️ Ubicación de todos los choferes</h2>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={{
          lat: ubicaciones[0]?.lat || -27.4712,
          lng: ubicaciones[0]?.lng || -58.8367,
        }}
        zoom={13}
      >
        {ubicaciones.map((u) => (
          <Marker
            key={u.chofer_id}
            position={{ lat: u.lat, lng: u.lng }}
            icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            onClick={() => setSelectedChofer(u)}
          />
        ))}

        {selectedChofer && (
          <InfoWindow
            position={{ lat: selectedChofer.lat, lng: selectedChofer.lng }}
            onCloseClick={() => setSelectedChofer(null)}
          >
            <div>
              <p className="font-bold">
                {selectedChofer.choferes?.nombre} {selectedChofer.choferes?.apellido}
              </p>
              <p>📞 {selectedChofer.choferes?.telefono || "sin teléfono"}</p>
              <p className="text-xs text-gray-500">
                Última actualización: {new Date(selectedChofer.updated_at).toLocaleTimeString()}
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
