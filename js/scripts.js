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

  // Cargar el header dinámicamente y asignar eventos
  const header = document.getElementById("header");
  if (header) {
    fetch("header.html")
      .then(response => response.text())
      .then(data => {
        header.innerHTML = data;
        // Re-asignar evento al menú hamburguesa
        const menuToggle = document.querySelector(".menu-toggle");
        if (menuToggle) {
          menuToggle.addEventListener("click", toggleMenu);
        }
        // Inicializar botones de login/logout
        if (typeof window.initAuthButtons === "function") {
          window.initAuthButtons();
        } else {
          console.warn("initAuthButtons no está definido");
        }
      })
      .catch(error => console.error("Error cargando el header:", error));
  }
});