// js/admin.js
import { auth, db, ref, onValue } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { setUserRole, getUserRole, protectPage } from "./roleManager.js";

// Proteger el panel: solo admin puede acceder
protectPage(["admin"], "index.html");

document.addEventListener("DOMContentLoaded", () => {
  const userList = document.getElementById("userList");

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    const role = await getUserRole(user.uid);
    if (role !== "admin") {
      alert("Acceso restringido. Solo administradores.");
      window.location.href = "index.html";
      return;
    }

    // Cargar lista de usuarios
    const usersRef = ref(db, "users");
    onValue(usersRef, (snapshot) => {
      userList.innerHTML = "";
      if (!snapshot.exists()) {
        userList.innerHTML = "<p>No hay usuarios registrados.</p>";
        return;
      }

      const users = snapshot.val();
      Object.entries(users).forEach(([uid, info]) => {
        const row = document.createElement("div");
        row.classList.add("user-row");

        const username = info.username || info.email || "Sin nombre";
        const role = info.role || "user";

        row.innerHTML = `
          <div class="user-info">
            <span>${username}</span>
            <span class="email">${info.email}</span>
          </div>
          <div class="role-controls">
            <label><input type="checkbox" class="role-premium" ${role === "premium" ? "checked" : ""}> Premium</label>
            <label><input type="checkbox" class="role-admin" ${role === "admin" ? "checked" : ""}> Admin</label>
          </div>
        `;

        // Escuchar cambios de checkboxes
        const premiumCheck = row.querySelector(".role-premium");
        const adminCheck = row.querySelector(".role-admin");

        premiumCheck.addEventListener("change", async () => {
          if (premiumCheck.checked) {
            adminCheck.checked = false; // no ambos
            await setUserRole(uid, "premium");
          } else {
            await setUserRole(uid, "user");
          }
        });

        adminCheck.addEventListener("change", async () => {
          if (adminCheck.checked) {
            premiumCheck.checked = false;
            await setUserRole(uid, "admin");
          } else {
            await setUserRole(uid, "user");
          }
        });

        userList.appendChild(row);
      });
    });
  });
});
