// js/admin.js
import { auth, db, ref, onValue } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const roleManagerPath = "./roleManager.js";

document.addEventListener("DOMContentLoaded", () => {
  const userList = document.getElementById("userList");
  const saveBtn = document.getElementById("saveRoles");

  // Verificar que el usuario logueado sea admin
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      alert("Debes iniciar sesión.");
      window.location.href = "index.html";
      return;
    }

    import(roleManagerPath).then(({ roles }) => {
      const currentRole = roles[user.email];
      if (currentRole !== "admin") {
        alert("Acceso denegado. Solo administradores pueden usar este panel.");
        window.location.href = "index.html";
        return;
      }

      loadUsers(roles);
    });
  });

  // Cargar lista de usuarios desde Firebase
  function loadUsers(roles) {
    const usersRef = ref(db, "users");
    onValue(usersRef, (snapshot) => {
      userList.innerHTML = "";
      const data = snapshot.val() || {};

      Object.values(data).forEach((info) => {
        const email = info.email;
        const username = info.username;
        const role = roles[email] || "user";

        const div = document.createElement("div");
        div.className = "user-item";
        div.innerHTML = `
          <span class="username">${username}</span>
          <span class="email">${email}</span>
          <label><input type="checkbox" class="adminChk" ${role === "admin" ? "checked" : ""}> Admin</label>
          <label><input type="checkbox" class="premiumChk" ${role === "premium" ? "checked" : ""}> Premium</label>
        `;
        userList.appendChild(div);
      });
    });
  }

  // Guardar roles (reescribir roleManager.js)
  saveBtn.addEventListener("click", async () => {
    const newRoles = {};
    document.querySelectorAll(".user-item").forEach((div) => {
      const email = div.querySelector(".email").textContent;
      const isAdmin = div.querySelector(".adminChk").checked;
      const isPremium = div.querySelector(".premiumChk").checked;

      if (isAdmin) newRoles[email] = "admin";
      else if (isPremium) newRoles[email] = "premium";
    });

    const fileContent = `// js/roleManager.js\nexport const roles = ${JSON.stringify(newRoles, null, 2)};\n\n` +
      `export function getUserRole(email){return roles[email]||"user";}\n\n` +
      `export function protectPage(allowedRoles=["admin"],redirectUrl="index.html"){\n` +
      `import("./firebase-config.js").then(({auth})=>{\n` +
      `import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js").then(({onAuthStateChanged})=>{\n` +
      `onAuthStateChanged(auth,(user)=>{\n` +
      `if(!user){alert("Debes iniciar sesión para acceder a esta página.");window.location.href=redirectUrl;return;}\n` +
      `const role=getUserRole(user.email);\n` +
      `if(!allowedRoles.includes(role)){alert("Acceso restringido.");window.location.href=redirectUrl;}\n` +
      `else{document.body.style.display="block";}\n` +
      `});});});}`;
    
    const blob = new Blob([fileContent], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "roleManager.js";
    a.click();

    alert("Archivo roleManager.js actualizado. Descargá y reemplazalo en /js/");
  });
});
