// Control de acceso premium
document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));

  // Si no hay usuario o no es premium, redirigir
  if (!user || user.role !== "premium") {
    alert("Acceso restringido. Solo miembros premium pueden ver este contenido.");
    window.location.href = "index.html";
  }
});
