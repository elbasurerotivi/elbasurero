// js/admin.js
import { db, ref, get, update, onAuthStateChanged } from "./firebase-config.js";
import { getUserRole, initRolesSync, protectPage } from "./roleManager.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("adminLoginForm");
  const loginError = document.getElementById("loginError");
  const loginContainer = document.getElementById("loginForm");
  const adminPanel = document.getElementById("adminPanel");
  const userList = document.getElementById("userList");
  const searchInput = document.getElementById("userSearch");

  // Usar protectPage para verificar admin automáticamente (reemplaza el form manual)
  protectPage(["admin"], "index.html", () => {
    // Callback al éxito: Inicializar panel
    loginContainer.style.display = "none";
    adminPanel.style.display = "block";
    initRolesSync(true);  // Sync roles en tiempo real
    window.refreshAdminUI = () => initAdminPanel();  // Hook para refrescar UI
    initAdminPanel();
  });

  // Si quieres mantener el form simple (opcional, pero protectPage lo hace mejor)
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const role = getUserRole(email);
    if (role === "admin") {
      loginError.style.display = "none";
      loginContainer.style.display = "none";
      adminPanel.style.display = "block";
      initRolesSync(true);
      initAdminPanel();
    } else {
      loginError.textContent = "Acceso denegado.";
      loginError.style.display = "block";
    }
  });

  let userItems = [];  // Cache para filtrado rápido

  async function initAdminPanel() {
    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef).catch((error) => {
      console.error("Error:", error);
      userList.innerHTML = "<p>Error cargando usuarios.</p>";
      return null;
    });

    if (!snapshot || !snapshot.exists()) {
      userList.innerHTML = "<p>No hay usuarios.</p>";
      return;
    }

    const users = snapshot.val();
    userItems = [];

    Object.entries(users).forEach(([uid, info]) => {
      const role = info.role || "user";
      const isPremium = role === "premium";
      const isAdmin = role === "admin";

      const div = document.createElement("div");
      div.className = `user-item ${isPremium || isAdmin ? 'has-role' : ''}`;
      div.innerHTML = `
        <div class="user-info">
          <strong>${info.username || "Sin nombre"}</strong><br>
          <small>${info.email}</small>
        </div>
        <div class="user-roles">
          <label>Premium: <input type="checkbox" class="chk-premium" data-uid="${uid}" ${isPremium ? "checked" : ""}></label>
          <label>Admin: <input type="checkbox" class="chk-admin" data-uid="${uid}" ${isAdmin ? "checked" : ""}></label>
        </div>
      `;

      // Event listeners para checkboxes (guardado inmediato)
      const premiumChk = div.querySelector(".chk-premium");
      const adminChk = div.querySelector(".chk-admin");

      function saveRole(uid, newRole) {
        const updates = {};
        updates[`users/${uid}/role`] = newRole;
        update(ref(db), updates).then(() => {
          console.log(`Rol actualizado para ${info.email}: ${newRole}`);
          // No necesitas refrescar manual: el listener de roleManager lo hace
        }).catch((error) => {
          console.error("Error guardando:", error);
          alert("Error: Verifica que estés logueado como admin.");
          // Revertir checkbox si falla
          if (newRole === "premium") premiumChk.checked = !premiumChk.checked;
          else adminChk.checked = !adminChk.checked;
        });
      }

      premiumChk.addEventListener("change", () => {
        let newRole = "user";
        if (adminChk.checked) newRole = "admin";
        else if (premiumChk.checked) newRole = "premium";
        saveRole(uid, newRole);
      });

      adminChk.addEventListener("change", () => {
        let newRole = "user";
        if (adminChk.checked) newRole = "admin";
        else if (premiumChk.checked) newRole = "premium";
        saveRole(uid, newRole);
      });

      userItems.push({
        element: div,
        hasRole: isPremium || isAdmin,
        username: (info.username || "").toLowerCase(),
        email: info.email.toLowerCase(),
        uid
      });
    });

    // Ordenar y renderizar
    userItems.sort((a, b) => (a.hasRole && !b.hasRole ? -1 : (!a.hasRole && b.hasRole ? 1 : 0)));
    renderUserList(userItems);

    // Buscador (sin cambios)
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();
      const filtered = query === "" ? userItems : userItems.filter(i => 
        i.username.includes(query) || i.email.includes(query)
      );
      renderUserList(filtered);
    });
  }

  function renderUserList(items) {
    userList.innerHTML = "";
    if (items.length === 0) {
      userList.innerHTML = "<p>No se encontraron usuarios.</p>";
      return;
    }
    items.forEach(item => userList.appendChild(item.element));
  }

  // Cleanup al unload
  window.addEventListener("beforeunload", () => {
    import("./roleManager.js").then(({ cleanupRolesSync }) => cleanupRolesSync());
  });
});