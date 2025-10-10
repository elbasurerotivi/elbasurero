// js/roleManager.js
// Este archivo se modifica automáticamente desde admin.html

export const roles = {
  "charsvolta@gmail.com": { premium: false, admin: true }
};

// Función para obtener rol como string
export function getUserRole(email) {
  const role = roles[email] || { premium: false, admin: false };
  if (role.admin) return "admin";
  if (role.premium) return "premium";
  return "user";
}

// Verifica si puede entrar a páginas premium
export function canAccessPremium(email) {
  const role = getUserRole(email);
  return role === "premium" || role === "admin";
}

// Verifica si es admin
export function isAdmin(email) {
  const role = getUserRole(email);
  return role === "admin";
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