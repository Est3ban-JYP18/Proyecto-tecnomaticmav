import { createClient } from "@supabase/supabase-js";

// Obtener credenciales desde variables de entorno o almacenamiento local dinámico
const envUrl = import.meta.env.VITE_SUPABASE_URL || "";
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const customUrl = localStorage.getItem("tecnomatic_supabase_url");
const customKey = localStorage.getItem("tecnomatic_supabase_key");

export const SUPABASE_URL = customUrl || envUrl || "https://tu-proyecto.supabase.co";
export const SUPABASE_ANON_KEY = customKey || envAnonKey || "tu-anon-key-de-supabase";

// Validación de configuración válida
export const isSupabaseConfigured = () => {
  return (
    Boolean(SUPABASE_URL) &&
    Boolean(SUPABASE_ANON_KEY) &&
    !SUPABASE_URL.includes("tu-proyecto.supabase.co") &&
    !SUPABASE_ANON_KEY.includes("tu-anon-key-de-supabase") &&
    SUPABASE_URL.startsWith("https://")
  );
};

// Cliente oficial de Supabase
export const supabase = createClient(
  isSupabaseConfigured() ? SUPABASE_URL : "https://placeholder-tecnomatic.supabase.co",
  isSupabaseConfigured() ? SUPABASE_ANON_KEY : "placeholder-key-tecnomatic",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Función para probar la conexión con Supabase en tiempo real.
// No se consulta una tabla aquí: su nombre y sus políticas RLS dependen de cada
// proyecto. Consultar `categorias` hacía que una conexión válida pareciera fallida
// en proyectos que usan otro esquema.
export const testSupabaseConnection = async () => {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      message: "Credenciales de Supabase no configuradas en .env o almacenamiento local.",
    };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    });

    if (!response.ok) {
      const details = await response.text();
      return {
        connected: false,
        message: `Supabase respondió con el estado ${response.status}. Verifica la URL y la Anon Key.`,
        details,
      };
    }

    return {
      connected: true,
      message: "¡Conexión exitosa con Supabase!",
    };
  } catch (err) {
    return {
      connected: false,
      message: `Fallo de red al conectar con Supabase: ${err.message}`,
    };
  }
};

// Permite al usuario configurar sus credenciales directamente desde la interfaz
export const saveCustomSupabaseConfig = (url, key) => {
  if (url && key) {
    localStorage.setItem("tecnomatic_supabase_url", url.trim());
    localStorage.setItem("tecnomatic_supabase_key", key.trim());
    window.location.reload();
  }
};

export const clearCustomSupabaseConfig = () => {
  localStorage.removeItem("tecnomatic_supabase_url");
  localStorage.removeItem("tecnomatic_supabase_key");
  window.location.reload();
};
