// js/roleManager.js
import { auth, db, ref, get } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export function protectPage(allowedRoles = ["premium", "admin"], redirectUrl = "index.html") {
  document.body.style.display = "none";

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("Debes iniciar sesión para acceder a esta página.");
      window.location.href = redirectUrl;
      return;
    }

    try {
      const snapshot = await get(ref(db, `users/${user.uid}`));
      const role = snapshot.exists() ? (snapshot.val().role || "user") : "user";

      if (!allowedRoles.includes(role)) {
        alert("Acceso restringido: Necesitas ser Premium o Admin.");
        window.location.href = redirectUrl;
      } else {
        document.body.style.display = "block";
      }
    } catch (error) {
      console.error("Error verificando rol:", error);
      alert("Error de conexión. Intenta de nuevo.");
      window.location.href = redirectUrl;
    }
  });
}