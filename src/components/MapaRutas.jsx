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
    googleMapsApiKey: 'AIzaSyCQ5AidfjBOg7VI2sgkbpnKHPBGAoLQ15w', // 🔑 tu API KEY
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
      <h2 className="text-xl font-bold mb-4 text-gray-700">📍 Puntos de Entrega</h2>

      {/* Lista de puntos */}
      <div className="space-y-2 mb-4">
        {puntos.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-2 text-sm text-gray-800"
          >
            <input
              type="checkbox"
              checked={p.activo}
              onChange={() => togglePunto(p.id)}
            />
            <span
              className={`flex-1 ${
                entregados.includes(p.id)
                  ? "line-through text-gray-400"
                  : "text-gray-800"
              }`}
            >
              {p.nombre} - {p.direccion}
            </span>
            <button
              onClick={() => marcarComoEntregado(p.id)}
              className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
            >
              {entregados.includes(p.id) ? "✅" : "Entregado"}
            </button>
          </div>
        ))}
      </div>

      {/* Agregar dirección */}
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={nuevaDireccion}
          placeholder="Ej: Av. 3 de Abril 900, Corrientes"
          onChange={(e) => setNuevaDireccion(e.target.value)}
          className="flex-1 border rounded-lg p-2"
        />
        <button
          type="button"
          onClick={agregarDireccion}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          ➕ Agregar Dirección
        </button>
      </div>

      {/* Subir CSV */}
      <div className="mt-4">
        <input type="file" accept=".csv" onChange={handleFileUpload} />
        <small className="block text-gray-500 mt-1">
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
        className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
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
  <div className="mt-6 bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200">
    <h3 className="flex items-center gap-2 font-semibold text-xl text-gray-800 mb-4">
      📦 Orden de Entregas Optimizado
    </h3>

    <ol className="space-y-2">
      {ordenOptimizado.map((p, index) => (
        <li
          key={p.id}
          className={`flex items-center gap-3 p-3 rounded-lg shadow-sm ${
            entregados.includes(p.id)
              ? "bg-green-100 text-green-700 line-through"
              : "bg-white text-gray-700"
          }`}
        >
          <span className="w-6 h-6 flex items-center justify-center bg-blue-600 text-white rounded-full text-sm font-bold">
            {index + 1}
          </span>
          <span className="flex-1">{p.nombre} - {p.direccion}</span>
          {entregados.includes(p.id) && <span className="text-green-600">✅</span>}
        </li>
      ))}
    </ol>

    <div className="flex items-center gap-6 mt-6">
      <span className="flex items-center gap-2 text-blue-700 font-medium">
        🛣️ Distancia total: 
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
          {resumenRuta.distancia}
        </span>
      </span>
      <span className="flex items-center gap-2 text-purple-700 font-medium">
        ⏱️ Tiempo estimado: 
        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
          {resumenRuta.duracion}
        </span>
      </span>
    </div>
  </div>
)}

    </div>
  );
}
