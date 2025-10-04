document.addEventListener("DOMContentLoaded", () => {
  // Función para alternar el menú hamburguesa
  window.toggleMenu = function() {
    const navMenu = document.querySelector(".nav-menu");
    const menuToggle = document.querySelector(".menu-toggle");
    if (navMenu && menuToggle) {
      navMenu.classList.toggle("active");
      menuToggle.classList.toggle("active");
    }
  };

  // Re-asignar eventos después de cargar el header dinámicamente
  const header = document.getElementById("header");
  if (header) {
    fetch("header.html")
      .then(response => response.text())
      .then(data => {
        header.innerHTML = data;
        // Re-asignar evento al menú hamburguesa después de cargar el header
        const menuToggle = document.querySelector(".menu-toggle");
        if (menuToggle) {
          menuToggle.addEventListener("click", toggleMenu);
        }
      })
      .catch(error => console.error("Error cargando el header:", error));
  }
});