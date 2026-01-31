[file name]: config.js
[file content begin]
// js/config.js - Configuración centralizada
const SUPABASE_CONFIG = {
    URL: "https://uqffsnrhasfqfcswkncf.supabase.co",
    ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZmZzbnJoYXNmcWZjc3drbmNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NzgyMDcsImV4cCI6MjA4NTE1NDIwN30.qVcKz8PuuEOBsObidm7Phmx-pw8iitYkH3Hzyc_E9Ak"
};

let supabaseClient = null;
let initializationAttempted = false;

function initSupabase() {
    if (initializationAttempted) {
        console.log('Supabase ya intentó inicializarse anteriormente');
        return supabaseClient;
    }
    
    initializationAttempted = true;
    
    try {
        if (!window.supabase) {
            console.error('❌ La biblioteca Supabase no está cargada');
            console.log('Asegúrate de que el script de Supabase se cargó antes de config.js');
            return null;
        }
        
        if (!SUPABASE_CONFIG.URL || !SUPABASE_CONFIG.ANON_KEY) {
            console.error('❌ Configuración de Supabase incompleta');
            return null;
        }
        
        console.log('🔄 Inicializando Supabase...');
        console.log('URL:', SUPABASE_CONFIG.URL);
        console.log('Clave anónima:', SUPABASE_CONFIG.ANON_KEY.substring(0, 20) + '...');
        
        supabaseClient = window.supabase.createClient(
            SUPABASE_CONFIG.URL, 
            SUPABASE_CONFIG.ANON_KEY
        );
        
        // Probar la conexión
        testSupabaseConnection(supabaseClient);
        
        console.log('✅ Supabase inicializado correctamente');
        return supabaseClient;
        
    } catch (error) {
        console.error('❌ Error crítico al inicializar Supabase:', error);
        return null;
    }
}

async function testSupabaseConnection(client) {
    try {
        console.log('🔄 Probando conexión a Supabase...');
        const { data, error } = await client.from('events').select('count', { count: 'exact', head: true });
        
        if (error) {
            console.error('❌ Error de conexión a Supabase:', error);
            return false;
        }
        
        console.log(`✅ Conexión exitosa. Tabla 'events' disponible`);
        return true;
        
    } catch (error) {
        console.error('❌ Error al probar conexión:', error);
        return false;
    }
}

// Inicializar inmediatamente cuando el script se carga
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.initSupabase = initSupabase;
window.getSupabaseClient = function() {
    if (!supabaseClient) {
        console.log('📞 Llamando a getSupabaseClient(), inicializando...');
        return initSupabase();
    }
    return supabaseClient;
};

// Verificar si estamos en el navegador
if (typeof window !== 'undefined') {
    console.log('🌐 config.js cargado en el navegador');
    
    // Inicializar automáticamente cuando se carga la página
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🚀 DOM cargado, verificando Supabase...');
        const client = window.getSupabaseClient();
        if (!client) {
            console.error('⚠️ No se pudo inicializar Supabase');
        }
    });
}
[file content end]
