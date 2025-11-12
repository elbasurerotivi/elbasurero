// js/admin.js
import { auth, db, ref, get, update } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const userList = document.getElementById("userList");
  const searchInput = document.getElementById("userSearch");
  const logoutBtn = document.getElementById("logoutBtn");

  let userItems = [];

  // === VERIFICAR AUTENTICACIÓN ===
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("Debes iniciar sesión.");
      window.location.href = "index.html";
      return;
    }

    const snapshot = await get(ref(db, `users/${user.uid}`)).catch(() => null);
    if (!snapshot?.exists() || snapshot.val().role !== "admin") {
      alert("Acceso denegado.");
      window.location.href = "index.html";
      return;
    }

    document.body.classList.add("visible");
    await initAdminPanel();
  });

  // === CERRAR SESIÓN ===
  logoutBtn.addEventListener("click", () => {
    import("./login.js").then(m => m.logout());
  });

  // === CARGAR USUARIOS ===
  async function initAdminPanel() {
    // Exponer función global para crear usuarios premium
window.createPremiumUser = window.createPremiumUser || function() {
  alert("Función no disponible. Recarga la página.");
};
    userList.innerHTML = "<p style='text-align:center; color:#aaa;'><i class='fas fa-spinner fa-spin'></i> Cargando...</p>";

    const snapshot = await get(ref(db, "users")).catch(() => null);
    if (!snapshot?.exists()) {
      userList.innerHTML = "<p style='text-align:center; color:#aaa;'>No hay usuarios registrados.</p>";
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
      div.innerHTML = `
        <div class="user-info">
          <h3>${info.username || "Sin nombre"}</h3>
          <small>${info.email}</small>
        </div>
        <div class="role-controls">
          <label class="role-label premium">
            <input type="checkbox" class="role-checkbox chk-premium" data-uid="${uid}" ${isPremium ? "checked" : ""}>
            Premium
          </label>
          <label class="role-label admin">
            <input type="checkbox" class="role-checkbox chk-admin" data-uid="${uid}" ${isAdmin ? "checked" : ""}>
            Admin
          </label>
        </div>
        <div class="role-change"></div>
      `;

      const premiumChk = div.querySelector(".chk-premium");
      const adminChk = div.querySelector(".chk-admin");
      const flash = div.querySelector(".role-change");

      const saveRole = async (newRole) => {
        try {
          await update(ref(db), { [`users/${uid}/role`]: newRole });
          flash.classList.add("show");
          setTimeout(() => flash.classList.remove("show"), 600);
        } catch (err) {
          alert("Error: " + err.message);
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

    userItems.sort((a, b) => (a.hasRole && !b.hasRole ? -1 : (!a.hasRole && b.hasRole ? 1 : 0)));
    renderUserList(userItems);

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
      userList.innerHTML = "<p style='text-align:center; color:#aaa;'>No se encontraron usuarios.</p>";
      return;
    }
    items.forEach(item => userList.appendChild(item.element));
  }
});