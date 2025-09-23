// src/components/MapaRutas.jsx
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useEffect, useState, useRef } from "react";
import Papa from "papaparse";

// 👇 imports correctos de react-dnd
import { DndProvider } from "react-dnd";
import { useDrag, useDrop } from "react-dnd";

// 👇 multi-backend para PC + móvil
import { MultiBackend, TouchTransition } from "dnd-multi-backend";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";

const HTML5toTouch = {
  backends: [
    { id: "html5", backend: HTML5Backend },
    {
      id: "touch",
      backend: TouchBackend,
      options: { enableMouseEvents: true },
      preview: true,
      transition: TouchTransition,
    },
  ],
};

const containerStyle = { width: "100%", height: "600px" };
const center = { lat: -27.4712, lng: -58.8367 };

export function MapaRutas() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyCQ5AidfjBOg7VI2sgkbpnKHPBGAoLQ15w", // tu API Key
    libraries: ["places"],
  });

  const mapRef = useRef(null);
  const [puntos, setPuntos] = useState([]);
  const [direccionInicio, setDireccionInicio] = useState("");
  const [nuevaDireccion, setNuevaDireccion] = useState("");
  const [directions, setDirections] = useState(null);
  const [resumenRuta, setResumenRuta] = useState({ distancia: "", duracion: "" });

  // 🚀 Geocodificación
  const geocodeDireccion = (direccion, nombre = "Punto") => {
    return new Promise((resolve, reject) => {
      if (!window.google) return reject("Google Maps no cargado");
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: direccion }, (results, status) => {
        if (status === "OK" && results[0]) {
          resolve({
            id: Date.now() + Math.random(),
            nombre,
            direccion,
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng(),
          });
        } else {
          reject(status);
        }
      });
    });
  };

  // 🚀 Calcular ruta
  useEffect(() => {
    if (!isLoaded || !direccionInicio || puntos.length < 1) return;

    geocodeDireccion(direccionInicio, "Inicio")
      .then((origen) => {
        const destinos = puntos;
        if (destinos.length === 0) return;

        const waypoints =
          destinos.length > 1
            ? destinos.slice(0, -1).map((p) => ({
                location: { lat: p.lat, lng: p.lng },
                stopover: true,
              }))
            : [];

        const service = new window.google.maps.DirectionsService();
        service.route(
          {
            origin: { lat: origen.lat, lng: origen.lng },
            destination: {
              lat: destinos[destinos.length - 1].lat,
              lng: destinos[destinos.length - 1].lng,
            },
            waypoints,
            optimizeWaypoints: true,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (resultDirections, status) => {
            if (status === "OK") {
              setDirections(resultDirections);

              const total = resultDirections.routes[0].legs.reduce(
                (acc, leg) => {
                  acc.distancia += leg.distance.value;
                  acc.duracion += leg.duration.value;
                  return acc;
                },
                { distancia: 0, duracion: 0 }
              );

              setResumenRuta({
                distancia: (total.distancia / 1000).toFixed(2) + " km",
                duracion: Math.round(total.duracion / 60) + " min",
              });

              const bounds = new window.google.maps.LatLngBounds();
              resultDirections.routes[0].overview_path.forEach((p) =>
                bounds.extend(p)
              );
              if (mapRef.current) mapRef.current.fitBounds(bounds);
            } else {
              setDirections(null);
            }
          }
        );
      })
      .catch(() => {});
  }, [puntos, direccionInicio, isLoaded]);

  // 🚀 Agregar dirección
  const agregarDireccion = async () => {
    if (!nuevaDireccion.trim()) return;
    try {
      const punto = await geocodeDireccion(
        nuevaDireccion,
        `Cliente ${puntos.length + 1}`
      );
      setPuntos((prev) => [...prev, punto]);
      setNuevaDireccion("");
    } catch {
      alert("No se pudo geocodificar la dirección");
    }
  };

  // 🚀 Eliminar dirección
  const eliminarDireccion = (id) => {
    setPuntos((prev) => prev.filter((p) => p.id !== id));
  };

  // 🚀 Reordenar con drag & drop
  const moveItem = (fromIndex, toIndex) => {
    setPuntos((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  // 🚀 CSV
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async function (results) {
        const nuevos = [];
        for (let i = 0; i < results.data.length; i++) {
          const row = results.data[i];
          try {
            const punto = await geocodeDireccion(
              row.direccion,
              row.nombre || `Cliente ${i + 1}`
            );
            nuevos.push(punto);
          } catch {}
        }
        setPuntos((prev) => [...prev, ...nuevos]);
      },
    });
  };

  if (!isLoaded) return <div>Cargando mapa...</div>;

  return (
    <DndProvider backend={MultiBackend} options={HTML5toTouch}>
      <div className="bg-white shadow-md rounded-lg p-6 w-full">
        <h2 className="text-xl font-bold mb-4 text-red-600">📍 Puntos de Entrega</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {/* Panel izquierdo */}
          <div>
            <input
              type="text"
              value={direccionInicio}
              placeholder="Dirección de inicio"
              onChange={(e) => setDireccionInicio(e.target.value)}
              className="w-full border rounded-lg p-2 mb-4 shadow-sm"
            />

            <ul className="space-y-3 mb-6">
              {puntos.map((p, index) => (
                <DraggableItem
                  key={p.id}
                  id={p.id}
                  index={index}
                  moveItem={moveItem}
                  eliminarDireccion={eliminarDireccion}
                >
                  {p.nombre} – {p.direccion}
                </DraggableItem>
              ))}
            </ul>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={nuevaDireccion}
                placeholder="Ej: Av. 3 de Abril 900, Corrientes"
                onChange={(e) => setNuevaDireccion(e.target.value)}
                className="flex-1 border rounded-lg p-2 shadow-sm"
              />
              <button
                type="button"
                onClick={agregarDireccion}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                ➕ Agregar
              </button>
            </div>

            {/* Botón subir CSV estilizado */}
            <div className="mb-4">
              <label className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg cursor-pointer inline-block">
                📎 Subir CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Mapa */}
          <div>
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={center}
              zoom={13}
              onLoad={(map) => (mapRef.current = map)}
            >
              {puntos.map((p) => (
                <Marker key={p.id} position={{ lat: p.lat, lng: p.lng }} />
              ))}
              {directions && <DirectionsRenderer directions={directions} />}
            </GoogleMap>
          </div>
        </div>

        {resumenRuta.distancia && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4 border">
            <p>🛣️ Distancia total: <strong>{resumenRuta.distancia}</strong></p>
            <p>⏱️ Tiempo estimado: <strong>{resumenRuta.duracion}</strong></p>
          </div>
        )}
      </div>
    </DndProvider>
  );
}

/* 🔹 Componente arrastrable */
function DraggableItem({ id, index, moveItem, eliminarDireccion, children }) {
  const ref = useRef(null);

  const [, drop] = useDrop({
    accept: "item",
    hover(item) {
      if (item.index === index) return;
      moveItem(item.index, index);
      item.index = index;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: "item",
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <li
      ref={ref}
      className={`flex items-center justify-between bg-gray-50 rounded-lg p-3 border cursor-move ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <span>{children}</span>
      <button
        onClick={() => eliminarDireccion(id)}
        className="ml-3 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
      >
        ❌
      </button>
    </li>
  );
}
