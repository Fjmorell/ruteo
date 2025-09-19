import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ListaDocumentos({ choferId }) {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!choferId) return;

    const fetchDocs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("documentos")
        .select("id, tipo, url, fecha_vencimiento, creado_en")
        .eq("chofer_id", choferId)
        .order("creado_en", { ascending: false });

      if (error) {
        console.error("❌ Error cargando documentos:", error.message);
      } else {
        setDocumentos(data);
      }
      setLoading(false);
    };

    fetchDocs();
  }, [choferId]);

  const checkVencimiento = (fecha) => {
    if (!fecha) return null;

    const hoy = new Date();
    const venc = new Date(fecha);

    if (venc < hoy) return "⛔ Vencido";
    if ((venc - hoy) / (1000 * 60 * 60 * 24) <= 30) return "⚠️ Próximo a vencer";
    return "✅ Vigente";
  };

  if (loading) return <p>Cargando documentos...</p>;

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-6 max-w-2xl">
      <h2 className="text-xl font-bold mb-4 text-gray-700">📑 Mis Documentos</h2>

      {documentos.length === 0 ? (
        <p className="text-gray-500">No has subido documentos aún.</p>
      ) : (
        <ul className="space-y-3">
          {documentos.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between border p-3 rounded-lg"
            >
              <div>
                <p className="font-semibold capitalize">{doc.tipo}</p>
                <p className="text-sm text-gray-500">
                  Subido: {new Date(doc.creado_en).toLocaleDateString()}
                </p>
                {doc.fecha_vencimiento && (
                  <p className="text-sm">
                    Vencimiento:{" "}
                    <span className="font-medium">
                      {new Date(doc.fecha_vencimiento).toLocaleDateString()} –{" "}
                      {checkVencimiento(doc.fecha_vencimiento)}
                    </span>
                  </p>
                )}
              </div>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Ver documento
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
