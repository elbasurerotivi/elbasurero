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
  if (!isLogin && pass.length < 6) {
    alert("La contraseña debe tener al menos 6 caracteres.");
    return;
  }

  if (isLogin) {
    // ---- Login ----
    signInWithEmailAndPassword(auth, email, pass)
      .then(userCredential => {
        console.log("Inicio de sesión exitoso:", userCredential.user.email);
        alert(`Bienvenido, ${userCredential.user.email}!`);
        cerrarLogin();
        // Recargar para actualizar la vista con datos del usuario
        location.reload();
      })
      .catch(error => {
        console.error("Error al iniciar sesión:", error);
        alert(`Error al iniciar sesión: ${error.message}`);
      });

  } else {
    // ---- Registro ----
    createUserWithEmailAndPassword(auth, email, pass)
      .then(userCredential => {
        const user = userCredential.user;
        console.log("Registro exitoso:", user.email);
        const userRef = ref(db, `users/${user.uid}`);
        set(userRef, {
          email: user.email,
          username: username || "Anónimo",
          createdAt: Date.now()
        })
        .then(() => {
          console.log("Datos del usuario guardados en la base de datos");
          alert(`Usuario registrado: ${user.email}`);
          cerrarLogin();
          location.reload();
        })
        .catch(error => {
          console.error("Error al guardar datos del usuario:", error);
          alert(`Error al guardar datos del usuario: ${error.message}`);
        });
      })
      .catch(error => {
        console.error("Error al registrarse:", error);
        alert(`Error al registrarse: ${error.message}`);
      });
  }
});

// -----------------------------
// 🔹 Login con Google
// -----------------------------
window.loginGoogle = function() {
  console.log("Iniciando autenticación con Google...");
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then(result => {
      const user = result.user;
      console.log("Autenticación con Google exitosa:", user.email);
      const userRef = ref(db, `users/${user.uid}`);
      set(userRef, {
        email: user.email,
        username: user.displayName || "Anónimo",
        createdAt: Date.now()
      })
      .then(() => {
        console.log("Datos del usuario guardados en la base de datos");
        alert(`Bienvenido, ${user.displayName || user.email}!`);
        cerrarLogin();
        location.reload();
      })
      .catch(error => {
        console.error("Error al guardar datos del usuario:", error);
        alert(`Error al guardar datos del usuario: ${error.message}`);
      });
    })
    .catch(error => {
      console.error("Error al iniciar sesión con Google:", error);
      alert(`Error al iniciar sesión con Google: ${error.message}`);
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
      set(userRef, {
        email: user.email,
        username: user.displayName || "Anónimo",
        createdAt: Date.now()
      })
      .then(() => {
        console.log("Datos del usuario guardados en la base de datos");
        alert(`Bienvenido, ${user.displayName || user.email}!`);
        cerrarLogin();
        location.reload();
      })
      .catch(error => {
        console.error("Error al guardar datos del usuario:", error);
        alert(`Error al guardar datos del usuario: ${error.message}`);
      });
    })
    .catch(error => {
      console.error("Error al iniciar sesión con Facebook:", error);
      alert(`Error al iniciar sesión con Facebook: ${error.message}`);
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
      location.reload();
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
    if (user) {
      console.log("Usuario conectado:", user.email, "UID:", user.uid);
      if (loginContainer) loginContainer.style.display = "none";
      if (logoutContainer) logoutContainer.style.display = "block";
    } else {
      console.log("No hay usuario conectado");
      if (loginContainer) loginContainer.style.display = "block";
      if (logoutContainer) logoutContainer.style.display = "none";
    }
  });
};

console.log("✅ login.js cargado correctamente");
