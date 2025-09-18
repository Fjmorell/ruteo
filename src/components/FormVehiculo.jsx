import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function FormVehiculo() {
  const [form, setForm] = useState({
    marca: "",
    modelo: "",
    patente: "",
    color: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error } = await supabase.from("vehiculos").insert([form]);

    if (error) {
      alert("❌ Error al guardar: " + error.message);
    } else {
      alert("✅ Datos del vehículo guardados");
      setForm({ marca: "", modelo: "", patente: "", color: "" });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md rounded-lg p-6 max-w-2xl"
    >
      <h2 className="text-xl font-bold mb-4 text-gray-700">Datos del Vehículo</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          name="marca"
          value={form.marca}
          onChange={handleChange}
          placeholder="Marca"
          className="border p-2 rounded-lg"
        />
        <input
          name="modelo"
          value={form.modelo}
          onChange={handleChange}
          placeholder="Modelo"
          className="border p-2 rounded-lg"
        />
        <input
          name="patente"
          value={form.patente}
          onChange={handleChange}
          placeholder="Patente"
          className="border p-2 rounded-lg"
        />
        <input
          name="color"
          value={form.color}
          onChange={handleChange}
          placeholder="Color"
          className="border p-2 rounded-lg"
        />
      </div>

      <button className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
        Guardar
      </button>
    </form>
  );
}
