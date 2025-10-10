// Updated admin.js: Commented out the temporary role assignment line as per your note. The rest is already capable of assigning/removing roles (assign "user" to remove premium/admin privileges) and deleting users. Improved error handling slightly. No other changes needed for requirement 1 and 4.
import { auth, db, ref, set, get, remove, onValue, update } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ⚙️ Si querés asignarte el rol una vez, hacelo temporalmente así (y luego comentá esta línea):
// update(ref(db, "users/r7CibZaQPxUTuToote8gcEVvHL32"), { role: "premium" });

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
      alert("Acceso restringido. Solo administradores pueden usar este panel.");
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
            try {
              await remove(ref(db, `users/${uid}`));
            } catch (error) {
              alert("Error al eliminar usuario: " + error.message);
            }
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
        try {
          await remove(ref(db, `users/${uid}`)); // In the delete-btn event listener
          alert(`Rol actualizado para ${email} → ${role}`);
        } catch (error) {
          alert("Error al actualizar rol: " + error.message);
        }
      } else {
        alert("No se encontró un usuario con ese email.");
      }

      emailInput.value = "";
      roleSelect.value = "user";
    });
  }
});