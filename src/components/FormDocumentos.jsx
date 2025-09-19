import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function FormDocumentos({ choferId }) {
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
      for (const [tipo, file] of Object.entries(files)) {
        if (!file) continue;

        const path = `${choferId}/${tipo}/${Date.now()}-${file.name}`;

        // 1. Subir archivo a Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("documentos")
          .upload(path, file);

        if (uploadError) throw uploadError;

        // 2. Obtener URL pública
        const { data: urlData } = supabase.storage
          .from("documentos")
          .getPublicUrl(path);

        // 3. Guardar en la tabla documentos
        const { error: insertError } = await supabase.from("documentos").insert([
          {
            chofer_id: choferId,
            tipo,
            url: urlData.publicUrl,
          },
        ]);

        if (insertError) throw insertError;
      }

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
        <label>
          Foto de perfil:
          <input type="file" name="fotoPerfil" onChange={handleFileChange} />
        </label>

        <label>
          Carnet de conducir:
          <input type="file" name="carnet" onChange={handleFileChange} />
        </label>

        <label>
          Seguro:
          <input type="file" name="seguro" onChange={handleFileChange} />
        </label>
      </div>

      <button className="mt-6 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
        Subir Documentos
      </button>
    </form>
  );
}
