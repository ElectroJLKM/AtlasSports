// js/config.js - Configuración centralizada
const SUPABASE_CONFIG = {
    URL: "https://uqffsnrhasfqfcswkncf.supabase.co",
    ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZmZzbnJoYXNmcWZjc3drbmNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NzgyMDcsImV4cCI6MjA4NTE1NDIwN30.qVcKz8PuuEOBsObidm7Phmx-pw8iitYkH3Hzyc_E9Ak"
};

let supabaseClient = null;

function initSupabase() {
    if (!supabaseClient && window.supabase) {
        supabaseClient = window.supabase.createClient(
            SUPABASE_CONFIG.URL, 
            SUPABASE_CONFIG.ANON_KEY
        );
        console.log('✅ Supabase inicializado');
    }
    return supabaseClient;
}

// Inicializar inmediatamente cuando el script se carga
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.initSupabase = initSupabase;
window.getSupabaseClient = function() {
    return supabaseClient || initSupabase();
};
