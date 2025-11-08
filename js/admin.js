// js/admin.js
import { auth, db, ref, get, update } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const adminPanel = document.getElementById("adminPanel");
  const userList = document.getElementById("userList");
  const searchInput = document.getElementById("userSearch");
  const logoutBtn = document.getElementById("logoutBtn");

  let userItems = [];

  // === VERIFICAR AUTENTICACIÓN Y ROL ADMIN ===
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("Debes iniciar sesión para acceder al panel de administración.");
      window.location.href = "index.html";
      return;
    }

    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef).catch(err => {
      console.error("Error leyendo rol:", err);
      alert("Error de conexión. Intenta de nuevo.");
      window.location.href = "index.html";
    });

    if (!snapshot.exists() || snapshot.val().role !== "admin") {
      alert("Acceso denegado: No eres administrador.");
      window.location.href = "index.html";
      return;
    }

    // ÉXITO: Es admin
    document.body.style.display = "block";
    await initAdminPanel();
  });

  // === CERRAR SESIÓN ===
  logoutBtn.addEventListener("click", () => {
    import("./login.js").then(module => module.logout());
  });

  // === CARGAR USUARIOS ===
  async function initAdminPanel() {
    userList.innerHTML = "<p>Cargando usuarios...</p>";

    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef).catch(err => {
      userList.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
      return null;
    });

    if (!snapshot || !snapshot.exists()) {
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
      div.style = "padding: 12px; margin: 8px 0; border: 1px solid #eee; border-radius: 8px; background: #f8f9fa; display: flex; justify-content: space-between; align-items: center;";

      div.innerHTML = `
        <div>
          <strong>${info.username || "Sin nombre"}</strong><br>
          <small style="color: #666;">${info.email}</small>
        </div>
        <div>
          <label style="margin-right: 15px; font-weight: bold;">
            <input type="checkbox" class="chk-premium" data-uid="${uid}" ${isPremium ? "checked" : ""}>
            Premium
          </label>
          <label style="font-weight: bold;">
            <input type="checkbox" class="chk-admin" data-uid="${uid}" ${isAdmin ? "checked" : ""}>
            Admin
          </label>
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