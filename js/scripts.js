document.addEventListener("DOMContentLoaded", () => {
  console.log("Pathname actual:", window.location.pathname);

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
        const menuToggle = document.querySelector(".menu-toggle");
        if (menuToggle) {
          menuToggle.addEventListener("click", toggleMenu);
          console.log("Evento click asignado a .menu-toggle");
        } else {
          console.warn("No se encontró .menu-toggle después de cargar el header");
        }
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

  // Cargar y mostrar el popup de anuncios en todas las páginas
  fetch("popup.html")
    .then(response => {
      if (!response.ok) throw new Error(`Error al cargar popup.html: ${response.status}`);
      return response.text();
    })
    .then(data => {
      document.body.insertAdjacentHTML("beforeend", data);
      const today = new Date().toLocaleDateString("es-AR");
      const lastShown = localStorage.getItem("announcementLastShown");
      const noShowToday = localStorage.getItem("noShowToday");
      const announcementModal = document.getElementById("announcementModal");
      if (announcementModal && (!noShowToday || lastShown !== today)) {
        announcementModal.style.display = "flex";
        console.log("Popup de anuncios mostrado automáticamente");
      } else {
        console.log("Popup de anuncios no mostrado (bloqueado por el usuario o mismo día)");
      }
      if (typeof Swiper !== "undefined") {
        new Swiper(".announcement-swiper", {
          loop: true,
          loopAdditionalSlides: 3,
          autoplay: { delay: 5000, disableOnInteraction: false },
          navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
          pagination: { el: ".swiper-pagination", clickable: true },
          slidesPerView: 1,
          spaceBetween: 20,
        });
        console.log("Swiper inicializado correctamente");
      } else {
        console.error("Swiper no está definido. Asegúrate de incluir swiper-bundle.min.js antes de scripts.js");
      }
      if (typeof videosData !== "undefined" && videosData.length > 0) {
        const sortedVideos = videosData.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        const latestVideo = sortedVideos[0];
        const videoIdMatch = latestVideo.link.match(/v=([^&]+)/);
        let thumbnail = latestVideo.miniatura;
        if (videoIdMatch && videoIdMatch[1]) {
          const videoId = videoIdMatch[1];
          thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
        const latestImg = document.getElementById("latest-video-img");
        const latestLink = document.getElementById("latest-video-link");
        const latestLinkBtn = document.getElementById("latest-video-link-btn");
        const latestCard = document.getElementById("latest-video-card");
        if (latestImg && latestLink && latestLinkBtn && latestCard) {
          latestImg.src = thumbnail;
          latestImg.alt = latestVideo.titulo;
          latestLink.href = latestVideo.link;
          latestLinkBtn.href = latestVideo.link;
          console.log("Tarjeta de Último Video actualizada:", latestVideo.titulo);
        } else {
          console.warn("No se encontraron elementos para actualizar la tarjeta de Último Video");
        }
      } else {
        console.warn("videosData no está definido o vacío. Asegúrate de incluir videos.js");
      }
      const noShowCheckbox = document.getElementById("noShowToday");
      if (noShowCheckbox) {
        noShowCheckbox.addEventListener("change", () => {
          if (noShowCheckbox.checked) {
            localStorage.setItem("noShowToday", "true");
            localStorage.setItem("announcementLastShown", today);
            console.log("Checkbox marcado: No mostrar popup por hoy");
          } else {
            localStorage.removeItem("noShowToday");
            console.log("Checkbox desmarcado: Popup puede mostrarse nuevamente");
          }
        });
      }
    })
    .catch(error => console.error("Error cargando popup.html:", error));

  // Generar carrusel dinámico con Swiper en index.html
  if (window.location.pathname.includes('index.html')) {
    if (typeof videosData !== "undefined" && videosData.length > 0) {
      const carousel = document.getElementById("dynamic-carousel");
      if (carousel) {
        const sortedVideos = videosData.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        const latestVideos = sortedVideos.slice(0, 10);
        let slideCount = 0;
        latestVideos.forEach(video => {
          const videoIdMatch = video.link.match(/v=([^&]+)/);
          let thumbnail = video.miniatura;
          if (videoIdMatch && videoIdMatch[1]) {
            const videoId = videoIdMatch[1];
            thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          }
          if (thumbnail) {
            const slide = document.createElement("div");
            slide.classList.add("swiper-slide");
            slide.innerHTML = `<a href="${video.link}" target="_blank"><img src="${thumbnail}" alt="${video.titulo}"></a>`;
            carousel.appendChild(slide);
            slideCount++;
          }
        });
        console.log(`Slides generados: ${slideCount}`);
        if (slideCount < 10) {
          const slidesToAdd = 10 - slideCount;
          const originalSlides = [...carousel.children];
          for (let i = 0; i < slidesToAdd; i++) {
            const originalIndex = i % originalSlides.length;
            carousel.appendChild(originalSlides[originalIndex].cloneNode(true));
          }
          slideCount = carousel.children.length;
          console.log(`Slides duplicados añadidos, total: ${slideCount}`);
        }
        if (typeof Swiper !== "undefined") {
          new Swiper(".mySwiper", {
            loop: true,
            loopAdditionalSlides: slideCount,
            autoplay: {
              delay: 1500,
              disableOnInteraction: false,
            },
            pagination: {
              el: ".swiper-pagination",
              clickable: true,
            },
            navigation: {
              nextEl: ".swiper-button-next",
              prevEl: ".swiper-button-prev",
            },
            slidesPerView: 1,
            spaceBetween: 20,
          });
          console.log(`Carrusel dinámico inicializado con ${slideCount} slides`);
        } else {
          console.error("Swiper no está definido para el carrusel dinámico");
        }
      } else {
        console.warn("Contenedor #dynamic-carousel no encontrado");
      }
    } else {
      console.warn("videosData no está definido o vacío para el carrusel dinámico");
    }
  }

  // Actualizar título de categoría en videos.html
  if (window.location.pathname.includes('videos.html')) {
    const categoryItems = document.querySelectorAll('.dropdown-item');
    const categoryTitle = document.getElementById('category-title');
    categoryItems.forEach(item => {
      item.addEventListener('click', () => {
        categoryItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const category = item.getAttribute('data-category');
        categoryTitle.textContent = category === 'latest' ? 'Últimos' : category.charAt(0).toUpperCase() + category.slice(1);
        console.log(`Título de categoría actualizado a: ${categoryTitle.textContent}`);
      });
    });
  }

  // Función para cerrar el popup
  window.cerrarAnuncio = function() {
    const announcementModal = document.getElementById("announcementModal");
    if (announcementModal) {
      announcementModal.style.display = "none";
      console.log("Popup de anuncios cerrado");
    }
  };

  // Resetear la preferencia a medianoche
  function resetNoShowAtMidnight() {
    const now = new Date();
    const timeToMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0) - now;
    setTimeout(() => {
      localStorage.removeItem("noShowToday");
      localStorage.removeItem("announcementLastShown");
      console.log("Preferencia de 'No mostrar más por hoy' reseteada a medianoche");
      resetNoShowAtMidnight();
    }, timeToMidnight);
  }
  resetNoShowAtMidnight();
});