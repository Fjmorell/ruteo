import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function FormChofer() {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    direccion: "",
    telefono: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("choferes").insert([form]);

    setLoading(false);

    if (error) {
      alert("❌ Error al guardar: " + error.message);
    } else {
      alert("✅ Datos personales guardados en Supabase");
      setForm({ nombre: "", apellido: "", direccion: "", telefono: "" });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md rounded-lg p-6 max-w-2xl"
    >
      <h2 className="text-xl font-bold mb-4 text-gray-700">Datos Personales</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          placeholder="Nombre"
          className="border p-2 rounded-lg"
        />
        <input
          name="apellido"
          value={form.apellido}
          onChange={handleChange}
          placeholder="Apellido"
          className="border p-2 rounded-lg"
        />
        <input
          name="direccion"
          value={form.direccion}
          onChange={handleChange}
          placeholder="Dirección"
          className="border p-2 rounded-lg"
        />
        <input
          name="telefono"
          value={form.telefono}
          onChange={handleChange}
          placeholder="Teléfono"
          className="border p-2 rounded-lg"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
      >
        {loading ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
}
