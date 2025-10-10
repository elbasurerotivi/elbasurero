// js/premium.js
import { auth, db, ref, get } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  // Ocultamos el contenido premium hasta validar
  const content = document.getElementById("premiumContent");
  if (content) content.style.display = "none";

  onAuthStateChanged(auth, async (user) => {
    // 🚫 Si no hay sesión → redirigir
    if (!user) {
      alert("Debes iniciar sesión para acceder a esta sección.");
      window.location.href = "login.html";
      return;
    }

    try {
      // 🔍 Buscar el rol del usuario
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        alert("No se encontró tu perfil en la base de datos.");
        window.location.href = "index.html";
        return;
      }

      const data = snapshot.val();
      const role = data.role || "user";

      // 🔒 Solo 'premium' o 'admin' tienen acceso
      if (role !== "premium" && role !== "admin") {
        alert("Acceso restringido. Solo miembros premium pueden ver este contenido.");
        window.location.href = "index.html";
        return;
      }

      // ✅ Acceso permitido → mostrar contenido
      console.log(`✅ Acceso permitido: ${role}`);
      if (content) content.style.display = "block";

    } catch (error) {
      console.error("Error al verificar rol:", error);
      alert("Hubo un problema al verificar tu acceso.");
      window.location.href = "index.html";
    }
  });
});
