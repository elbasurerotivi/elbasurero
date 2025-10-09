// js/admin.js
import { auth, db, ref, set, get, remove, onValue } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("emailInput");
  const roleSelect = document.getElementById("roleSelect");
  const assignBtn = document.getElementById("assignBtn");
  const userList = document.getElementById("userList");

  // 🔒 Verificar usuario actual
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("Debes iniciar sesión como administrador.");
      window.location.href = "index.html";
      return;
    }

    // Obtener su rol desde la base
    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);
    const data = snapshot.exists() ? snapshot.val() : {};

    if (data.role !== "admin") {
      alert("Acceso denegado. Solo los administradores pueden usar este panel.");
      window.location.href = "index.html";
      return;
    }

    // ✅ Si es admin, continuar
    initAdminPanel();
  });

  function initAdminPanel() {
    const usersRef = ref(db, "users");

    // Escuchar cambios en tiempo real
    onValue(usersRef, (snapshot) => {
      if (!snapshot.exists()) {
        userList.innerHTML = "<p>No hay usuarios registrados.</p>";
        return;
      }

      const data = snapshot.val();
      userList.innerHTML = "";

      Object.entries(data).forEach(([uid, info]) => {
        const div = document.createElement("div");
        div.className = "user-item";
        div.innerHTML = `
          <span>${info.email}</span>
          <span class="role ${info.role}">${info.role}</span>
          <button data-uid="${uid}" class="delete-btn">❌</button>
        `;
        userList.appendChild(div);
      });

      document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const uid = btn.dataset.uid;
          if (confirm("¿Eliminar este usuario del registro?")) {
            await remove(ref(db, `users/${uid}`));
          }
        });
      });
    });

    // Asignar rol manualmente
    assignBtn.addEventListener("click", async () => {
      const email = emailInput.value.trim();
      const role = roleSelect.value;

      if (!email) {
        alert("Ingresá un email válido.");
        return;
      }

      // Buscar usuario por email (en un caso real, usarías Firebase Auth admin SDK)
      // Aquí creamos un ID único local temporal
      const uid = email.replace(/[@.]/g, "_");

      await set(ref(db, `users/${uid}`), { email, role });
      emailInput.value = "";
      roleSelect.value = "user";
    });
  }
});
