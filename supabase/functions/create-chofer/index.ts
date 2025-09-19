import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // Manejar preflight (CORS)
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const { nombre, apellido, email, telefono, direccion, password } =
      await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 🔹 Crear usuario en Auth
    const { data: user, error: authError } =
  await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // 👈 fuerza confirmación del correo
    user_metadata: { nombre, apellido, telefono, direccion },
  });


    if (authError) throw authError;

    // 🔹 Insertar en tabla choferes
    const { data, error } = await supabaseAdmin
      .from("choferes")
      .insert([
        { id: user.user.id, nombre, apellido, email, telefono, direccion },
      ])
      .select("id")
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, choferId: data.id }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
