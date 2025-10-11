import { auth, db, ref, get } from "./firebase-config.js";
import { onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("adminLoginForm");
  const loginError = document.getElementById("loginError");
  const loginContainer = document.getElementById("loginForm");
  const adminPanel = document.getElementById("adminPanel");
  const userList = document.getElementById("userList");
  const saveBtn = document.getElementById("saveRoles");
  const downloadLink = document.getElementById("downloadLink");

  // Manejar estado de autenticación
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // No logueado: mostrar formulario de login
      loginContainer.style.display = "block";
      adminPanel.style.display = "none";
      document.body.style.display = "block";
      return;
    }

    // Obtener info del usuario desde Firebase
    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef).catch(() => null);
    const userData = snapshot?.exists() ? snapshot.val() : {};

    if (userData.role !== "admin") {
      alert("Acceso restringido. Solo administradores pueden entrar aquí.");
      window.location.href = "index.html";
      return;
    }

    // Es admin: ocultar login y mostrar panel
    loginContainer.style.display = "none";
    adminPanel.style.display = "block";
    document.body.style.display = "block";
    initAdminPanel();
  });

  // Manejar submit del formulario de login
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      loginError.style.display = "none";
      // onAuthStateChanged manejará el cambio de estado
    } catch (error) {
      loginError.textContent = "Error al iniciar sesión: " + (error.message || "Credenciales inválidas");
      loginError.style.display = "block";
    }
  });

  async function initAdminPanel() {
    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef).catch(() => null);

    if (!snapshot?.exists()) {
      userList.innerHTML = "<p>No hay usuarios registrados.</p>";
      return;
    }

    const users = snapshot.val();
    userList.innerHTML = "";

    Object.entries(users).forEach(([uid, info]) => {
      const currentRole = info.role ? { 
        premium: info.role === "premium" || info.role === "admin", 
        admin: info.role === "admin" 
      } : { premium: false, admin: false };

      const div = document.createElement("div");
      div.className = "user-item";
      div.innerHTML = `
        <div class="user-info">
          <strong>${info.username || "Sin nombre"}</strong><br>
          <small>${info.email}</small>
        </div>
        <div class="user-roles">
          <label>
            <input type="checkbox" class="chk-premium" data-email="${info.email}" ${currentRole.premium ? "checked" : ""}>
            Premium
          </label>
          <label>
            <input type="checkbox" class="chk-admin" data-email="${info.email}" ${currentRole.admin ? "checked" : ""}>
            Admin
          </label>
        </div>
      `;
      userList.appendChild(div);
    });
  }

  // Guardar cambios y generar archivo roleManager.js
  saveBtn.addEventListener("click", () => {
    const premiumBoxes = document.querySelectorAll(".chk-premium");
    const adminBoxes = document.querySelectorAll(".chk-admin");

    const newRoles = {};

    premiumBoxes.forEach((chk) => {
      const email = chk.dataset.email;
      if (!newRoles[email]) newRoles[email] = {};
      newRoles[email].premium = chk.checked;
    });

    adminBoxes.forEach((chk) => {
      const email = chk.dataset.email;
      if (!newRoles[email]) newRoles[email] = {};
      newRoles[email].admin = chk.checked;
    });

    // Generar el contenido de roleManager.js
    const rolesString = JSON.stringify(newRoles, null, 2);
    const fileContent = `// js/roleManager.js
// Este archivo se modifica automáticamente desde admin.html

export const roles = ${rolesString};

// Función para obtener rol como string
export function getUserRole(email) {
  const role = roles[email] || { premium: false, admin: false };
  if (role.admin) return "admin";
  if (role.premium) return "premium";
  return "user";
}

// Verifica si puede entrar a páginas premium
export function canAccessPremium(email) {
  const role = getUserRole(email);
  return role === "premium" || role === "admin";
}

// Verifica si es admin
export function isAdmin(email) {
  const role = getUserRole(email);
  return role === "admin";
}

// Protección de páginas
export function protectPage(allowedRoles = ["admin"], redirectUrl = "index.html") {
  import("./firebase-config.js").then(({ auth }) => {
    import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js").then(({ onAuthStateChanged }) => {
      onAuthStateChanged(auth, (user) => {
        if (!user) {
          alert("Debes iniciar sesión para acceder a esta página.");
          window.location.href = redirectUrl;
          return;
        }

        const role = getUserRole(user.email);
        if (!allowedRoles.includes(role)) {
          alert("Acceso restringido. No tienes permiso para ver esta página.");
          window.location.href = redirectUrl;
        } else {
          document.body.style.display = "block";
        }
      });
    });
  });
}
`;

    // Crear blob y activar descarga
    const blob = new Blob([fileContent], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.style.display = "block";
    downloadLink.click();
    URL.revokeObjectURL(url);
    alert("✅ Roles actualizados. Descargando roleManager.js actualizado...");
  });
});