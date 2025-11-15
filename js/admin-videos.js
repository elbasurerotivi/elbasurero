// js/admin-videos.js
import { auth, db, ref, get, update, onAuthStateChanged } from "./firebase-config.js";
import { onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

document.addEventListener("DOMContentLoaded", () => {
  const videoList = document.getElementById("videoList");
  const searchInput = document.getElementById("searchInput");
  const newCategoryBtn = document.getElementById("newCategoryBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  let videos = [];
  let categories = {};
  let videoElements = [];

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
    loadData();
  });

  // === CARGAR DATOS ===
  let videosLoaded = false;
  let categoriesLoaded = false;

  function checkAndRender() {
    if (videosLoaded && categoriesLoaded) {
      renderVideos();
    }
  }

  // Cargar videoCatalog
  onValue(ref(db, "videoCatalog"), (snap) => {
    const data = snap.val();
    videos = data ? Object.entries(data).map(([id, d]) => ({ id, ...d })) : [];
    videosLoaded = true;
    checkAndRender();
  }, (error) => {
    console.error("Error cargando videoCatalog:", error);
    videoList.innerHTML = "<p style='color:red;'>Error: No se pudieron cargar los videos.</p>";
  });

  // Cargar categories
  onValue(ref(db, "categories"), (snap) => {
    categories = snap.val() || {};
    categoriesLoaded = true;
    checkAndRender();
  }, (error) => {
    console.error("Error cargando categories:", error);
  });

  // === RENDER ===
  function renderVideos() {
    videoList.innerHTML = "";
    videoElements = [];

    const query = searchInput.value.toLowerCase().trim();
    const filtered = videos.filter(v =>
      (v.title || "").toLowerCase().includes(query) ||
      (v.id || "").toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
      videoList.innerHTML = "<p style='text-align:center; color:#aaa;'>No hay videos</p>";
      return;
    }

    filtered.forEach(video => {
      const div = document.createElement("div");
      div.className = "video-item";

      const currentCat = video.category || "";
      const catOptions = Object.entries(categories)
        .map(([slug, data]) => {
          const selected = slugify(data.name) === slugify(currentCat) ? "selected" : "";
          return `<option value="${slug}" ${selected}>${data.name}</option>`;
        })
        .join("");

      div.innerHTML = `
        <div class="video-info">
          <h3>${video.title || "Sin título"}</h3>
          <small>ID: ${video.id}</small>
        </div>
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <select class="category-select" data-id="${video.id}">
            <option value="">-- Sin categoría --</option>
            ${catOptions}
          </select>
          <button class="btn-save" data-id="${video.id}">Guardar</button>
        </div>
      `;

      const select = div.querySelector(".category-select");
      const btn = div.querySelector(".btn-save");

      btn.addEventListener("click", () => saveCategory(video.id, select.value));
      select.addEventListener("change", () => btn.style.background = "#00b8d4");

      videoElements.push(div);
      videoList.appendChild(div);
    });
  }

  // === GUARDAR CATEGORÍA ===
  async function saveCategory(videoId, catSlug) {
    const btn = document.querySelector(`.btn-save[data-id="${videoId}"]`);
    btn.disabled = true;
    btn.textContent = "Guardando...";

    try {
      const catName = categories[catSlug]?.name || "";
      await update(ref(db, `videoCatalog/${videoId}`), { category: catName });
      btn.style.background = "var(--success)";
      btn.textContent = "Guardado";
      setTimeout(() => {
        btn.style.background = "";
        btn.textContent = "Guardar";
        btn.disabled = false;
      }, 1000);
    } catch (err) {
      alert("Error: " + err.message);
      btn.disabled = false;
    }
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

    update(ref(db, `categories/${slug}`), {
      name, background, cover, synopsis, year, genre, cast
    }).then(() => {
      alert("Categoría creada: " + name);
    });
  });

  // === BÚSQUEDA ===
  searchInput.addEventListener("input", () => renderVideos());

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
});
// DEBUG: Verifica que los datos lleguen
console.log("admin-videos.js cargado");