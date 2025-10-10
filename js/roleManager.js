// js/roleManager.js
// Este archivo se modifica automáticamente desde admin.html

export const roles = {
  "charsvolta@gmail.com": "admin"
};

// Función para obtener rol
export function getUserRole(email) {
  return roles[email] || "user";
}

// js/roleManager.js
export function getRole(uid) {
  const roles = JSON.parse(localStorage.getItem("roleManagerData")) || {};
  const role = roles[uid] || { premium: false, admin: false };
  return role;
}

// Verifica si puede entrar a páginas premium
export function canAccessPremium(uid) {
  const r = getRole(uid);
  return r.premium || r.admin;
}

// Verifica si es admin
export function isAdmin(uid) {
  const r = getRole(uid);
  return r.admin === true;
}

// Protección de páginas
export function protectPage(allowedRoles = ["admin"], redirectUrl = "index.html") {
  import("./firebase-config.js").then(({ auth }) => {
    import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js").then(({ onAuthStateChanged }) => {
      onAuthStateChanged(auth, (user) => {
        if (!user) {
          alert("Debes iniciar sesión para acceder a esta página.");
          window.location.href = redirectUrl;
          return;
        }

        const role = getUserRole(user.email);
        if (!allowedRoles.includes(role)) {
          alert("Acceso restringido. No tienes permiso para ver esta página.");
          window.location.href = redirectUrl;
        } else {
          document.body.style.display = "block";
        }
      });
    });
  });
}
