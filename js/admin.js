// js/admin.js
import { auth, db, ref, get, update, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "./firebase-config.js";
import { initRolesSync, getUserRole } from "./roleManager.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("adminLoginForm");
  const loginError = document.getElementById("loginError");
  const loginContainer = document.getElementById("loginForm");
  const adminPanel = document.getElementById("adminPanel");
  const userList = document.getElementById("userList");
  const searchInput = document.getElementById("userSearch");
  const logoutBtn = document.getElementById("logoutBtn");

  let userItems = [];

  // === LOGIN ===
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    loginError.style.display = "none";
    loginError.textContent = "";

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Verificar rol en Firebase
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists() || snapshot.val().role !== "admin") {
        await signOut(auth);
        throw new Error("Acceso denegado: No eres administrador.");
      }

      // Login exitoso
      loginContainer.style.display = "none";
      adminPanel.style.display = "block";
      initRolesSync(true);
      await initAdminPanel();

    } catch (error) {
      console.error("Error de login:", error);
      loginError.textContent = error.message || "Credenciales incorrectas o error de red.";
      loginError.style.display = "block";
    }
  });

  // === CERRAR SESIÓN ===
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    adminPanel.style.display = "none";
    loginContainer.style.display = "block";
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
  });

  // === CARGAR USUARIOS ===
  async function initAdminPanel() {
    userList.innerHTML = "<p>Cargando usuarios...</p>";

    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef).catch((error) => {
      console.error("Error:", error);
      userList.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
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
      div.className = `user-item ${isPremium || isAdmin ? 'has-role' : ''}`;
      div.style = "padding: 10px; margin: 5px 0; border: 1px solid #eee; border-radius: 5px; background: #fff;";

      div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>${info.username || "Sin nombre"}</strong><br>
            <small>${info.email}</small>
          </div>
          <div>
            <label><input type="checkbox" class="chk-premium" data-uid="${uid}" ${isPremium ? "checked" : ""}> Premium</label>
            <label style="margin-left: 10px;"><input type="checkbox" class="chk-admin" data-uid="${uid}" ${isAdmin ? "checked" : ""}> Admin</label>
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
          // Revertir
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

  // Auto-login si ya está autenticado como admin
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const snapshot = await get(ref(db, `users/${user.uid}`));
      if (snapshot.exists() && snapshot.val().role === "admin") {
        loginContainer.style.display = "none";
        adminPanel.style.display = "block";
        initRolesSync(true);
        await initAdminPanel();
      }
    }
  });
});