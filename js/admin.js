// js/admin.js
import { auth, db, ref, get, update } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const adminPanel = document.getElementById("adminPanel");
  const userList = document.getElementById("userList");
  const searchInput = document.getElementById("userSearch");
  const logoutBtn = document.getElementById("logoutBtn");

  let userItems = [];

  // === VERIFICAR AUTENTICACIÓN Y ROL ===
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("Debes iniciar sesión para acceder al panel de administración.");
      window.location.href = "index.html"; // o página principal
      return;
    }

    // Verificar si es admin
    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists() || snapshot.val().role !== "admin") {
      alert("Acceso denegado: No tienes permisos de administrador.");
      window.location.href = "index.html";
      return;
    }

    // ÉXITO: Es admin
    document.body.style.display = "block";
    await initAdminPanel();
  });

  // === CERRAR SESIÓN ===
  logoutBtn.addEventListener("click", () => {
    import("./login.js").then(({ logout }) => logout());
  });

  // === CARGAR USUARIOS ===
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
        } catch (err) {
          alert("Error al guardar: " + err.message);
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
      userList.innerHTML = "<p>No se encontraron usuarios.</p>";
      return;
    }
    items.forEach(item => userList.appendChild(item.element));
  }
});