const { createClient } = require("@supabase/supabase-js");

let supabaseStorage = null;

function obtenerSupabaseStorage() {
  if (supabaseStorage) {
    return supabaseStorage;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Falta configurar SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  supabaseStorage = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseStorage;
}

module.exports = { obtenerSupabaseStorage };