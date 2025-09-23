// src/components/FormDocumentos.jsx
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function FormDocumentos({ choferId }) {
  const [files, setFiles] = useState({
    foto: null,
    carnet: null,
    seguro: null,
  });

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;
    setFiles({ ...files, [name]: fileList[0] });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      for (const [key, file] of Object.entries(files)) {
        if (file) {
          const fileName = `${choferId}/${key}-${Date.now()}-${file.name}`;
          const { error } = await supabase.storage
            .from("documentos")
            .upload(fileName, file);

          if (error) throw error;
        }
      }
      alert("✅ Documentos subidos con éxito");
    } catch (err) {
      alert("❌ Error al subir documentos: " + err.message);
    }
  };

  return (
    <form
      onSubmit={handleUpload}
      className="bg-white shadow-md rounded-lg p-6 max-w-2xl space-y-6"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        📑 Documentos
      </h2>

      {/* === Campo Foto de Perfil === */}
      <div className="flex flex-col">
        <label className="font-medium text-gray-700 mb-2">
          📷 Foto de Perfil
        </label>
        <input
          type="file"
          name="foto"
          onChange={handleFileChange}
          className="border rounded-lg p-2 text-sm"
        />
      </div>

      {/* === Campo Carnet de Conducir === */}
      <div className="flex flex-col">
        <label className="font-medium text-gray-700 mb-2">
          🪪 Carnet de Conducir
        </label>
        <input
          type="file"
          name="carnet"
          onChange={handleFileChange}
          className="border rounded-lg p-2 text-sm"
        />
      </div>

      {/* === Campo Seguro === */}
      <div className="flex flex-col">
        <label className="font-medium text-gray-700 mb-2">📄 Seguro</label>
        <input
          type="file"
          name="seguro"
          onChange={handleFileChange}
          className="border rounded-lg p-2 text-sm"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 transition"
      >
        ✅ Subir Documentos
      </button>
    </form>
  );
}
