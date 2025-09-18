import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function FormDocumentos() {
  const [files, setFiles] = useState({
    fotoPerfil: null,
    carnet: null,
    seguro: null,
  });

  const handleFileChange = (e) => {
    const { name, files: selected } = e.target;
    setFiles({ ...files, [name]: selected[0] });
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    try {
      const uploaded = {};

      for (const [key, file] of Object.entries(files)) {
        if (!file) continue;

        const path = `${key}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("documentos")
          .upload(path, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("documentos")
          .getPublicUrl(path);

        uploaded[key] = urlData.publicUrl;
      }

      // Guardamos en la tabla documentos
      const { error } = await supabase.from("documentos").insert([uploaded]);

      if (error) throw error;

      alert("✅ Documentos subidos y guardados en Supabase");
    } catch (err) {
      alert("❌ Error al subir documentos: " + err.message);
    }
  };

  return (
    <form
      onSubmit={handleUpload}
      className="bg-white shadow-md rounded-lg p-6 max-w-2xl"
    >
      <h2 className="text-xl font-bold mb-4 text-gray-700">Documentos</h2>

      <div className="space-y-4">
        <input type="file" name="fotoPerfil" onChange={handleFileChange} />
        <input type="file" name="carnet" onChange={handleFileChange} />
        <input type="file" name="seguro" onChange={handleFileChange} />
      </div>

      <button className="mt-6 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
        Subir Documentos
      </button>
    </form>
  );
}
