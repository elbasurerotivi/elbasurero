/// Header ///
document.addEventListener("DOMContentLoaded", () => {
  // Cargar header dinámico
  fetch("header.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("header").innerHTML = data;

      // Menú hamburguesa
      const mobileMenu = document.getElementById("mobile-menu");
      const navMenu = document.querySelector(".nav-menu");

      if (mobileMenu && navMenu) {
        mobileMenu.addEventListener("click", () => {
          mobileMenu.classList.toggle("active");
          navMenu.classList.toggle("active");
        });
      }
    })
    .catch(err => console.error("Error cargando header:", err));
});
