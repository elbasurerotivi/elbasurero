document.addEventListener("DOMContentLoaded", () => {
  // Función para alternar el menú hamburguesa
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

  // Cargar el header y el popup de login dinámicamente
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
          menuToggle.addEventListener("click", toggleMenu);
          console.log("Evento click asignado a .menu-toggle");
        } else {
          console.warn("No se encontró .menu-toggle después de cargar el header");
        }
        // Cargar el popup de login
        const loginModal = document.createElement("div");
        loginModal.id = "loginModal";
        loginModal.className = "modal";
        loginModal.innerHTML = `
          <div class="modal-content">
            <h2 class="modal-title" id="form-title">Iniciar Sesión</h2>
            <form id="login-form" class="login-form">
              <div class="form-group" id="username-group" style="display: none;">
                <input type="text" id="username" placeholder="Nombre de usuario" maxlength="30">
              </div>
              <div class="form-group">
                <input type="email" id="email" placeholder="Correo electrónico" required>
              </div>
              <div class="form-group">
                <input type="password" id="password" placeholder="Contraseña" required>
              </div>
              <button type="submit" id="actionBtn" class="btn btn-primary">Login</button>
            </form>
            <div class="social-login">
              <p>O inicia sesión con:</p>
              <button class="btn btn-google" onclick="loginGoogle()">
                <img src="Imagenes/google_logo.webp" alt="Google"> Google
              </button>
              <button class="btn btn-facebook" onclick="loginFacebook()">
                <img src="Imagenes/facebook_logo_2.png" alt="Facebook"> Facebook
              </button>
            </div>
            <button class="btn btn-close" onclick="cerrarLogin()">Cerrar</button>
            <div class="switch" onclick="toggleForm()">
              ¿No tienes cuenta? Regístrate aquí
            </div>
          </div>
        `;
        document.body.appendChild(loginModal);
        // Intentar inicializar botones de login/logout
        function tryInitAuthButtons(attempts = 10, delay = 300) {
          if (typeof window.initAuthButtons === "function") {
            window.initAuthButtons();
            console.log("initAuthButtons ejecutado con éxito");
          } else if (attempts > 0) {
            console.warn(`initAuthButtons no está definido, reintentando (${attempts} intentos restantes)`);
            setTimeout(() => tryInitAuthButtons(attempts - 1, delay), delay);
          } else {
            console.error("No se pudo cargar initAuthButtons. Verifica que js/login.js exista y no tenga errores.");
          }
        }
        tryInitAuthButtons();
      })
      .catch(error => console.error("Error cargando el header:", error));
  } else {
    console.warn("No se encontró el elemento #header");
  }
});