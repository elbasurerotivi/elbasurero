// js/admin.js
import { db, ref, get } from "./firebase-config.js";
import { getUserRole, roles } from "./roleManager.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("adminLoginForm");
  const loginError = document.getElementById("loginError");
  const loginContainer = document.getElementById("loginForm");
  const adminPanel = document.getElementById("adminPanel");
  const userList = document.getElementById("userList");
  const saveBtn = document.getElementById("saveRoles");
  const downloadLink = document.getElementById("downloadLink");
  const searchInput = document.getElementById("userSearch");

  // Mostrar body y formulario inicialmente
  document.body.style.display = "block";

  // Manejar submit del formulario (verificar email en roleManager.js)
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim().toLowerCase(); // Normalizar email

    const role = getUserRole(email);

    if (role === "admin") {
      loginError.style.display = "none";
      loginContainer.style.display = "none";
      adminPanel.style.display = "block";
      initAdminPanel();
    } else {
      loginError.textContent = "Acceso denegado: Este email no tiene rol de administrador en roleManager.js.";
      loginError.style.display = "block";
    }
  });

  async function initAdminPanel() {
    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef).catch((error) => {
      console.error("Error cargando usuarios:", error);
      userList.innerHTML = "<p>Error cargando usuarios. Verifica las reglas de Firebase para lectura pública en /users.</p>";
      return null;
    });

    if (!snapshot || !snapshot.exists()) {
      userList.innerHTML = "<p>No hay usuarios registrados.</p>";
      return;
    }

    const users = snapshot.val();
    const userItems = []; // Array para almacenar elementos DOM

    Object.entries(users).forEach(([uid, info]) => {
      // Inicializar roles de roleManager.js (ignora Firebase)
      const currentRole = roles[info.email] || { premium: false, admin: false };
      const hasRole = currentRole.premium || currentRole.admin; // Para ordenar al top

      const div = document.createElement("div");
      div.className = `user-item ${hasRole ? 'has-role' : ''}`; // Clase CSS opcional para resaltar
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
      userItems.push({ element: div, hasRole, username: (info.username || "").toLowerCase(), email: info.email.toLowerCase() });
    });

    // Ordenar: Primero los con roles (hasRole true), luego sin roles. Dentro de cada grupo, orden original
    userItems.sort((a, b) => {
      if (a.hasRole && !b.hasRole) return -1; // a al top
      if (!a.hasRole && b.hasRole) return 1; // b al top
      return 0; // Mantener orden original
    });

    // Función para renderizar la lista (usada para inicial y filtro)
    function renderUserList(items) {
      userList.innerHTML = "";
      if (items.length === 0) {
        userList.innerHTML = "<p>No se encontraron usuarios.</p>";
        return;
      }
      items.forEach(item => userList.appendChild(item.element));
    }

    // Renderizar lista inicial (ordenada)
    renderUserList(userItems);

    // Event listener para el buscador (filtrar en tiempo real)
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (query === "") {
        renderUserList(userItems); // Mostrar todos (ordenados)
        return;
      }
      const filtered = userItems.filter(item =>
        item.username.includes(query) || item.email.includes(query)
      );
      renderUserList(filtered);
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