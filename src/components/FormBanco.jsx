import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function FormBanco() {
  const [form, setForm] = useState({
    banco: "",
    tipoCuenta: "",
    cbu: "",
    alias: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error } = await supabase.from("cuentas_bancarias").insert([form]);

    if (error) {
      alert("❌ Error al guardar: " + error.message);
    } else {
      alert("✅ Datos bancarios guardados");
      setForm({ banco: "", tipoCuenta: "", cbu: "", alias: "" });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md rounded-lg p-6 max-w-2xl"
    >
      <h2 className="text-xl font-bold mb-4 text-gray-700">Cuenta Bancaria</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          name="banco"
          value={form.banco}
          onChange={handleChange}
          placeholder="Banco"
          className="border p-2 rounded-lg"
        />
        <input
          name="tipoCuenta"
          value={form.tipoCuenta}
          onChange={handleChange}
          placeholder="Tipo de Cuenta"
          className="border p-2 rounded-lg"
        />
        <input
          name="cbu"
          value={form.cbu}
          onChange={handleChange}
          placeholder="CBU"
          className="border p-2 rounded-lg"
        />
        <input
          name="alias"
          value={form.alias}
          onChange={handleChange}
          placeholder="Alias"
          className="border p-2 rounded-lg"
        />
      </div>

      <button className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
        Guardar
      </button>
    </form>
  );
}
