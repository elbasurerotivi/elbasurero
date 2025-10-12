import { auth, db, ref, set } from "./firebase-config.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let isLogin = true;

// -----------------------------
// 🔹 Abrir / Cerrar popup
// -----------------------------
window.abrirLogin = function() {
  const loginModal = document.getElementById("loginModal");
  if (loginModal) {
    loginModal.style.display = "flex";
    console.log("Popup de login abierto");
  } else {
    console.error("No se encontró el elemento #loginModal");
  }
};

window.cerrarLogin = function() {
  const loginModal = document.getElementById("loginModal");
  if (loginModal) {
    loginModal.style.display = "none";
    console.log("Popup de login cerrado");
  } else {
    console.error("No se encontró el elemento #loginModal");
  }
};

// -----------------------------
// 🔹 Cambiar entre login y registro
// -----------------------------
window.toggleForm = function() {
  isLogin = !isLogin;
  const formTitle = document.getElementById("form-title");
  const actionBtn = document.getElementById("actionBtn");
  const switchLink = document.querySelector(".switch");
  const usernameGroup = document.getElementById("username-group");

  if (formTitle) formTitle.innerText = isLogin ? "Iniciar Sesión" : "Registrarse";
  if (actionBtn) actionBtn.innerText = isLogin ? "Login" : "Registrarse";
  if (switchLink) switchLink.innerText = isLogin 
    ? "¿No tienes cuenta? Regístrate aquí" 
    : "¿Ya tienes cuenta? Inicia sesión aquí";
  if (usernameGroup) usernameGroup.style.display = isLogin ? "none" : "block";

  console.log(`Formulario cambiado a: ${isLogin ? "Login" : "Registro"}`);
};

// -----------------------------
// 🔹 Acción protegida (wrapper)
// -----------------------------
window.accionProtegida = function(callback) {
  if (auth.currentUser) {
    console.log("Usuario autenticado:", auth.currentUser.email);
    callback();
  } else {
    console.log("No hay usuario autenticado, abriendo popup de login");
    window.abrirLogin();
  }
};

// -----------------------------
// 🔹 Validación de email
// -----------------------------
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// -----------------------------
// 🔹 Login / Registro con email y contraseña
// -----------------------------
document.getElementById("actionBtn")?.addEventListener("click", () => {
  const email = document.getElementById("email")?.value.trim();
  const pass = document.getElementById("password")?.value.trim();
  const username = document.getElementById("username")?.value.trim();

  if (!email || !pass) {
    alert("Por favor, completa todos los campos requeridos.");
    return;
  }

  if (!isValidEmail(email)) {
    alert("Por favor, ingresa un correo electrónico válido.");
    return;
  }

  if (!isLogin && pass.length < 6) {
    alert("La contraseña debe tener al menos 6 caracteres.");
    return;
  }

  if (!isLogin && !username) {
    alert("Por favor, ingresa un nombre de usuario.");
    return;
  }

  if (isLogin) {
    signInWithEmailAndPassword(auth, email, pass)
      .then(userCredential => {
        console.log("Inicio de sesión exitoso:", userCredential.user.email);
        alert(`Bienvenido, ${userCredential.user.email}!`);
        cerrarLogin();
      })
      .catch(error => {
        console.error("Error al iniciar sesión:", error);
        let errorMessage = "Error al iniciar sesión.";
        switch (error.code) {
          case "auth/user-not-found":
            errorMessage = "Usuario no encontrado. Verifica tu correo.";
            break;
          case "auth/wrong-password":
            errorMessage = "Contraseña incorrecta.";
            break;
          case "auth/too-many-requests":
            errorMessage = "Demasiados intentos. Intenta de nuevo más tarde.";
            break;
          default:
            errorMessage = error.message;
        }
        alert(errorMessage);
      });
  } else {
    createUserWithEmailAndPassword(auth, email, pass)
      .then(userCredential => {
        const user = userCredential.user;
        console.log("Registro exitoso:", user.email);
        const userRef = ref(db, `users/${user.uid}`);
        return set(userRef, {
          email: user.email,
          username: username,
          createdAt: Date.now()
        })
        .then(() => {
          console.log("Datos del usuario guardados en la base de datos");
          alert(`Usuario registrado: ${user.email}`);
          cerrarLogin();
        });
      })
      .catch(error => {
        console.error("Error al registrarse:", error);
        let errorMessage = "Error al registrarse.";
        switch (error.code) {
          case "auth/email-already-in-use":
            errorMessage = "El correo ya está registrado.";
            break;
          case "auth/invalid-email":
            errorMessage = "Correo electrónico inválido.";
            break;
          default:
            errorMessage = error.message;
        }
        alert(errorMessage);
      });
  }
});

