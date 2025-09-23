// src/components/MapaRutas.jsx
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useEffect, useState, useRef } from "react";
import Papa from "papaparse";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";

const containerStyle = {
  width: "100%",
  height: "600px",
};

const center = {
  lat: -27.4712,
  lng: -58.8367,
};

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
    if (!isLoaded) return;
    if (!direccionInicio || puntos.length < 1) return;

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
            optimizeWaypoints: false, // 👈 mantenemos el orden manual
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

  // 🚀 Agregar dirección manual
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

  // 🚀 Reordenar direcciones con drag & drop
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(puntos);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setPuntos(items);
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
    <div className="bg-white shadow-md rounded-lg p-6 w-full">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-600">
        📍 Puntos de Entrega
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Panel izquierdo */}
        <div>
          <input
            type="text"
            value={direccionInicio}
            placeholder="Dirección de inicio (ej: Depósito Central)"
            onChange={(e) => setDireccionInicio(e.target.value)}
            className="w-full border rounded-lg p-2 mb-4 shadow-sm"
          />

          {/* Lista drag & drop */}
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="puntos">
              {(provided) => (
                <ul
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3 mb-6"
                >
                  {puntos.map((p, index) => (
                    <Draggable key={p.id} draggableId={p.id.toString()} index={index}>
                      {(provided) => (
                        <li
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border"
                        >
                          <span>
                            {p.nombre} – {p.direccion}
                          </span>
                          <button
                            onClick={() => eliminarDireccion(p.id)}
                            className="ml-3 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
                          >
                            ❌ Eliminar
                          </button>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>

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
            <small className="block mt-2 text-gray-500">
              CSV con columnas <strong>nombre</strong> y{" "}
              <strong>direccion</strong>
            </small>
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
          <p>
            🛣️ Distancia total: <strong>{resumenRuta.distancia}</strong>
          </p>
          <p>
            ⏱️ Tiempo estimado: <strong>{resumenRuta.duracion}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
