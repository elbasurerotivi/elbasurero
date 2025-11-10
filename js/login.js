// js/login.js
import { 
  auth, 
  db, 
  ref, 
  set,
  onAuthStateChanged 
} from "./firebase-config.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let isLogin = true;

// === ESPERAR A QUE EL DOM CARGUE ===
document.addEventListener("DOMContentLoaded", () => {
  initLoginSystem();
});

function initLoginSystem() {
  const actionBtn = document.getElementById("actionBtn");
  if (!actionBtn) {
    console.error("Botón #actionBtn no encontrado. ¿El HTML está cargado?");
    return;
  }

  // -----------------------------
  // Abrir / Cerrar popup
  // -----------------------------
  window.abrirLogin = function() {
    const loginModal = document.getElementById("loginModal");
    if (loginModal) {
      loginModal.style.display = "flex";
    }
  };

  window.cerrarLogin = function() {
    const loginModal = document.getElementById("loginModal");
    if (loginModal) {
      loginModal.style.display = "none";
    }
  };

  // -----------------------------
  // Cambiar entre login y registro
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
  };

  // -----------------------------
  // Validación de email
  // -----------------------------
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // -----------------------------
  // Login / Registro
  // -----------------------------
  actionBtn.addEventListener("click", () => {
    const email = document.getElementById("email")?.value.trim();
    const pass = document.getElementById("password")?.value.trim();
    const username = document.getElementById("username")?.value.trim();

    if (!email || !pass) {
      alert("Completa todos los campos.");
      return;
    }

    if (!isValidEmail(email)) {
      alert("Correo inválido.");
      return;
    }

    if (!isLogin && pass.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (!isLogin && !username) {
      alert("Ingresa un nombre de usuario.");
      return;
    }

    if (isLogin) {
      signInWithEmailAndPassword(auth, email, pass)
        .then(userCredential => {
          alert(`¡Bienvenido, ${userCredential.user.email}!`);
          cerrarLogin();
        })
        .catch(error => {
          const msg = {
            "auth/user-not-found": "Usuario no encontrado.",
            "auth/wrong-password": "Contraseña incorrecta.",
            "auth/too-many-requests": "Demasiados intentos. Espera."
          }[error.code] || error.message;
          alert(msg);
        });
    } else {
      createUserWithEmailAndPassword(auth, email, pass)
        .then(userCredential => {
          const user = userCredential.user;
          return set(ref(db, `users/${user.uid}`), {
            email: user.email,
            username: username,
            createdAt: Date.now(),
            role: "user"
          });
        })
        .then(() => {
          alert("¡Usuario creado con éxito!");
          cerrarLogin();
        })
        .catch(error => {
          const msg = {
            "auth/email-already-in-use": "Este correo ya está registrado.",
            "auth/invalid-email": "Correo inválido.",
            "auth/weak-password": "Contraseña muy débil."
          }[error.code] || error.message;
          alert(msg);
        });
    }
  });

  // -----------------------------
  // Google Login
  // -----------------------------
  window.loginGoogle = function() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    signInWithPopup(auth, provider)
      .then(result => {
        const user = result.user;
        return set(ref(db, `users/${user.uid}`), {
          email: user.email,
          username: user.displayName || "Anónimo",
          createdAt: Date.now(),
          role: "user"
        });
      })
      .then(() => {
        alert(`¡Bienvenido con Google, ${auth.currentUser.displayName || auth.currentUser.email}!`);
        cerrarLogin();
      })
      .catch(error => {
        if (error.code !== "auth/popup-closed-by-user") {
          alert("Error con Google: " + (error.message || "Intenta de nuevo"));
        }
      });
  };

  // -----------------------------
  // Facebook Login
  // -----------------------------
  window.loginFacebook = function() {
    const provider = new FacebookAuthProvider();
    signInWithPopup(auth, provider)
      .then(result => {
        const user = result.user;
        return set(ref(db, `users/${user.uid}`), {
          email: user.email,
          username: user.displayName || "Anónimo",
          createdAt: Date.now(),
          role: "user"
        });
      })
      .then(() => {
        alert(`¡Bienvenido con Facebook!`);
        cerrarLogin();
      })
      .catch(error => {
        if (error.code !== "auth/popup-closed-by-user") {
          alert("Error con Facebook: " + (error.message || "Intenta de nuevo"));
        }
      });
  };

  // -----------------------------
  // Logout
  // -----------------------------
  window.logout = function() {
    signOut(auth).then(() => {
      alert("Sesión cerrada.");
      const loginBtn = document.getElementById("login-btn");
      const logoutBtn = document.getElementById("logout-btn");
      if (loginBtn) loginBtn.style.display = "block";
      if (logoutBtn) logoutBtn.style.display = "none";
    });
  };

  // -----------------------------
  // Header Auth Button
  // -----------------------------
  window.initAuthButtons = function() {
    const authBtn = document.getElementById("auth-btn");
    const userMenu = document.getElementById("user-menu");
    const logoutBtn = document.getElementById("logout-btn");

    if (!authBtn || !userMenu || !logoutBtn) {
      setTimeout(window.initAuthButtons, 500);
      return;
    }

    onAuthStateChanged(auth, (user) => {
      if (user) {
        const nombre = user.displayName || user.email.split("@")[0];
        authBtn.innerHTML = `${nombre} <span class="arrow">▼</span>`;
        authBtn.classList.add("logged-in");
      } else {
        authBtn.innerHTML = `<span id="auth-line1">Iniciar</span><span id="auth-line2">sesión</span>`;
        authBtn.classList.remove("logged-in");
      }
      userMenu.classList.add("hidden");
    });

    authBtn.addEventListener("click", (e) => {
      if (auth.currentUser) {
        userMenu.classList.toggle("hidden");
        e.stopPropagation();
      } else {
        abrirLogin();
      }
    });

    document.addEventListener("click", (e) => {
      if (!authBtn.contains(e.target) && !userMenu.contains(e.target)) {
        userMenu.classList.add("hidden");
      }
    });

    logoutBtn.addEventListener("click", () => {
      window.logout();
      userMenu.classList.add("hidden");
    });
  };

  // Iniciar botón de auth
  window.initAuthButtons();
}