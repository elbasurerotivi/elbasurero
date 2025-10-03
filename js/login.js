import { auth, db, ref, set } from "./firebase-config.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let isLogin = true;

// Abrir/Cerrar popup
window.abrirLogin = function() {
  document.getElementById("loginModal").style.display = "flex";
};

window.cerrarLogin = function() {
  document.getElementById("loginModal").style.display = "none";
};

// Cambiar entre login y registro
window.toggleForm = function() {
  isLogin = !isLogin;
  document.getElementById("form-title").innerText = isLogin ? "Iniciar Sesión" : "Registrarse";
  document.getElementById("actionBtn").innerText = isLogin ? "Login" : "Registrarse";
  document.querySelector(".switch").innerText = isLogin 
    ? "¿No tienes cuenta? Regístrate aquí" 
    : "¿Ya tienes cuenta? Inicia sesión aquí";
  const usernameGroup = document.getElementById("username-group");
  usernameGroup.style.display = isLogin ? "none" : "block";
};

// Acción protegida (wrapper)
window.accionProtegida = function(callback) {
  if (auth.currentUser) {
    callback();
  } else {
    abrirLogin();
  }
};

// Acción principal (login o registro con email/pass)
document.getElementById("actionBtn")?.addEventListener("click", () => {
  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("password").value.trim();
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
    signInWithEmailAndPassword(auth, email, pass)
      .then(userCredential => {
        console.log("Inicio de sesión exitoso:", userCredential.user.email);
        alert(`Bienvenido, ${userCredential.user.email}!`);
        cerrarLogin();
      })
      .catch(error => {
        console.error("Error al iniciar sesión:", error);
        alert(`Error al iniciar sesión: ${error.message}`);
      });
  } else {
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

// Login con Google
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

// Login con Facebook
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

// Estado de sesión
onAuthStateChanged(auth, user => {
  if (user) {
    console.log("Usuario conectado:", user.email, "UID:", user.uid);
  } else {
    console.log("No hay usuario conectado");
  }
});


  //logout//

  // js/login.js (añade al final del archivo)

// Función de logout
window.logout = function() {
  signOut(auth)
    .then(() => {
      alert("Sesión cerrada exitosamente.");
      document.getElementById("logout-container").style.display = "none";
    })
    .catch(error => {
      console.error("Error al cerrar sesión:", error);
      alert(`Error al cerrar sesión: ${error.message}`);
    });
};

// Mostrar/ocultar botón de logout basado en el estado de sesión
onAuthStateChanged(auth, user => {
  if (user) {
    console.log("Usuario conectado:", user.email, "UID:", user.uid);
    const logoutContainer = document.getElementById("logout-container");
    if (logoutContainer) logoutContainer.style.display = "block";
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) logoutBtn.addEventListener("click", logout);
  } else {
    console.log("No hay usuario conectado");
    const logoutContainer = document.getElementById("logout-container");
    if (logoutContainer) logoutContainer.style.display = "none";
  }
});