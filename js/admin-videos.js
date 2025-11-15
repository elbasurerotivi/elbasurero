// js/admin-videos.js
import { auth, db, ref, update, onAuthStateChanged, get } from "./firebase-config.js";
import { onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { videosPremium } from "./videos-premium.js";

document.addEventListener("DOMContentLoaded", () => {
  const videoList = document.getElementById("videoList");
  const searchInput = document.getElementById("searchInput");
  const newCategoryBtn = document.getElementById("newCategoryBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  let videoCategories = {};
  let categories = {};

  // === RENDER ===
  function renderVideos() {
    const query = searchInput.value.toLowerCase().trim();
    const filtered = videosPremium.filter(v =>
      v.title.toLowerCase().includes(query) ||
      v.id.toLowerCase().includes(query)
    );

    videoList.innerHTML = filtered.length === 0
      ? "<p style='text-align:center; color:#aaa;'>No hay videos</p>"
      : "";

    filtered.forEach(video => {
      const div = document.createElement("div");
      div.className = "video-item";

      const currentSlug = videoCategories[video.id] || "";
      const catOptions = Object.entries(categories)
        .map(([slug, data]) => `<option value="${slug}" ${slug === currentSlug ? "selected" : ""}>${data.name}</option>`)
        .join("");

      div.innerHTML = `
        <div class="video-info">
          <h3>${video.title}</h3>
          <small>ID: ${video.id}</small>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <select class="category-select" data-id="${video.id}">
            <option value="">-- Sin categoría --</option>
            ${catOptions}
          </select>
          <button class="btn-save" data-id="${video.id}">Guardar</button>
        </div>
      `;

      const select = div.querySelector(".category-select");
      const btn = div.querySelector(".btn-save");

      btn.addEventListener("click", () => {
        const slug = select.value;
        update(ref(db, `videoCategories/${video.id}`), slug || null)
          .then(() => {
            btn.style.background = "var(--success)";
            btn.textContent = "Guardado";
            setTimeout(() => {
              btn.style.background = "";
              btn.textContent = "Guardar";
            }, 1000);
          })
          .catch(err => alert("Error: " + err.message));
      });

      videoList.appendChild(div);
    });
  }

  // === NUEVA CATEGORÍA ===
  newCategoryBtn.addEventListener("click", () => {
    const name = prompt("Nombre de la nueva categoría:");
    if (!name) return;

    const slug = slugify(name);
    if (categories[slug]) {
      alert("Ya existe una categoría con ese nombre.");
      return;
    }

    const background = prompt("URL del fondo (hero):") || "Imagenes/default.jpg";
    const cover = prompt("URL de la portada:") || "Imagenes/default-cover.jpg";
    const synopsis = prompt("Sinopsis (opcional):") || "";
    const year = prompt("Año (ej: 2023):") || "";
    const genre = prompt("Género:") || "";
    const cast = prompt("Reparto:") || "";

    update(ref(db, `categories/${slug}`), { name, background, cover, synopsis, year, genre, cast })
      .then(() => alert("Categoría creada: " + name))
      .catch(err => alert("Error: " + err.message));
  });

  // === BÚSQUEDA ===
  searchInput.addEventListener("input", renderVideos);

  // === LOGOUT ===
  logoutBtn.addEventListener("click", () => {
    import("./login.js").then(m => m.logout());
  });

  // === SLUGIFY ===
  function slugify(text) {
    return text.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // === AUTH CHECK ===
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    const snapshot = await get(ref(db, `users/${user.uid}`));
    if (!snapshot.exists() || snapshot.val().role !== "admin") {
      alert("Acceso denegado");
      window.location.href = "index.html";
      return;
    }

    document.body.classList.add("visible");

    // === CARGAR DATOS EN TIEMPO REAL ===
    onValue(ref(db, "videoCategories"), (snap) => {
      videoCategories = snap.val() || {};
      renderVideos();
    });

    onValue(ref(db, "categories"), (snap) => {
      categories = snap.val() || {};
      renderVideos();
    });

    // Render inicial
    renderVideos();
  });

  console.log("admin-videos.js cargado correctamente");
});