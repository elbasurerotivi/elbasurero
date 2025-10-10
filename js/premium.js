// js/premium.js
import { auth, db, ref, get } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, async (user) => {
    // 🚫 Si no hay usuario logueado → redirigir
    if (!user) {
      alert("Debes iniciar sesión para acceder a esta sección.");
      window.location.href = "login.html";
      return;
    }

    try {
      // 🔎 Obtener datos del usuario desde la base
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        alert("No se encontró tu perfil de usuario.");
        window.location.href = "index.html";
        return;
      }

      const data = snapshot.val();

      // 🔒 Solo 'premium' o 'admin' pueden acceder
      if (data.role !== "premium" && data.role !== "admin") {
        alert("Acceso restringido. Solo miembros premium pueden ver este contenido.");
        window.location.href = "index.html";
        return;
      }

      console.log(`✅ Acceso permitido: ${data.role}`);

    } catch (error) {
      console.error("Error al verificar rol:", error);
      alert("Hubo un problema al verificar tu acceso.");
      window.location.href = "index.html";
    }
  });
});
