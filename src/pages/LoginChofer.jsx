// src/pages/LoginChofer.jsx
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { Preferences } from "@capacitor/preferences";

export default function LoginChofer() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      const userId = data.user.id;

      // ✅ Guardar choferId en Preferences
      await Preferences.set({ key: "choferId", value: userId });

      // ✅ Marcar chofer como activo en Supabase
      await supabase.from("choferes").update({ activo: true }).eq("id", userId);

      setMensaje("✅ Login exitoso, redirigiendo...");
      navigate("/dashboard");
    } catch (err) {
      setMensaje("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-4">🚚 Login Chofer</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
        {mensaje && <p className="mt-4 text-center">{mensaje}</p>}
      </div>
    </div>
  );
}
