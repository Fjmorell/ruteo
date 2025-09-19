import { useState } from "react";

export default function FormCrearChofer({ onCreated }) {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    direccion: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(
        "https://ijptwyglnrpizhrwfgnq.functions.supabase.co/create-chofer",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage(`✅ Chofer creado con ID: ${data.choferId}`);
        setForm({
          nombre: "",
          apellido: "",
          email: "",
          telefono: "",
          direccion: "",
          password: "",
        });
        if (onCreated) onCreated(); // refresca lista en DashboardAdmin
      } else {
        setMessage(`❌ Error: ${data.error || "No se pudo crear el chofer"}`);
      }
    } catch (error) {
      console.error(error);
      setMessage("❌ Error de red al crear chofer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white shadow-lg rounded p-6 space-y-4 mb-6"
    >
      <h2 className="text-xl font-bold flex items-center gap-2">
        👤 Crear nuevo chofer
      </h2>

      <input
        type="text"
        name="nombre"
        placeholder="Nombre"
        value={form.nombre}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="text"
        name="apellido"
        placeholder="Apellido"
        value={form.apellido}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="text"
        name="telefono"
        placeholder="Teléfono"
        value={form.telefono}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="text"
        name="direccion"
        placeholder="Dirección"
        value={form.direccion}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Contraseña"
        value={form.password}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        {loading ? "Creando..." : "Crear Chofer"}
      </button>

      {message && (
        <p className="text-center mt-4 font-medium text-gray-700">{message}</p>
      )}
    </form>
  );
}
