// js/admin.js
import { db, ref, get, update, onValue } from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", () => {
  const emailForm = document.getElementById("adminEmailForm");
  const loginError = document.getElementById("loginError");
  const loginContainer = document.getElementById("loginForm");
  const adminPanel = document.getElementById("adminPanel");
  const userList = document.getElementById("userList");
  const searchInput = document.getElementById("userSearch");
  const logoutBtn = document.getElementById("logoutBtn");

  let userItems = [];
  let currentAdminEmail = "";

  // === VERIFICAR EMAIL ===
  emailForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim().toLowerCase();

    loginError.style.display = "none";

    try {
      // Buscar usuario por email
      const usersRef = ref(db, "users");
      const snapshot = await get(usersRef);

      if (!snapshot.exists()) {
        throw new Error("No hay usuarios registrados.");
      }

      const users = snapshot.val();
      const userEntry = Object.values(users).find(u => u.email.toLowerCase() === email);

      if (!userEntry || userEntry.role !== "admin") {
        throw new Error("Acceso denegado: Este email no es administrador.");
      }

      // ÉXITO: Es admin
      currentAdminEmail = email;
      loginContainer.style.display = "none";
      adminPanel.style.display = "block";
      await initAdminPanel();

    } catch (error) {
      console.error("Error:", error);
      loginError.textContent = error.message;
      loginError.style.display = "block";
    }
  });

  // === CERRAR SESIÓN ===
  logoutBtn.addEventListener("click", () => {
    adminPanel.style.display = "none";
    loginContainer.style.display = "block";
    document.getElementById("email").value = "";
    userItems = [];
  });

  // === CARGAR LISTA DE USUARIOS ===

  async function initAdminPanel() {
    userList.innerHTML = "<p>Cargando usuarios...</p>";

    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) {
      userList.innerHTML = "<p>No hay usuarios registrados.</p>";
      return;
    }

    const users = snapshot.val();
    userItems = [];

    Object.entries(users).forEach(([uid, info]) => {
      const role = info.role || "user";
      const isPremium = role === "premium";
      const isAdmin = role === "admin";

      const div = document.createElement("div");
      div.className = "user-item";
      div.style = "padding: 12px; margin: 8px 0; border: 1px solid #eee; border-radius: 8px; background: #f8f9fa;";

      div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>${info.username || "Sin nombre"}</strong><br>
            <small style="color: #666;">${info.email}</small>
          </div>
          <div>
            <label style="margin-right: 15px;">
              <input type="checkbox" class="chk-premium" data-uid="${uid}" ${isPremium ? "checked" : ""}>
              Premium
            </label>
            <label>
              <input type="checkbox" class="chk-admin" data-uid="${uid}" ${isAdmin ? "checked" : ""}>
              Admin
            </label>
          </div>
        </div>
      `;

      const premiumChk = div.querySelector(".chk-premium");
      const adminChk = div.querySelector(".chk-admin");

      const saveRole = async (newRole) => {
        try {
          await update(ref(db), { [`users/${uid}/role`]: newRole });
          console.log(`Rol actualizado: ${info.email} → ${newRole}`);
        } catch (err) {
          alert("Error al guardar: " + err.message);
          // Revertir checkbox
          if (newRole === "premium") premiumChk.checked = false;
          if (newRole === "admin") adminChk.checked = false;
        }
      };

      premiumChk.addEventListener("change", () => {
        let role = "user";
        if (adminChk.checked) role = "admin";
        else if (premiumChk.checked) role = "premium";
        saveRole(role);
      });

      adminChk.addEventListener("change", () => {
        let role = "user";
        if (adminChk.checked) role = "admin";
        else if (premiumChk.checked) role = "premium";
        saveRole(role);
      });

      userItems.push({
        element: div,
        hasRole: isPremium || isAdmin,
        username: (info.username || "").toLowerCase(),
        email: info.email.toLowerCase()
      });
    });

    // Ordenar: premium/admin arriba
    userItems.sort((a, b) => (a.hasRole && !b.hasRole ? -1 : (!a.hasRole && b.hasRole ? 1 : 0)));
    renderUserList(userItems);

    // Buscador
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
});