// js/premium.js
import { auth, db, ref, get } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Debes iniciar sesión para acceder a esta sección.");
    window.location.href = "login.html";
    return;
  }

  // Leer datos del usuario desde la base
  const userRef = ref(db, `users/${user.uid}`);
  const snapshot = await get(userRef);

  if (!snapshot.exists()) {
    alert("No se pudo verificar tu cuenta.");
    window.location.href = "index.html";
    return;
  }

  const data = snapshot.val();

  // 🔒 Solo 'premium' o 'admin' pueden entrar
  if (data.role !== "premium" && data.role !== "admin") {
    alert("Acceso restringido. Solo miembros premium pueden ver este contenido.");
    window.location.href = "index.html";
    return;
  }

  // ✅ Si llega hasta acá, puede ver el contenido
  console.log(`Acceso permitido para: ${data.role}`);
});
