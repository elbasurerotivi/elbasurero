import { auth, db, ref, set, get } from "./firebase-config.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let isLogin = true;

// -----------------------------
// 🔹 ABRIR / CERRAR MODAL
// -----------------------------
window.abrirLogin = () => {
  document.getElementById("loginModal").style.display = "flex";
};

window.cerrarLogin = () => {
  document.getElementById("loginModal").style.display = "none";
};

// -----------------------------
// 🔹 TOGGLE LOGIN / REGISTER
// -----------------------------
window.toggleForm = () => {
  isLogin = !isLogin;

  document.getElementById("form-title").innerText = isLogin ? "Iniciar Sesión" : "Registrarse";
  document.getElementById("actionBtn").innerText = isLogin ? "Login" : "Registrarse";
  document.getElementById("username-group").style.display = isLogin ? "none" : "block";
};

// -----------------------------
// 🔹 LOGIN / REGISTRO
// -----------------------------
document.addEventListener("click", async (e) => {
  if (e.target.id !== "actionBtn") return;

  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("password").value.trim();
  const username = document.getElementById("username")?.value.trim();

  if (!email || !pass) return alert("Completa los campos");

  try {
    if (isLogin) {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      alert("Bienvenido " + userCredential.user.email);
    } else {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;

      await set(ref(db, `users/${user.uid}`), {
        email: user.email,
        username: username || "Usuario",
        createdAt: Date.now()
      });

      alert("Usuario registrado");
    }

    cerrarLogin();

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
});

// -----------------------------
// 🔹 GOOGLE LOGIN
// -----------------------------
window.loginGoogle = () => {
  const provider = new GoogleAuthProvider();
  signInWithRedirect(auth, provider);
};

// -----------------------------
// 🔹 FACEBOOK LOGIN
// -----------------------------
window.loginFacebook = () => {
  const provider = new FacebookAuthProvider();
  signInWithRedirect(auth, provider);
};

// -----------------------------
// 🔹 RESULTADO REDIRECT
// -----------------------------
getRedirectResult(auth)
  .then(async (result) => {
    if (!result) return;

    const user = result.user;
    const userRef = ref(db, `users/${user.uid}`);

    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      await set(userRef, {
        email: user.email,
        username: user.displayName || "Usuario",
        createdAt: Date.now()
      });
    }

    alert("Bienvenido " + (user.displayName || user.email));
  })
  .catch(console.error);

// -----------------------------
// 🔹 LOGOUT
// -----------------------------
window.logout = () => {
  signOut(auth);
};

// -----------------------------
// 🔹 INIT HEADER AUTH UI
// -----------------------------
window.initAuthButtons = function () {
  const authBtn = document.getElementById("auth-btn");
  const userMenu = document.getElementById("user-menu");
  const logoutBtn = document.getElementById("logout-btn");

  if (!authBtn || !userMenu || !logoutBtn) {
    setTimeout(window.initAuthButtons, 300);
    return;
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      const name = user.displayName || user.email.split("@")[0];
      authBtn.innerHTML = `${name} ▼`;
    } else {
      authBtn.innerHTML = "Iniciar sesión";
    }
  });

  authBtn.addEventListener("click", () => {
    if (auth.currentUser) {
      userMenu.classList.toggle("hidden");
    } else {
      abrirLogin();
    }
  });

  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    userMenu.classList.add("hidden");
  });

  console.log("✅ Auth UI lista");
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

getRedirectResult(auth)
  .then(async (result) => {
    if (!result) return;

    console.log("Resultado de redirect:", result);

    const user = result.user;
    const userRef = ref(db, `users/${user.uid}`);

    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      await set(userRef, {
        email: user.email,
        username: user.displayName || user.email.split("@")[0],
        role: "user",
        createdAt: Date.now()
      });

      console.log("Usuario creado en DB");
    } else {
      console.log("Usuario ya existía");
    }

    alert(`Bienvenido, ${user.displayName || user.email}!`);

  })
  .catch((error) => {
    console.error("Error después del redirect:", error);
  });