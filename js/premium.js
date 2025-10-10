// js/premium.js
import { auth, db, ref, get } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const content = document.getElementById("premiumContent");
  if (content) content.style.display = "none";

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("Debes iniciar sesión para acceder a esta sección.");
      window.location.href = "login.html";
      return;
    }

    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      alert("No se encontró tu cuenta en la base de datos.");
      window.location.href = "index.html";
      return;
    }

    const data = snapshot.val();
    const role = data.role || "user";

    // ✅ Solo 'premium' y 'admin' pueden ingresar
    if (role !== "premium" && role !== "admin") {
      alert("Acceso restringido. Solo miembros premium pueden ver este contenido.");
      window.location.href = "index.html";
      return;
    }

    // Si el rol es válido → mostrar contenido
    if (content) content.style.display = "block";
  });
});
