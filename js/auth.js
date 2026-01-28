// Configuración SEGURA - Las variables de entorno se configuran en el servidor
// Para desarrollo local, crea un archivo .env.local (no lo subas a GitHub)

// Método 1: Usando variables de entorno (recomendado para producción)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || window.location.origin;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Método 2: Para desarrollo rápido (NUNCA subir esto a GitHub)
// const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
// const SUPABASE_ANON_KEY = 'tu-clave-anon-publica';

// Importar Supabase (necesitarás instalarlo: npm install @supabase/supabase-js)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Crear cliente solo si tenemos las credenciales
let supabase;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.warn('Credenciales de Supabase no configuradas. La autenticación no funcionará.');
}

// Manejo de Login
export async function handleLogin(email, password) {
  if (!supabase) {
    throw new Error('Sistema de autenticación no configurado. Contacta al administrador.');
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });

    if (error) throw error;

    // Login exitoso
    console.log('Usuario autenticado:', data.user.email);
    
    // Guardar sesión en localStorage (opcional)
    localStorage.setItem('atlas_user', JSON.stringify({
      email: data.user.email,
      id: data.user.id
    }));
    
    // Redirigir al dashboard o página principal
    window.location.href = 'index.html';
    
    return data;
  } catch (error) {
    console.error('Error en login:', error.message);
    throw new Error(
      error.message === 'Invalid login credentials'
        ? 'Correo o contraseña incorrectos.'
        : 'Error en el servidor. Intenta más tarde.'
    );
  }
}

// Manejo de Registro
export async function handleRegister(email, password, username) {
  if (!supabase) {
    throw new Error('Sistema de autenticación no configurado.');
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          username: username.trim(),
          created_at: new Date().toISOString()
        },
        emailRedirectTo: `${window.location.origin}/login.html`
      }
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error en registro:', error);
    throw new Error(
      error.message.includes('already registered')
        ? 'Este correo ya está registrado.'
        : 'Error al crear la cuenta. Intenta nuevamente.'
    );
  }
}

// Verificar si hay sesión activa
export async function checkAuth() {
  if (!supabase) return null;
  
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Cerrar sesión
export async function handleLogout() {
  if (!supabase) return;
  
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Error al cerrar sesión:', error);
  
  localStorage.removeItem('atlas_user');
  window.location.href = 'index.html';
}

// Verificar estado de autenticación al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
  const session = await checkAuth();
  const authElements = document.querySelectorAll('.auth');
  
  if (session && authElements.length > 0) {
    // Usuario está logueado - mostrar perfil
    authElements.forEach(element => {
      element.innerHTML = `
        <span style="margin-right: 1rem;">👋 ${session.user.email}</span>
        <a href="#" id="logoutBtn" class="btn">Cerrar Sesión</a>
      `;
      
      element.querySelector('#logoutBtn').addEventListener('click', handleLogout);
    });
  }
});
