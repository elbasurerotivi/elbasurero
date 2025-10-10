// js/admin.js
import { auth, db, ref, get, update, onValue } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("emailInput");
  const roleSelect = document.getElementById("roleSelect");
  const assignBtn = document.getElementById("assignBtn");
  const userList = document.getElementById("userList");

  // 🔒 Verificar si el usuario logueado es admin
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("Debes iniciar sesión para acceder a este panel.");
      window.location.href = "index.html";
      return;
    }

    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists() || snapshot.val().role !== "admin") {
      alert("Acceso restringido. Solo administradores pueden usar este panel.");
      window.location.href = "index.html";
      return;
    }

    // ✅ Usuario es admin → inicializar panel
    initAdminPanel();
  });

  function initAdminPanel() {
    const usersRef = ref(db, "users");

    // Mostrar lista de usuarios en tiempo real
    onValue(usersRef, (snapshot) => {
      userList.innerHTML = "";
      if (!snapshot.exists()) {
        userList.innerHTML = "<p>No hay usuarios registrados.</p>";
        return;
      }

      const users = snapshot.val();
      Object.entries(users).forEach(([uid, info]) => {
        const div = document.createElement("div");
        div.className = "user-item";
        div.innerHTML = `
          <span>${info.username || info.email}</span>
          <span class="role ${info.role || 'user'}">${info.role || 'user'}</span>
        `;
        userList.appendChild(div);
      });
    });

    // Cambiar rol manualmente
    assignBtn.addEventListener("click", async () => {
      const email = emailInput.value.trim().toLowerCase();
      const role = roleSelect.value;

      if (!email) {
        alert("Ingresá un email válido.");
        return;
      }

      // Buscar el UID por email
      const usersRef = ref(db, "users");
      const snapshot = await get(usersRef);
      let foundUid = null;

      if (snapshot.exists()) {
        const users = snapshot.val();
        for (const [uid, info] of Object.entries(users)) {
          if (info.email.toLowerCase() === email) {
            foundUid = uid;
            break;
          }
        }
      }

      if (!foundUid) {
        alert("No se encontró un usuario con ese email.");
        return;
      }

      await update(ref(db, `users/${foundUid}`), { role });
      alert(`Rol actualizado para ${email} → ${role}`);
      emailInput.value = "";
      roleSelect.value = "user";
    });
  }
});
