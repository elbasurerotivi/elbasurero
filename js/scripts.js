document.addEventListener("DOMContentLoaded", () => {
  // Definir toggleMenu globalmente
  window.toggleMenu = function() {
    const navMenu = document.querySelector(".nav-menu");
    const menuToggle = document.querySelector(".menu-toggle");
    if (navMenu && menuToggle) {
      navMenu.classList.toggle("active");
      menuToggle.classList.toggle("active");
      console.log("Menú hamburguesa alternado:", navMenu.classList.contains("active") ? "abierto" : "cerrado");
    } else {
      console.warn("No se encontró .nav-menu o .menu-toggle");
    }
  };

  // Cargar el header dinámicamente y asignar eventos
  const header = document.getElementById("header");
  if (header) {
    fetch("header.html")
      .then(response => {
        if (!response.ok) throw new Error(`Error al cargar header.html: ${response.status}`);
        return response.text();
      })
      .then(data => {
        header.innerHTML = data;
        // Re-asignar evento al menú hamburguesa
        const menuToggle = document.querySelector(".menu-toggle");
        if (menuToggle) {
          menuToggle.addEventListener("click", window.toggleMenu);
          console.log("Evento click asignado a .menu-toggle");
        } else {
          console.warn("No se encontró .menu-toggle después de cargar el header");
        }
        // Intentar inicializar botones de login/logout
        function tryInitAuthButtons(attempts = 10, delay = 200) {
          if (typeof window.initAuthButtons === "function") {
            window.initAuthButtons();
            console.log("initAuthButtons ejecutado con éxito");
          } else if (attempts > 0) {
            console.warn(`initAuthButtons no está definido, reintentando (${attempts} intentos restantes)`);
            setTimeout(() => tryInitAuthButtons(attempts - 1, delay), delay);
          } else {
            console.error("No se pudo cargar initAuthButtons. Verifica que login.js se cargue correctamente.");
          }
        }
        tryInitAuthButtons();
      })
      .catch(error => console.error("Error cargando el header:", error));
  } else {
    console.warn("No se encontró el elemento #header");
  }
});