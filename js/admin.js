// js/admin.js
import { auth, db, ref, get } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const userList = document.getElementById("userList");
  const saveBtn = document.getElementById("saveRoles");

  // 🔒 Verificar que el usuario actual sea admin
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("Debes iniciar sesión como administrador.");
      window.location.href = "index.html";
      return;
    }

    // Obtener info de su perfil
    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);
    const userData = snapshot.exists() ? snapshot.val() : {};

    if (userData.role !== "admin") {
      alert("Acceso restringido. Solo administradores pueden entrar aquí.");
      window.location.href = "index.html";
      return;
    }

    // Si es admin → mostrar panel
    initAdminPanel();
  });

  async function initAdminPanel() {
    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) {
      userList.innerHTML = "<p>No hay usuarios registrados.</p>";
      return;
    }

    const users = snapshot.val();
    const roles = loadRoles(); // Cargar roles locales desde roleManager.js / localStorage

    userList.innerHTML = "";

    Object.entries(users).forEach(([uid, info]) => {
      const currentRole = roles[uid] || { premium: false, admin: false };

      const div = document.createElement("div");
      div.className = "user-item";
      div.innerHTML = `
        <div class="user-info">
          <strong>${info.username || "Sin nombre"}</strong><br>
          <small>${info.email}</small>
        </div>
        <div class="user-roles">
          <label>
            <input type="checkbox" class="chk-premium" data-uid="${uid}" ${currentRole.premium ? "checked" : ""}>
            Premium
          </label>
          <label>
            <input type="checkbox" class="chk-admin" data-uid="${uid}" ${currentRole.admin ? "checked" : ""}>
            Admin
          </label>
        </div>
      `;
      userList.appendChild(div);
    });
  }

  // 💾 Guardar cambios manualmente
  saveBtn.addEventListener("click", () => {
    const premiumBoxes = document.querySelectorAll(".chk-premium");
    const adminBoxes = document.querySelectorAll(".chk-admin");

    const newRoles = {};

    premiumBoxes.forEach((chk) => {
      const uid = chk.dataset.uid;
      if (!newRoles[uid]) newRoles[uid] = {};
      newRoles[uid].premium = chk.checked;
    });

    adminBoxes.forEach((chk) => {
      const uid = chk.dataset.uid;
      if (!newRoles[uid]) newRoles[uid] = {};
      newRoles[uid].admin = chk.checked;
    });

    // Guardar localmente
    localStorage.setItem("roleManagerData", JSON.stringify(newRoles));

    alert("✅ Roles actualizados correctamente (guardados en el navegador).");
  });

  // 📦 Función para leer roles desde localStorage
  function loadRoles() {
    try {
      return JSON.parse(localStorage.getItem("roleManagerData")) || {};
    } catch {
      return {};
    }
  }
});
