import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function FormBanco({ choferId }) {
  const [form, setForm] = useState({
    banco: "",
    tipo_cuenta: "",
    cbu: "",
    alias: "",
    cuil: "",
  });

  const [loading, setLoading] = useState(true);

  // 🔹 Precargar si ya tiene cuenta
  useEffect(() => {
    if (!choferId) return;

    const fetchCuenta = async () => {
      const { data, error } = await supabase
        .from("cuentas_bancarias")
        .select("banco, tipo_cuenta, cbu, alias, cuil")
        .eq("chofer_id", choferId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error cargando cuenta bancaria:", error.message);
      } else if (data) {
        setForm(data);
      }
      setLoading(false);
    };

    fetchCuenta();
  }, [choferId]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from("cuentas_bancarias").upsert({
        chofer_id: choferId,
        ...form,
      });

      if (error) throw error;

      alert("✅ Datos bancarios guardados");
    } catch (err) {
      alert("❌ Error al guardar: " + err.message);
    }
  };

  if (loading) return <p>Cargando datos bancarios...</p>;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md rounded-lg p-6 max-w-2xl"
    >
      <h2 className="text-xl font-bold mb-4 text-gray-700">🏦 Cuenta Bancaria</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Banco */}
        <input
          name="banco"
          value={form.banco}
          onChange={handleChange}
          placeholder="Banco"
          className="border p-2 rounded-lg"
        />

        {/* Tipo de Cuenta */}
        <select
          name="tipo_cuenta"
          value={form.tipo_cuenta}
          onChange={handleChange}
          className="border p-2 rounded-lg"
        >
          <option value="">Seleccionar tipo de cuenta</option>
          <option value="Caja de Ahorro">Caja de Ahorro</option>
          <option value="Cuenta Corriente">Cuenta Corriente</option>
          <option value="Pago 24">Pago 24</option>
          <option value="Efectivo">Efectivo</option>
          <option value="Transferencia">Transferencia</option>
        </select>

        {/* CBU */}
        <input
          name="cbu"
          value={form.cbu}
          onChange={handleChange}
          placeholder="CBU"
          className="border p-2 rounded-lg"
        />

        {/* Alias */}
        <input
          name="alias"
          value={form.alias}
          onChange={handleChange}
          placeholder="Alias"
          className="border p-2 rounded-lg"
        />

        {/* CUIL */}
        <input
          name="cuil"
          value={form.cuil}
          onChange={handleChange}
          placeholder="CUIL"
          className="border p-2 rounded-lg"
        />
      </div>

      <button className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
        Guardar
      </button>
    </form>
  );
}
