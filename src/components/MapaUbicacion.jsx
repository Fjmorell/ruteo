import { useEffect, useState, useRef } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { supabase } from "../lib/supabase";

const containerStyle = {
  width: "100%",
  height: "400px",
};

// ✅ PNG azul
function createBlueDot() {
  const img = document.createElement("img");
  img.src = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
  img.style.width = "32px";
  img.style.height = "32px";
  return img;
}

export default function MapaUbicacion({ choferId }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries: ["marker"],
  });

  const [posicion, setPosicion] = useState(null);
  const markerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!choferId) return;

    const canal = supabase
      .channel("ubicaciones")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ubicaciones_choferes",
          filter: `chofer_id=eq.${choferId}`,
        },
        (payload) => {
          if (payload.new?.lat && payload.new?.lng) {
            setPosicion({
              lat: Number(payload.new.lat),
              lng: Number(payload.new.lng),
            });
          }
        }
      )
      .subscribe();

    const fetchUbicacion = async () => {
      const { data, error } = await supabase
        .from("ubicaciones_choferes")
        .select("lat, lng")
        .eq("chofer_id", choferId)
        .single();

      if (!error && data) {
        setPosicion({
          lat: Number(data.lat),
          lng: Number(data.lng),
        });
      }
    };
    fetchUbicacion();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [choferId]);

  useEffect(() => {
    if (mapRef.current && posicion) {
      if (markerRef.current) {
        markerRef.current.position = new window.google.maps.LatLng(
          posicion.lat,
          posicion.lng
        );
      } else {
        markerRef.current =
          new window.google.maps.marker.AdvancedMarkerElement({
            map: mapRef.current,
            position: new window.google.maps.LatLng(
              posicion.lat,
              posicion.lng
            ),
            content: createBlueDot(),
          });
      }
    }
  }, [posicion]);

  if (!isLoaded) return <p>Cargando mapa...</p>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={posicion || { lat: -27.4712, lng: -58.8367 }}
      zoom={15}
      onLoad={(map) => (mapRef.current = map)}
    />
  );
}
