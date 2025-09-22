import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { id, nombre, apellido, email, telefono, direccion, password } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1️⃣ Actualizar usuario en Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      email,
      ...(password ? { password } : {}), // 👈 solo si envían contraseña nueva
      user_metadata: { nombre, apellido, telefono, direccion },
    });

    if (authError) throw authError;

    // 2️⃣ Actualizar fila en choferes
    const { error: dbError } = await supabaseAdmin
      .from("choferes")
      .update({ nombre, apellido, email, telefono, direccion })
      .eq("id", id);

    if (dbError) throw dbError;

    return new Response(
      JSON.stringify({ success: true, message: "Chofer actualizado correctamente" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
