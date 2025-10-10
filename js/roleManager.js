// js/roleManager.js
import { db, ref, get, update } from "./firebase-config.js";
import { onAuthStateChanged, auth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export async function getUserRole(uid) {
  const userRef = ref(db, `users/${uid}`);
  const snapshot = await get(userRef);
  if (snapshot.exists()) {
    return snapshot.val().role || "user";
  }
  return "user";
}

// 🔐 Control de acceso a páginas
export function protectPage(allowedRoles = ["admin"], redirectUrl = "index.html") {
  document.body.style.display = "none"; // ocultar mientras valida
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("Debes iniciar sesión para acceder.");
      window.location.href = redirectUrl;
      return;
    }

    const role = await getUserRole(user.uid);
    if (!allowedRoles.includes(role)) {
      alert("Acceso restringido. No tienes permiso para ver esta página.");
      window.location.href = redirectUrl;
      return;
    }

    document.body.style.display = "block"; // mostrar si tiene permiso
  });
}

// 🧩 Actualizar rol desde admin.html
export async function setUserRole(uid, role) {
  await update(ref(db, `users/${uid}`), { role });
}
