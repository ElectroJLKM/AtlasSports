// auth.js - Versión SEGURA para GitHub Pages
// NUNCA pongas claves reales aquí. Usaremos un método alternativo.

class AuthManager {
  constructor() {
    // Método 1: Para desarrollo local (claves ficticias)
    // En producción real, necesitarás un backend ligero
    this.config = {
      supabaseUrl: '',
      supabaseKey: '',
      isConfigured: false
    };
    
    this.init();
  }
  
  init() {
    // Verificar si estamos en GitHub Pages
    if (window.location.hostname.includes('github.io')) {
      console.log('Modo GitHub Pages activado - Autenticación limitada');
      this.setupMockAuth(); // Usar autenticación simulada temporalmente
    } else {
      console.log('Modo desarrollo local');
      // Aquí podrías cargar config local (pero NO subirla a GitHub)
    }
  }
  
  setupMockAuth() {
    // Sistema temporal de autenticación simulada
    // PARA PRODUCCIÓN REAL: Necesitas un backend separado
    console.warn('⚠️ Usando autenticación simulada. Para producción, implementa un backend.');
    
    // Simular sesión en localStorage
    this.user = JSON.parse(localStorage.getItem('atlas_mock_user')) || null;
    this.updateUI();
  }
  
  async mockLogin(email, password) {
    // Simulación de login - EN PRODUCCIÓN REEMPLAZA CON SUPABASE REAL
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password.length >= 6) {
          this.user = {
            email: email,
            username: email.split('@')[0],
            id: 'mock_' + Date.now(),
            isMock: true
          };
          
          localStorage.setItem('atlas_mock_user', JSON.stringify(this.user));
          this.updateUI();
          resolve({ user: this.user });
        } else {
          reject(new Error('Credenciales inválidas (simulado)'));
        }
      }, 500);
    });
  }
  
  async mockRegister(email, password, username) {
    // Simulación de registro
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password && username) {
          this.user = {
            email: email,
            username: username,
            id: 'mock_' + Date.now(),
            isMock: true
          };
          
          localStorage.setItem('atlas_mock_user', JSON.stringify(this.user));
          this.updateUI();
          resolve({ user: this.user });
        } else {
          reject(new Error('Datos incompletos (simulado)'));
        }
      }, 500);
    });
  }
  
  logout() {
    localStorage.removeItem('atlas_mock_user');
    this.user = null;
    this.updateUI();
    window.location.href = 'index.html';
  }
  
  updateUI() {
    // Actualizar botones de login/logout en todas las páginas
    const authElements = document.querySelectorAll('.auth');
    
    authElements.forEach(element => {
      if (this.user) {
        element.innerHTML = `
          <span style="margin-right: 1rem;">👋 ${this.user.username}</span>
          <a href="#" id="logoutBtn" class="btn">Cerrar Sesión</a>
        `;
        
        const logoutBtn = element.querySelector('#logoutBtn');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
          });
        }
      } else {
        element.innerHTML = `
          <a href="login.html" class="login-btn">Iniciar Sesión</a>
          <a href="register.html" class="btn">Registrarse</a>
        `;
      }
    });
  }
  
  isAuthenticated() {
    return !!this.user;
  }
}

// Exportar instancia única
const authManager = new AuthManager();
export default authManager;

// Funciones de conveniencia para importar
export const handleLogin = (email, password) => authManager.mockLogin(email, password);
export const handleRegister = (email, password, username) => authManager.mockRegister(email, password, username);
export const handleLogout = () => authManager.logout();
export const checkAuth = () => authManager.isAuthenticated();
