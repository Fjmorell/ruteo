import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useJsApiLoader
} from "@react-google-maps/api";
import { useEffect, useState } from "react";
import Papa from "papaparse";

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
    googleMapsApiKey: 'AIzaSyCQ5AidfjBOg7VI2sgkbpnKHPBGAoLQ15w', // 🔑 tu API KEY de Google Maps
    libraries: ["places"],
  });

  const [puntos, setPuntos] = useState(() => {
    const saved = localStorage.getItem("rutas_puntos");
    return saved
      ? JSON.parse(saved)
      : [
          { id: 1, nombre: "Cliente 1", direccion: "Junin 1224, Corrientes", activo: true },
          { id: 2, nombre: "Cliente 2", direccion: "Salta 877, Corrientes", activo: true },
          { id: 3, nombre: "Cliente 3", direccion: "España 1500, Corrientes", activo: true },
        ];
  });

  const [entregados, setEntregados] = useState(() => {
    const saved = localStorage.getItem("rutas_entregados");
    return saved ? JSON.parse(saved) : [];
  });

  const [directions, setDirections] = useState(null);
  const [nuevaDireccion, setNuevaDireccion] = useState("");
  const [ordenOptimizado, setOrdenOptimizado] = useState([]);
  const [resumenRuta, setResumenRuta] = useState({ distancia: "", duracion: "" });
  const [ubicaciones, setUbicaciones] = useState([]);

  // Guardar en localStorage
  useEffect(() => {
    localStorage.setItem("rutas_puntos", JSON.stringify(puntos));
  }, [puntos]);

  useEffect(() => {
    localStorage.setItem("rutas_entregados", JSON.stringify(entregados));
  }, [entregados]);

  // Calcular rutas
  useEffect(() => {
    if (!isLoaded) return;

    const geocoder = new window.google.maps.Geocoder();
    const activos = puntos.filter((p) => p.activo);
    if (activos.length < 2) return;

    Promise.all(
      activos.map(
        (p) =>
          new Promise((resolve, reject) => {
            geocoder.geocode({ address: p.direccion }, (results, status) => {
              if (status === "OK" && results[0]) {
                resolve({
                  ...p,
                  lat: results[0].geometry.location.lat(),
                  lng: results[0].geometry.location.lng(),
                });
              } else {
                console.warn(`Error geocodificando ${p.direccion}: ${status}`);
                reject();
              }
            });
          })
      )
    ).then((result) => {
      setUbicaciones(result);

      const origin = result[0];
      const destination = result[result.length - 1];
      const waypoints = result.slice(1, -1).map((p) => ({
        location: { lat: p.lat, lng: p.lng },
        stopover: true,
      }));

      const service = new window.google.maps.DirectionsService();
      service.route(
        {
          origin: { lat: origin.lat, lng: origin.lng },
          destination: { lat: destination.lat, lng: destination.lng },
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

            const orden = resultDirections.routes[0].waypoint_order;
            const ordenFinal = [
              activos[0],
              ...orden.map((i) => activos[i + 1]),
              activos[activos.length - 1],
            ];
            setOrdenOptimizado(ordenFinal);
          } else {
            console.error("Error al calcular ruta:", status);
          }
        }
      );
    });
  }, [puntos, isLoaded]);

  const togglePunto = (id) => {
    setPuntos(puntos.map((p) => (p.id === id ? { ...p, activo: !p.activo } : p)));
  };

  const agregarDireccion = () => {
    if (!nuevaDireccion.trim()) return;
    setPuntos([
      ...puntos,
      {
        id: Date.now(),
        nombre: `Nuevo`,
        direccion: nuevaDireccion.includes("Corrientes")
          ? nuevaDireccion
          : `${nuevaDireccion}, Corrientes`,
        activo: true,
      },
    ]);
    setNuevaDireccion("");
  };

  const marcarComoEntregado = (id) => {
    setEntregados((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        const nuevosPuntos = results.data.map((row, index) => ({
          id: Date.now() + index,
          nombre: row.nombre || `Cliente ${index + 1}`,
          direccion: row.direccion?.includes("Corrientes")
            ? row.direccion
            : `${row.direccion}, Corrientes`,
          activo: true,
        }));
        setPuntos((prev) => [...prev, ...nuevosPuntos]);
      },
    });
  };

  if (!isLoaded) return <div>Cargando mapa...</div>;

  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-6xl">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-600">
        📍 Puntos de Entrega
      </h2>

      {/* Lista de puntos */}
      <ul className="space-y-3 mb-6">
        {puntos.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-lg p-3 border border-gray-200 transition"
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={p.activo}
                onChange={() => togglePunto(p.id)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded"
              />
              <span
                className={`${
                  entregados.includes(p.id)
                    ? "line-through text-gray-400"
                    : "text-gray-800"
                }`}
              >
                {p.nombre} – {p.direccion}
              </span>
            </div>
            <button
              onClick={() => marcarComoEntregado(p.id)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                entregados.includes(p.id)
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-green-500 hover:text-white"
              }`}
            >
              {entregados.includes(p.id) ? "Entregado" : "Marcar"}
            </button>
          </li>
        ))}
      </ul>

      {/* Agregar dirección */}
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={nuevaDireccion}
          placeholder="Ej: Av. 3 de Abril 900, Corrientes"
          onChange={(e) => setNuevaDireccion(e.target.value)}
          className="flex-1 border rounded-lg p-2 shadow-sm focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={agregarDireccion}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-1"
        >
          ➕ Agregar Dirección
        </button>
      </div>

      {/* Subir CSV */}
      <div className="mt-4">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="block text-sm text-gray-600 file:mr-4 file:py-2 file:px-4
                     file:rounded-lg file:border-0 file:text-sm
                     file:font-semibold file:bg-blue-50 file:text-blue-600
                     hover:file:bg-blue-100"
        />
        <small className="block mt-2 text-gray-500">
          📎 Subí un archivo CSV con columnas <strong>nombre</strong> y{" "}
          <strong>direccion</strong>
        </small>
      </div>

      {/* Botón limpiar */}
      <button
        onClick={() => {
          if (confirm("¿Seguro que querés reiniciar la ruta?")) {
            setPuntos([]);
            setEntregados([]);
            localStorage.removeItem("rutas_puntos");
            localStorage.removeItem("rutas_entregados");
            setDirections(null);
            setOrdenOptimizado([]);
            setResumenRuta({ distancia: "", duracion: "" });
            setUbicaciones([]);
          }
        }}
        className="mt-6 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2"
      >
        🧹 Limpiar Ruta
      </button>

      {/* Google Map */}
      <div className="mt-6">
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={14}>
          {ubicaciones.map((p) => (
            <Marker
              key={p.id}
              position={{ lat: p.lat, lng: p.lng }}
              label={p.nombre}
              icon={{
                url: entregados.includes(p.id)
                  ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                  : "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
              }}
            />
          ))}
          {directions && <DirectionsRenderer directions={directions} />}
        </GoogleMap>
      </div>

      {/* Resumen */}
      {ordenOptimizado.length > 0 && (
        <div className="mt-6 bg-gray-50 shadow-md rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
            📦 Orden de Entregas Optimizado
          </h3>

          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            {ordenOptimizado.map((p) => (
              <li
                key={p.id}
                className={`${
                  entregados.includes(p.id)
                    ? "line-through text-gray-400"
                    : "text-gray-800"
                }`}
              >
                {entregados.includes(p.id) ? "✅ " : ""} {p.nombre} - {p.direccion}
              </li>
            ))}
          </ol>

          {/* Distancia y Tiempo */}
          <div className="mt-4 space-y-1 text-gray-700">
            <p>🛣️ Distancia total: <strong>{resumenRuta.distancia}</strong></p>
            <p>⏱️ Tiempo estimado: <strong>{resumenRuta.duracion}</strong></p>
          </div>

          {/* Barra de progreso */}
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-600 mb-2">
              Progreso: {entregados.length} de {ordenOptimizado.length} entregas completadas
            </p>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-600 h-4 rounded-full transition-all duration-500"
                style={{
                  width: `${(entregados.length / ordenOptimizado.length) * 100}%`
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