// -----------------------------
// 🔹 Login con Google
// -----------------------------
window.loginGoogle = function() {
  console.log("Iniciando autenticación con Google...");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account' // Fuerza la selección de cuenta para evitar cierres accidentales
  });
  signInWithPopup(auth, provider)
    .then(result => {
      const user = result.user;
      console.log("Autenticación con Google exitosa:", user.email);
      const userRef = ref(db, `users/${user.uid}`);
      return set(userRef, {
        email: user.email,
        username: user.displayName || "Anónimo",
        createdAt: Date.now()
      })
      .then(() => {
        console.log("Datos del usuario guardados en la base de datos");
        alert(`Bienvenido, ${user.displayName || user.email}!`);
        cerrarLogin();
      });
    })
    .catch(error => {
      console.error("Error al iniciar sesión con Google:", error);
      let errorMessage = "Error al iniciar sesión con Google.";
      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "El popup se cerró antes de completar el proceso. Por favor, intenta de nuevo y no cierres la ventana.";
      } else if (error.code === "auth/popup-blocked") {
        errorMessage = "El popup fue bloqueado por el navegador. Permite popups para este sitio en la configuración de tu navegador.";
      } else {
        errorMessage = error.message;
      }
      alert(errorMessage);
    });
};

// -----------------------------
// 🔹 Login con Facebook
// -----------------------------
window.loginFacebook = function() {
  console.log("Iniciando autenticación con Facebook...");
  const provider = new FacebookAuthProvider();
  signInWithPopup(auth, provider)
    .then(result => {
      const user = result.user;
      console.log("Autenticación con Facebook exitosa:", user.email);
      const userRef = ref(db, `users/${user.uid}`);
      return set(userRef, {
        email: user.email,
        username: user.displayName || "Anónimo",
        createdAt: Date.now()
      })
      .then(() => {
        console.log("Datos del usuario guardados en la base de datos");
        alert(`Bienvenido, ${user.displayName || user.email}!`);
        cerrarLogin();
      });
    })
    .catch(error => {
      console.error("Error al iniciar sesión con Facebook:", error);
      let errorMessage = "Error al iniciar sesión con Facebook.";
      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "El popup se cerró antes de completar el proceso. Por favor, intenta de nuevo y no cierres la ventana.";
      } else if (error.code === "auth/popup-blocked") {
        errorMessage = "El popup fue bloqueado por el navegador. Permite popups para este sitio en la configuración de tu navegador.";
      } else {
        errorMessage = error.message;
      }
      alert(errorMessage);
    });
};

// -----------------------------
// 🔹 Logout
// -----------------------------
window.logout = function() {
  signOut(auth)
    .then(() => {
      console.log("Sesión cerrada exitosamente.");
      alert("Sesión cerrada exitosamente.");
      // Forzar actualización de la UI
      const loginContainer = document.getElementById("login-container");
      const logoutContainer = document.getElementById("logout-container");
      if (loginContainer) loginContainer.style.display = "block";
      if (logoutContainer) logoutContainer.style.display = "none";
    })
    .catch(error => {
      console.error("Error al cerrar sesión:", error);
      alert(`Error al cerrar sesión: ${error.message}`);
    });
};

// -----------------------------
// 🔹 Inicializar botones de login/logout (header)
// -----------------------------
window.initAuthButtons = function() {
  const loginContainer = document.getElementById("login-container");
  const logoutContainer = document.getElementById("logout-container");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      window.abrirLogin();
      console.log("Clic en botón Login del header");
    });
  } else {
    console.warn("No se encontró el elemento #login-btn");
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      window.logout();
      console.log("Clic en botón Logout del header");
    });
  } else {
    console.warn("No se encontró el elemento #logout-btn");
  }

  // Actualizar visibilidad según estado de autenticación
  onAuthStateChanged(auth, user => {
    console.log("Estado de autenticación cambiado:", user ? `Usuario conectado: ${user.email}` : "No hay usuario conectado");
    if (user) {
      if (loginContainer) {
        loginContainer.style.display = "none";
        console.log("login-container ocultado");
      } else {
        console.warn("No se encontró el elemento #login-container");
      }
      if (logoutContainer) {
        logoutContainer.style.display = "block";
        console.log("logout-container mostrado");
      } else {
        console.warn("No se encontró el elemento #logout-container");
      }
      localStorage.setItem("userId", user.uid);
    } else {
      if (loginContainer) {
        loginContainer.style.display = "block";
        console.log("login-container mostrado");
      } else {
        console.warn("No se encontró el elemento #login-container");
      }
      if (logoutContainer) {
        logoutContainer.style.display = "none";
        console.log("logout-container ocultado");
      } else {
        console.warn("No se encontró el elemento #logout-container");
      }
      let userId = localStorage.getItem("userId");
      if (!userId) {
        userId = "user_" + Math.random().toString(36).substring(2, 9);
        localStorage.setItem("userId", userId);
      }
    }
  });
};

// Ejecutar inicialización cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  console.log("Inicializando botones de autenticación...");
  window.initAuthButtons();
});

console.log("✅ login.js cargado correctamente");