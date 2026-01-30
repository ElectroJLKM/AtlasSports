// js/config.js - Configuración centralizada de Supabase

// CREDENCIALES DE SUPABASE
const SUPABASE_CONFIG = {
    URL: "https://uqffsnrhasfqfcswkncf.supabase.co",
    ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZmZzbnJoYXNmcWZjc3drbmNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NzgyMDcsImV4cCI6MjA4NTE1NDIwN30.qVcKz8PuuEOBsObidm7Phmx-pw8iitYkH3Hzyc_E9Ak"
};

// Cliente Supabase global
let supabaseClient = null;

// Función para obtener o crear el cliente Supabase
function getSupabaseClient() {
    if (!supabaseClient && window.supabase) {
        supabaseClient = window.supabase.createClient(
            SUPABASE_CONFIG.URL, 
            SUPABASE_CONFIG.ANON_KEY
        );
    }
    return supabaseClient;
}

// Inicializar automáticamente si Supabase está disponible
document.addEventListener('DOMContentLoaded', function() {
    if (window.supabase && !supabaseClient) {
        supabaseClient = getSupabaseClient();
    }
});

// Exportar para usar en otros archivos
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.getSupabaseClient = getSupabaseClient;
