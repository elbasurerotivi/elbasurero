// js/roleManager.js
import { db, ref, get } from "./firebase-config.js";

let rolesCache = {};

export async function loadRoles() {
  const snapshot = await get(ref(db, "users"));
  if (snapshot.exists()) {
    const users = snapshot.val();
    rolesCache = {};
    Object.values(users).forEach(u => {
      const role = u.role || "user";
      rolesCache[u.email] = {
        premium: role === "premium",
        admin: role === "admin"
      };
    });
  }
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

export async function protectPage(allowedRoles = ["admin"], redirectUrl = "index.html") {
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get("email"); // Opcional: pasar email por URL

  if (!email) {
    alert("Acceso denegado: Email requerido.");
    window.location.href = redirectUrl;
    return;
  }

  await loadRoles();
  const role = getUserRole(email.toLowerCase());

  if (!allowedRoles.includes(role)) {
    alert("Acceso restringido.");
    window.location.href = redirectUrl;
  } else {
    document.body.style.display = "block";
  }
}