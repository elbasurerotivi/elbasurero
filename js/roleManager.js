// js/roleManager.js
import { db, ref, onValue } from "./firebase-config.js";

let rolesCache = {};
let rolesListener = null;

export function initRolesSync() {
  if (rolesListener) return;

  const usersRef = ref(db, "users");
  rolesListener = onValue(usersRef, (snapshot) => {
    rolesCache = {};
    if (snapshot.exists()) {
      const users = snapshot.val();
      Object.values(users).forEach(u => {
        const role = u.role || "user";
        rolesCache[u.email] = {
          premium: role === "premium",
          admin: role === "admin"
        };
      });
    }
  });
}

export function getUserRole(email) {
  const r = rolesCache[email];
  if (r?.admin) return "admin";
  if (r?.premium) return "premium";
  return "user";
}

export function canAccessPremium(email) {
  return getUserRole(email) === "premium" || getUserRole(email) === "admin";
}

export function isAdmin(email) {
  return getUserRole(email) === "admin";
}

// Protege páginas
export function protectPage(allowedRoles = ["admin"], redirectUrl = "index.html", callback) {
  document.body.style.display = "none";
  import("./firebase-config.js").then(({ auth, onAuthStateChanged }) => {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        alert("Debes iniciar sesión.");
        window.location.href = redirectUrl;
        return;
      }
      const role = getUserRole(user.email);
      if (!allowedRoles.includes(role)) {
        alert("Acceso denegado.");
        window.location.href = redirectUrl;
      } else {
        if (callback) callback();
        document.body.style.display = "block";
      }
    });
  });
}