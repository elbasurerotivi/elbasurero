// js/admin.js
import { auth, db, ref, set, get, remove, onValue, update } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ⚙️ Si querés asignarte el rol una vez, hacelo temporalmente así (y luego comentá esta línea):
 update(ref(db, "users/r7CibZaQPxUTuToote8gcEVvHL32"), { role: "premium" });

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
  alert("Acceso restringido. Solo administradores pueden ver este contenido.");
  window.location.href = "index.html";
  return;
}

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
          <span>${info.username || info.email}</span>
          <span class="role ${info.role || 'user'}">${info.role || 'user'}</span>
          <button data-uid="${uid}" class="delete-btn">❌</button>
        `;
        userList.appendChild(div);
      });

      // Botones de eliminar
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

      // Buscar usuario por email (temporal, sin Admin SDK)
      const usersRef = ref(db, "users");
      const snapshot = await get(usersRef);
      let foundUid = null;

      if (snapshot.exists()) {
        const users = snapshot.val();
        for (const [uid, info] of Object.entries(users)) {
          if (info.email === email) {
            foundUid = uid;
            break;
          }
        }
      }

      if (foundUid) {
        await update(ref(db, `users/${foundUid}`), { role });
        alert(`Rol actualizado para ${email} → ${role}`);
      } else {
        alert("No se encontró un usuario con ese email.");
      }

      emailInput.value = "";
      roleSelect.value = "user";
    });
  }
});
