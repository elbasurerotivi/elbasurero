import { auth, db, ref, set, get, update } from "./firebase-config.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
  provider.setCustomParameters({ prompt: 'select_account' });

  signInWithPopup(auth, provider)
    .then(async (result) => {
      const user = result.user;
      const userRef = ref(db, `users/${user.uid}`);

      try {

        const snapshot = await get(userRef);

        // SOLO crear si no existe
        if (!snapshot.exists()) {

          await set(userRef, {
            email: user.email,
            username: user.displayName || user.email.split("@")[0],
            role: "user",
            createdAt: Date.now()
          });

          console.log("Usuario creado en DB");
        } else {
          console.log("Usuario ya existe, no se sobrescribe");
        }

        alert(`Bienvenido, ${user.displayName || user.email}!`);
        cerrarLogin();

      } catch (error) {
        console.error("Error al guardar usuario:", error);
        alert("Error al guardar tus datos.");
      }
    })
    .catch(error => {
      console.error("Error de autenticación:", error);
      alert(error.message);
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
      const loginBtn = document.getElementById("login-btn");
      const logoutBtn = document.getElementById("logout-btn");
      if (loginBtn) {
        loginBtn.style.display = "block";
        console.log("login-btn mostrado");
      }
      if (logoutBtn) {
        logoutBtn.style.display = "none";
        console.log("logout-btn ocultado");
      }
    })
    .catch(error => {
      console.error("Error al cerrar sesión:", error);
      alert(`Error al cerrar sesión: ${error.message}`);
    });
};

// -----------------------------
// 🔹 Inicializar botón de autenticación en header con submenú
// -----------------------------
window.initAuthButtons = function() {
  const authBtn = document.getElementById("auth-btn");
  const userMenu = document.getElementById("user-menu");
  const logoutBtn = document.getElementById("logout-btn");
  const line1 = document.getElementById("auth-line1");
  const line2 = document.getElementById("auth-line2");

  if (!authBtn || !userMenu || !logoutBtn || !line1 || !line2) {
    console.warn("⏳ Esperando a que se cargue el header...");
    setTimeout(window.initAuthButtons, 500);
    return;
  }

  // Escuchar cambios de autenticación
  onAuthStateChanged(auth, (user) => {
    console.log("🔄 Estado de autenticación cambiado:", user ? user.email : "No hay usuario");

    if (user) {
      // Mostrar solo el nombre del usuario
      const nombre = user.displayName || user.email.split("@")[0];
      authBtn.innerHTML = `${nombre} <span class="arrow">▼</span>`;
      authBtn.classList.add("logged-in");
      userMenu.classList.add("hidden");
    } else {
      // Mostrar "Iniciar sesión"
      authBtn.innerHTML = `
        <span id="auth-line1">Iniciar</span>
        <span id="auth-line2">sesión</span>
      `;
      authBtn.classList.remove("logged-in");
      userMenu.classList.add("hidden");
    }
  });

  // 🔹 Alternar el submenú al hacer clic
  authBtn.addEventListener("click", (e) => {
    const user = auth.currentUser;
    if (user) {
      userMenu.classList.toggle("hidden");
      e.stopPropagation();
    } else {
      window.abrirLogin();
    }
  });

  // 🔹 Cerrar el submenú si se hace clic fuera
  document.addEventListener("click", (e) => {
    if (!authBtn.contains(e.target) && !userMenu.contains(e.target)) {
      userMenu.classList.add("hidden");
    }
  });

  // 🔹 Botón "Salir"
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    userMenu.classList.add("hidden");
    console.log("👋 Sesión cerrada");
  });

  console.log("✅ initAuthButtons inicializado correctamente");
};


// -----------------------------
// CREAR USUARIO PREMIUM (SOLO ADMIN)
// -----------------------------
window.createPremiumUser = async function(email, password, username) {
  if (!confirm(`¿Crear usuario PREMIUM?\nEmail: ${email}\nUsuario: ${username}`)) return;

  try {
    // 1. Crear en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Guardar en Realtime Database con role: "premium"
    const userRef = ref(db, `users/${user.uid}`);
    await set(userRef, {
      email: user.email,
      username: username,
      role: "premium",
      createdAt: Date.now()
    });

    alert(`Usuario premium creado:\n${email}\nContraseña: ${password}\n\n¡Ya puede iniciar sesión!`);
    console.log("Usuario premium creado:", user.uid);

  } catch (error) {
    console.error("Error creando usuario premium:", error);
    let msg = "Error desconocido.";
    if (error.code === "auth/email-already-in-use") msg = "El correo ya está registrado.";
    if (error.code === "auth/weak-password") msg = "Contraseña demasiado débil.";
    alert("Error: " + msg);
  }
};