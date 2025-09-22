import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AdminChoferDetalle() {
  const { choferId } = useParams();
  const [chofer, setChofer] = useState(null);
  const [vehiculo, setVehiculo] = useState(null);
  const [banco, setBanco] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 🔹 Datos del chofer
      const { data: choferData } = await supabase
        .from("choferes")
        .select("*")
        .eq("id", choferId)
        .single();
      setChofer(choferData);

      // 🔹 Vehículo
      const { data: vehiculoData } = await supabase
        .from("vehiculos")
        .select("*")
        .eq("chofer_id", choferId)
        .single();
      setVehiculo(vehiculoData);

      // 🔹 Cuenta bancaria
      const { data: bancoData } = await supabase
        .from("cuentas_bancarias")
        .select("*")
        .eq("chofer_id", choferId)
        .single();
      setBanco(bancoData);

      // 🔹 Documentos
      const { data: docsData } = await supabase
        .from("documentos")
        .select("*")
        .eq("chofer_id", choferId);
      setDocumentos(docsData || []);

      setLoading(false);
    };

    fetchData();
  }, [choferId]);

  if (loading) return <p className="p-6">Cargando datos...</p>;

  return (
    <div className="p-6 space-y-6">
      <Link to="/admin" className="text-blue-600 hover:underline">⬅ Volver</Link>
      <h1 className="text-2xl font-bold">Detalle del Chofer</h1>

      {/* Datos Personales */}
      {chofer ? (
        <div className="bg-white shadow p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Datos Personales</h2>
          <p><b>Nombre:</b> {chofer.nombre} {chofer.apellido}</p>
          <p><b>Email:</b> {chofer.email}</p>
          <p><b>Teléfono:</b> {chofer.telefono}</p>
          <p><b>Dirección:</b> {chofer.direccion}</p>
        </div>
      ) : (
        <p>Sin datos personales</p>
      )}

      {/* Vehículo */}
      {vehiculo ? (
        <div className="bg-white shadow p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Vehículo</h2>
          <p><b>Marca:</b> {vehiculo.marca}</p>
          <p><b>Modelo:</b> {vehiculo.modelo}</p>
          <p><b>Patente:</b> {vehiculo.patente}</p>
        </div>
      ) : (
        <p>Sin datos de vehículo</p>
      )}

      {/* Cuenta bancaria */}
      {banco ? (
        <div className="bg-white shadow p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Cuenta Bancaria</h2>
          <p><b>Banco:</b> {banco.banco}</p>
          <p><b>Tipo:</b> {banco.tipo_cuenta}</p>
          <p><b>CBU:</b> {banco.cbu}</p>
          <p><b>Alias:</b> {banco.alias}</p>
          <p><b>CUIL:</b> {banco.cuil}</p>
        </div>
      ) : (
        <p>Sin cuenta bancaria registrada</p>
      )}

      {/* Documentos */}
      <div className="bg-white shadow p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Documentos</h2>
        {documentos.length > 0 ? (
          <ul className="list-disc pl-6">
            {documentos.map((doc, i) => (
              <li key={i}>
                {doc.tipo || "Documento"}:{" "}
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  Ver archivo
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay documentos cargados</p>
        )}
      </div>
    </div>
  );
}
