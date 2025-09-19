import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function FormVehiculo({ choferId }) {
  const [vehiculo, setVehiculo] = useState({
    patente: "",
    marca: "",
    modelo: "",
    anio: "",
  });
  const [loading, setLoading] = useState(true);

  // 🔹 Traer vehículo del chofer al cargar
  useEffect(() => {
    if (!choferId) return;

    const fetchVehiculo = async () => {
      const { data, error } = await supabase
        .from("vehiculos")
        .select("patente, marca, modelo, anio")
        .eq("chofer_id", choferId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error cargando vehículo:", error.message);
      } else if (data) {
        setVehiculo(data);
      }
      setLoading(false);
    };

    fetchVehiculo();
  }, [choferId]);

  const handleChange = (e) => {
    setVehiculo({ ...vehiculo, [e.target.name]: e.target.value });
  };

  // 🔹 Guardar / actualizar vehículo
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // upsert = inserta si no existe, actualiza si ya existe
      const { error } = await supabase.from("vehiculos").upsert({
        chofer_id: choferId,
        ...vehiculo,
      });

      if (error) throw error;
      alert("✅ Vehículo guardado con éxito");
    } catch (err) {
      alert("❌ Error al guardar vehículo: " + err.message);
    }
  };

  if (loading) return <p>Cargando datos del vehículo...</p>;

  return (
    <form
      onSubmit={handleSave}
      className="bg-white shadow-md rounded-lg p-6 max-w-2xl space-y-4"
    >
      <h2 className="text-xl font-bold text-gray-700">🚗 Datos del Vehículo</h2>

      <input
        type="text"
        name="patente"
        placeholder="Patente"
        value={vehiculo.patente}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="text"
        name="marca"
        placeholder="Marca"
        value={vehiculo.marca}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        name="modelo"
        placeholder="Modelo"
        value={vehiculo.modelo}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />
      <input
        type="number"
        name="anio"
        placeholder="Año"
        value={vehiculo.anio}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />

      <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
        Guardar Vehículo
      </button>
    </form>
  );
}
