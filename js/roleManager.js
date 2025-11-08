// js/roleManager.js
// Versión dinámica: Lee roles de Firebase en tiempo real

import { db, ref, onValue, get } from "./firebase-config.js";
import { auth, onAuthStateChanged } from "./firebase-config.js";  // Asegúrate de exportar onAuthStateChanged si no lo está

// Cache local para roles (se actualiza en tiempo real)
let rolesCache = {};
let currentUser = null;
let rolesListener = null;

// Inicializar listener para roles de todos los usuarios (solo si es admin o necesario)
export function initRolesSync(isAdmin = false) {
  if (rolesListener) return;  // Ya inicializado

  const usersRef = ref(db, "users");
  rolesListener = onValue(usersRef, (snapshot) => {
    rolesCache = {};
    if (snapshot.exists()) {
      const users = snapshot.val();
      Object.entries(users).forEach(([uid, info]) => {
        const role = info.role || "user";
        rolesCache[info.email] = {
          premium: role === "premium",
          admin: role === "admin"
        };
      });
    }
    console.log("Roles sincronizados:", rolesCache);
    // Si es admin, refresca la UI automáticamente (puedes hookear esto en admin.js)
    if (isAdmin && typeof window !== 'undefined' && window.refreshAdminUI) {
      window.refreshAdminUI();
    }
  }, (error) => {
    console.error("Error sincronizando roles:", error);
  });
}

// Obtener rol de un email (usa cache, sincronizado)
export function getUserRole(email) {
  return rolesCache[email] ? 
    (rolesCache[email].admin ? "admin" : rolesCache[email].premium ? "premium" : "user") : "user";
}

// Verifica si puede acceder a premium
export function canAccessPremium(email) {
  const role = getUserRole(email);
  return role === "premium" || role === "admin";
}

// Verifica si es admin
export function isAdmin(email) {
  return getUserRole(email) === "admin";
}

// Protección de páginas (usa cache sincronizado)
export function protectPage(allowedRoles = ["admin"], redirectUrl = "index.html") {
  document.body.style.display = "none";  // Ocultar hasta verificar

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      alert("Debes iniciar sesión para acceder a esta página.");
      window.location.href = redirectUrl;
      return;
    }

    currentUser = user;
    const role = getUserRole(user.email);

    if (!allowedRoles.includes(role)) {
      alert("Acceso restringido. No tienes permiso para ver esta página.");
      window.location.href = redirectUrl;
    } else {
      document.body.style.display = "block";
      // Inicializar sync si es admin (para admin.html)
      if (role === "admin") {
        initRolesSync(true);
      }
    }
  });
}

// Cleanup al cerrar (opcional)
export function cleanupRolesSync() {
  if (rolesListener) {
    rolesListener();  // Detiene el listener
    rolesListener = null;
  }
}

// Para compatibilidad: getUserRole sin auth (pero avisa que necesita login)
export function getUserRoleNoAuth(email) {
  console.warn("getUserRoleNoAuth: Usando cache sin auth. Inicializa con login.");
  return getUserRole(email);
}