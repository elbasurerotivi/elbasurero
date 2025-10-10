import { protectPage, loadRoles, saveRoles } from "./authManager.js";
import { db, ref, get } from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", async () => {
  const userList = document.getElementById("userList");
  const saveBtn = document.getElementById("saveRoles");

  // Verify admin access
  const isAuthorized = await protectPage(["admin"], "index.html");
  if (!isAuthorized) return;

  // Initialize admin panel
  async function initAdminPanel() {
    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) {
      userList.innerHTML = "<p>No hay usuarios registrados.</p>";
      return;
    }

    const users = snapshot.val();
    const roles = loadRoles();

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

  // Save role changes
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

    saveRoles(newRoles);
    alert("✅ Roles actualizados correctamente (guardados en el navegador).");
  });

  // Initialize the panel
  await initAdminPanel();
});