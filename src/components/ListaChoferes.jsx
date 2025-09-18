import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ListaChoferes() {
  const [choferes, setChoferes] = useState([]);

  useEffect(() => {
    fetchChoferes();
  }, []);

  const fetchChoferes = async () => {
    const { data, error } = await supabase.from("choferes").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error(error);
    } else {
      setChoferes(data);
    }
  };

  return (
    <div className="mt-6 bg-white p-4 rounded shadow-md">
      <h2 className="text-xl font-bold mb-4">📋 Lista de Choferes</h2>
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">Nombre</th>
            <th className="p-2 border">Apellido</th>
            <th className="p-2 border">Teléfono</th>
            <th className="p-2 border">Vehículo</th>
            <th className="p-2 border">Carnet</th>
          </tr>
        </thead>
        <tbody>
          {choferes.map((c) => (
            <tr key={c.id} className="text-center">
              <td className="border p-2">{c.nombre}</td>
              <td className="border p-2">{c.apellido}</td>
              <td className="border p-2">{c.telefono}</td>
              <td className="border p-2">{c.vehiculo}</td>
              <td className="border p-2">{c.carnet}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
