const availableCategories = [
  "Lunes de Argentina",
  "Miércoles de Clásicos", 
  "Jueves Animados",
  "Sábados de YouTube",
  "Dulce, chile y manteca",
  "Domingos de Sorpresas",
  "Series",
  "Películas",
  "TV",
];

import { db, auth, ref, onValue, push, update, remove, get, set, onAuthStateChanged } from "./firebase-config.js";

let currentCategory = "movies-pending";
let recommendations = []; // Para sugerencias: se carga con pending + completed de todas las categorías
let unsubscribe = null;
let openComments = new Set();
let userId = localStorage.getItem("userId") || "user_" + Math.random().toString(36).substring(2, 9);
localStorage.setItem("userId", userId);
let isAdmin = false;

// *** NUEVA ADICIÓN 1/4: Variable para filtro ***
let currentFilter = "all"; // "all" o nombre de categoría

onAuthStateChanged(auth, async (user) => {
  if (user) {
    userId = user.uid;
    localStorage.setItem("userId", userId);
    const roleSnap = await get(ref(db, `users/${user.uid}/role`));
    isAdmin = roleSnap.val() === 'admin';
    await loadAllForSuggestions(); // Carga inicial cuando cambia el estado de auth
  }
});

function getPendingRef() {
  const cat = currentCategory.split('-')[0];
  return ref(db, cat === "movies" ? "recommendations" : "music");
}

function getCompletedRef() {
  const cat = currentCategory.split('-')[0];
  return ref(db, cat === "movies" ? "completed_recommendations" : "completed_music");
}

function getListContainer() {
  return document.getElementById(`recommend-list-${currentCategory}`);
}

const form = document.getElementById("recommend-form");
const textarea = document.getElementById("rec-text");
const suggestionsContainer = document.getElementById("suggestions");
const tabButtons = document.querySelectorAll(".tab-btn");
const lists = {
  "movies-pending": document.getElementById("recommend-list-movies-pending"),
  "movies-completed": document.getElementById("recommend-list-movies-completed"),
  "music-pending": document.getElementById("recommend-list-music-pending"),
  "music-completed": document.getElementById("recommend-list-music-completed"),
};

// *** NUEVA ADICIÓN 2/4: FUNCIÓN PARA CREAR BOTONES DE FILTRO ***
function createFilterButtons() {
  const container = document.getElementById("tag-filter-buttons");
  if (!container) return;
  
  // Botón "Todas"
  const allBtn = document.createElement("button");
  allBtn.className = "filter-btn active";
  allBtn.textContent = "Todas";
  allBtn.dataset.filter = "all";
  container.appendChild(allBtn);
  
  // Botones por categoría
  availableCategories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "filter-btn";
    btn.textContent = cat;
    btn.dataset.filter = cat;
    container.appendChild(btn);
  });
  
  // Event listeners para filtrar
  container.addEventListener("click", (e) => {
    if (e.target.classList.contains("filter-btn")) {
      // Quitar active de todos
      container.querySelectorAll(".filter-btn").forEach(btn => 
        btn.classList.remove("active")
      );
      // Activar clicked
      e.target.classList.add("active");
      currentFilter = e.target.dataset.filter;
      // Re-renderizar lista filtrada (SOLO si no es completed)
      if (!currentCategory.includes('completed')) {
        renderFilteredList();
      }
    }
  });
}

// *** NUEVA ADICIÓN 3/4: FUNCIÓN PARA RENDERIZAR LISTA FILTRADA ***
async function renderFilteredList() {
  const container = getListContainer();
  const allPosts = [];
  
  // Obtener TODOS los posts de la categoría actual
  const snapshot = await get(getPendingRef());
  if (snapshot.exists()) {
    snapshot.forEach(child => {
      allPosts.push({ id: child.key, ...child.val() });
    });
  }
  
  // FILTRAR por categoría actual
  let filteredPosts = allPosts;
  if (currentFilter !== "all") {
    filteredPosts = allPosts.filter(post => 
      post.categories && post.categories.includes(currentFilter)
    );
  }
  
  // ORDENAR por likes (IGUAL QUE SIEMPRE)
  filteredPosts.sort((a, b) => {
    const likesA = Object.keys(a.likes || {}).length;
    const likesB = Object.keys(b.likes || {}).length;
    return likesB - likesA || b.timestamp - a.timestamp;
  });
  
  // RENDERIZAR
  container.innerHTML = "";
  if (filteredPosts.length === 0) {
    container.innerHTML = 
      currentFilter === "all" 
        ? "<p>No hay recomendaciones todavía. ¡Sé el primero!</p>"
        : `<p>No hay recomendaciones en <strong>"${currentFilter}"</strong>. 😔</p>`;
  } else {
    filteredPosts.forEach(post => renderPost(post, container));
  }
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentCategory = btn.dataset.category;
    Object.keys(lists).forEach((key) => {
      lists[key].style.display = key === currentCategory ? "block" : "none";
    });
    if (unsubscribe) unsubscribe();
    // Recarga sugerencias al cambiar tab (ahora carga todas las ramas)
    loadAllForSuggestions();
    const refToUse = currentCategory.includes('completed') ? getCompletedRef() : getPendingRef();
    unsubscribe = onValue(refToUse, (snapshot) => {
      renderRecommendations(snapshot, currentCategory.includes('completed'));
    });
    // *** NUEVA ADICIÓN: Reset filtro al cambiar tab ***
    currentFilter = "all";
    const filterContainer = document.getElementById("tag-filter-buttons");
    if (filterContainer) {
      filterContainer.querySelectorAll(".filter-btn").forEach(btn => {
        btn.classList.remove("active");
        if (btn.dataset.filter === "all") btn.classList.add("active");
      });
    }
  });
});

/* ============================
   CARGA DE SUGERENCIAS (FIX)
   - ahora lee las 4 ramas (movies/music + completed)
   - normaliza texto y guarda _textNorm para comparaciones rápidas
   - mejora logging para depuración
   ============================ */
async function loadAllForSuggestions() {
  try {
    const temp = [];

    // Cargar recommendations
    const moviesPendingSnap = await get(ref(db, "recommendations"));
    if (moviesPendingSnap && moviesPendingSnap.exists()) {
      let count = 0;
      moviesPendingSnap.forEach(child => {
        temp.push({ id: child.key, _source: 'movies-pending', ...child.val() });
        count++;
      });
      console.log(`Cargados ${count} items de recommendations`);
    } else {
      console.log("No hay datos en recommendations");
    }

    // Cargar completed_recommendations
    const moviesCompletedSnap = await get(ref(db, "completed_recommendations"));
    if (moviesCompletedSnap && moviesCompletedSnap.exists()) {
      let count = 0;
      moviesCompletedSnap.forEach(child => {
        temp.push({ id: child.key, _source: 'movies-completed', ...child.val() });
        count++;
      });
      console.log(`Cargados ${count} items de completed_recommendations`);
    } else {
      console.log("No hay datos en completed_recommendations");
    }

    // Cargar music
    const musicPendingSnap = await get(ref(db, "music"));
    if (musicPendingSnap && musicPendingSnap.exists()) {
      let count = 0;
      musicPendingSnap.forEach(child => {
        temp.push({ id: child.key, _source: 'music-pending', ...child.val() });
        count++;
      });
      console.log(`Cargados ${count} items de music`);
    } else {
      console.log("No hay datos en music");
    }

    // Cargar completed_music
    const musicCompletedSnap = await get(ref(db, "completed_music"));
    if (musicCompletedSnap && musicCompletedSnap.exists()) {
      let count = 0;
      musicCompletedSnap.forEach(child => {
        temp.push({ id: child.key, _source: 'music-completed', ...child.val() });
        count++;
      });
      console.log(`Cargados ${count} items de completed_music`);
    } else {
      console.log("No hay datos en completed_music");
    }

    // Normalizamos texto (quita acentos y minúsculas) para comparaciones robustas
    recommendations = temp.map(r => ({
      ...r,
      _textNorm: (r.text || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    }));

    console.log(`Recomendaciones cargadas para sugerencias (restaurado): ${recommendations.length} en total`);
    // muestra una muestra corta para debug (puedes comentar luego)
    console.log("Listado (ejemplo):", recommendations.slice(0, 20).map(r => ({ text: r.text, source: r._source })));
  } catch (err) {
    console.error("Error cargando recomendaciones para sugerencias:", err);
    alert("Error al cargar recomendaciones existentes. Intenta recargar la página.");
  }
}

function linkifyAndEscape(text) {
  const escapeHtml = (str) => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };
  const urlRegex = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/g;
  return escapeHtml(text).replace(urlRegex, (url) => {
    let link = url;
    if (!link.startsWith('http')) link = 'https://' + link;
    return `<a href="${link}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}

// *** NUEVA ADICIÓN 4/4: MODIFICAR renderRecommendations ***
function renderRecommendations(snapshot, isCompleted = false) {
  // Si hay filtro activo Y NO es completed, usar filtro
  if (currentFilter !== "all" && !isCompleted) {
    renderFilteredList();
    return;
  }
  
  // LÓGICA ORIGINAL (SIN CAMBIOS)
  const posts = [];
  snapshot.forEach((child) => {
    posts.push({ id: child.key, ...child.val() });
  });

  posts.sort((a, b) => {
    if (isCompleted) return b.completedAt - a.completedAt;
    const likesA = Object.keys(a.likes || {}).length;
    const likesB = Object.keys(b.likes || {}).length;
    return likesB - likesA || b.timestamp - a.timestamp;
  });

  const container = getListContainer();
  container.innerHTML = "";
  if (posts.length === 0) {
    container.innerHTML = "<p>No hay recomendaciones todavía. ¡Sé el primero en publicar!</p>";
  } else {
    posts.forEach((post) => {
      if (isCompleted) {
        renderCompletedPost(post, container);
      } else {
        renderPost(post, container);
      }
    });
  }
}

// ... [TODO EL RESTO DE FUNCIONES IGUALES: renderCompletedPost, renderPost, deletePost, etc.] ...

function renderCompletedPost(post, container) {
  const postElement = document.createElement("div");
  postElement.className = "completed-post";
  postElement.dataset.postId = post.id;
  postElement.innerHTML = `
    <div class="post-header">
      <strong>${post.name}</strong>
      <span>${new Date(post.timestamp).toLocaleString("es-AR")}</span>
    </div>
    <p class="post-text">${linkifyAndEscape(post.text)}</p>
    ${post.categories && post.categories.length > 0 ? `
        <div class="post-tags">
          ${post.categories.map(cat => `<span class="tag">${cat}</span>`).join('')}
        </div>
      ` : ''}
    <div class="completed-meta">
      Completada: ${new Date(post.completedAt).toLocaleString("es-AR")}<br>
      ${post.reactionLink ? `<a href="${post.reactionLink}" target="_blank">Ver reacción</a>` : ''}
    </div>
    <div class="post-actions">
      <button class="toggle-comments">Comentarios (${post.comments ? Object.keys(post.comments).length : 0})</button>
      ${isAdmin ? `<button class="delete-btn">Eliminar Post</button>` : ''}
    </div>
    <div class="comments-section" style="display:${openComments.has(post.id) ? "block" : "none"};"></div>
  `;
  container.appendChild(postElement);

  const commentBtn = postElement.querySelector(".toggle-comments");
  const commentsContainer = postElement.querySelector(".comments-section");
  const deleteBtn = postElement.querySelector(".delete-btn");

  commentBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = commentsContainer.style.display === "block";
    commentsContainer.style.display = isOpen ? "none" : "block";
    if (!isOpen) {
      openComments.add(post.id);
      renderComments(post.id, commentsContainer, true);
    } else {
      openComments.delete(post.id);
    }
  });

  if (deleteBtn) {
    deleteBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await deletePost(post.id, true);
    });
  }

  if (openComments.has(post.id)) {
    renderComments(post.id, commentsContainer, true);
  }
}

function renderPost(post, container) {
  const existingPost = container.querySelector(`[data-post-id="${post.id}"]`);
  const likesCount = Object.keys(post.likes || {}).length;
  const commentsCount = post.comments ? Object.keys(post.comments).length : 0;
  const userLiked = post.likes && post.likes[userId];

  let postElement;
  if (existingPost) {
    postElement = existingPost;
    const likeBtn = postElement.querySelector(".like-btn");
    const likeCount = postElement.querySelector(".like-count");
    const commentBtn = postElement.querySelector(".toggle-comments");
    likeBtn.className = `like-btn ${userLiked ? "active" : ""}`;
    likeCount.className = `like-count ${userLiked ? "active" : ""}`;
    likeCount.textContent = likesCount;
    commentBtn.textContent = `Comentarios (${commentsCount})`;
  } else {
    postElement = document.createElement("div");
    postElement.className = "recommend-post";
    postElement.dataset.postId = post.id;
    postElement.innerHTML = `
      <div class="post-header">
        <strong>${post.name}</strong>
        <span>${new Date(post.timestamp).toLocaleString("es-AR")}</span>
      </div>
      <p class="post-text">${linkifyAndEscape(post.text)}</p>
      ${post.categories && post.categories.length > 0 ? `
        <div class="post-tags">
          ${post.categories.map(cat => `<span class="tag">${cat}</span>`).join('')}
        </div>
      ` : ''}
      <div class="post-actions">
        <div class="like-wrapper">
          <button class="like-btn ${userLiked ? "active" : ""}">❤️</button>
          <span class="like-count ${userLiked ? "active" : ""}">${likesCount}</span>
        </div>
        <button class="toggle-comments">Comentarios (${commentsCount})</button>
        ${isAdmin ? `<button class="complete-btn">Completada</button>` : ''}
        ${isAdmin ? `<button class="delete-btn">Eliminar</button>` : ''}
      </div>
      <div class="comments-section" style="display:${openComments.has(post.id) ? "block" : "none"};"></div>
    `;

    postElement.style.opacity = "0";
    postElement.style.transform = "translateY(20px)";
    requestAnimationFrame(() => {
      postElement.style.transition = "all 0.4s ease";
      postElement.style.opacity = "1";
      postElement.style.transform = "translateY(0)";
    });

    container.appendChild(postElement);
  }

  const likeBtn = postElement.querySelector(".like-btn");
  const commentBtn = postElement.querySelector(".toggle-comments");
  const commentsContainer = postElement.querySelector(".comments-section");
  const completeBtn = postElement.querySelector(".complete-btn");
  const deleteBtn = postElement.querySelector(".delete-btn");

  likeBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const user = auth.currentUser;
    if (!user) return alert("Debes iniciar sesión para dar like.");
    const uid = user.uid;
    const likeRef = ref(db, `${currentCategory.split('-')[0] === "movies" ? "recommendations" : "music"}/${post.id}/likes/${uid}`);
    const snapshot = await get(likeRef);
    if (snapshot.exists()) {
      await remove(likeRef);
      likeBtn.classList.remove("active");
      likeBtn.nextElementSibling.classList.remove("active");
    } else {
      await set(likeRef, true);
      likeBtn.classList.add("active");
      likeBtn.nextElementSibling.classList.add("active");
    }
  });

  commentBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = commentsContainer.style.display === "block";
    commentsContainer.style.display = isOpen ? "none" : "block";
    if (!isOpen) {
      openComments.add(post.id);
      renderComments(post.id, commentsContainer);
    } else {
      openComments.delete(post.id);
    }
  });

  if (completeBtn) {
    completeBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await markAsCompleted(post.id, post);
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await deletePost(post.id, false);
    });
  }

  if (openComments.has(post.id)) {
    renderComments(post.id, commentsContainer);
  }
}

async function deletePost(postId, isCompleted) {
  if (!isAdmin) return alert("Solo admins pueden eliminar.");
  if (!confirm("¿Seguro que quieres eliminar este post? Esto es irreversible.")) return;
  const cat = currentCategory.split('-')[0];
  const path = isCompleted ? (cat === "movies" ? "completed_recommendations" : "completed_music") : (cat === "movies" ? "recommendations" : "music");
  await remove(ref(db, `${path}/${postId}`));
  await loadAllForSuggestions();
  alert("Post eliminado.");
}

async function markAsCompleted(postId, postData) {
  if (!isAdmin) return alert("Solo admins pueden marcar.");
  const cat = currentCategory.split('-')[0];
  const pendingPath = cat === "movies" ? "recommendations" : "music";
  const completedPath = cat === "movies" ? "completed_recommendations" : "completed_music";
  const reactionLink = prompt("Enlace al video de reacción (opcional):") || "";
  const newData = {
    ...postData,
    completedAt: Date.now(),
    reactionLink
  };
  await set(ref(db, `${completedPath}/${postId}`), newData);
  await remove(ref(db, `${pendingPath}/${postId}`));
  await loadAllForSuggestions();
}

async function deleteComment(postId, commentId, isCompleted) {
  if (!isAdmin) return;
  if (!confirm("¿Seguro que quieres eliminar este comentario?")) return;
  const cat = currentCategory.split('-')[0];
  const path = isCompleted ? (cat === "movies" ? "completed_recommendations" : "completed_music") : (cat === "movies" ? "recommendations" : "music");
  await remove(ref(db, `${path}/${postId}/comments/${commentId}`));
}

function renderComments(postId, container, isCompleted = false) {
  const cat = currentCategory.split('-')[0];
  const path = isCompleted ? (cat === "movies" ? "completed_recommendations" : "completed_music") : (cat === "movies" ? "recommendations" : "music");
  const commentsRef = ref(db, `${path}/${postId}/comments`);

  onValue(commentsRef, (snapshot) => {
    let form = container.querySelector(".comment-form");
    if (!form) {
      form = document.createElement("form");
      form.classList.add("comment-form");
      form.innerHTML = `
        <input type="text" placeholder="Escribe un comentario" required maxlength="300" />
        <button type="submit">Enviar</button>
      `;
      container.appendChild(form);

      const input = form.querySelector("input");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return alert("Debes iniciar sesión para comentar.");

        const newCommentRef = push(commentsRef);
        await set(newCommentRef, {
          name: user.displayName || "Anónimo",
          text: input.value,
          timestamp: Date.now(),
          likes: {},
        });

        input.value = "";
      });
    }

    const commentsList = document.createElement("div");
    commentsList.className = "comments-list";
    snapshot.forEach((child) => {
      const comment = child.val();
      const likesCount = comment.likes ? Object.keys(comment.likes).length : 0;
      const userLiked = comment.likes && comment.likes[userId];

      const div = document.createElement("div");
      div.className = "comment";
      div.dataset.commentId = child.key;
      div.innerHTML = `
        <div class="comment-header"><strong>${comment.name}</strong>
          ${isAdmin ? `<button class="comment-delete" title="Eliminar comentario">Eliminar</button>` : ''}
        </div>
        <div class="comment-text">${linkifyAndEscape(comment.text)}</div>
        <div class="comment-meta">
          <div class="like-wrapper">
            <button type="button" class="comment-like ${userLiked ? "active" : ""}">❤️</button>
            <span class="like-count ${userLiked ? "active" : ""}">${likesCount}</span>
          </div>
        </div>
      `;

      div.querySelector(".comment-like").addEventListener("click", async (e) => {
        e.stopPropagation();
        const user = auth.currentUser;
        if (!user) return alert("Debes iniciar sesión para dar like.");
        const uid = user.uid;
        const likeRef = ref(db, `${path}/${postId}/comments/${child.key}/likes/${uid}`);
        const snap = await get(likeRef);
        if (snap.exists()) {
          await remove(likeRef);
          e.target.classList.remove("active");
          e.target.nextElementSibling.classList.remove("active");
        } else {
          await set(likeRef, true);
          e.target.classList.add("active");
          e.target.nextElementSibling.classList.add("active");
        }
      });

      const deleteCommentBtn = div.querySelector(".comment-delete");
      if (deleteCommentBtn) {
        deleteCommentBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          await deleteComment(postId, child.key, isCompleted);
        });
      }

      commentsList.appendChild(div);
    });

    const existingList = container.querySelector(".comments-list");
    if (existingList) {
      existingList.replaceWith(commentsList);
    } else {
      container.insertBefore(commentsList, form);
    }
  }, { onlyOnce: false });
}

// form submit (adaptado a pending)
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return alert("Debes iniciar sesión para publicar.");

  const text = textarea.value.trim();
  if (!text) return;

  // **NUEVO: Validación OBLIGATORIA de al menos 1 categoría**
  const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked'))
    .map(checkbox => checkbox.value);
  
  if (selectedCategories.length === 0) {
    alert("❌ **Debes seleccionar al menos una categoría** para publicar tu recomendación.");
    return;
  }

  const valueNorm = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const similar = recommendations
    .filter(rec => {
      const recLower = rec._textNorm;
      if (valueNorm.length < 3 || recLower.length < 3) return false;
      const dist = levenshteinDistance(valueNorm, recLower);
      return dist < 5 || recLower.includes(valueNorm);
    });

  if (similar.length > 0) {
    alert("No puedes publicar: esta recomendación es similar a una existente. Por favor, dale like a la que ya está.");
    return;
  }

  const pendingRef = getPendingRef();
  await push(pendingRef, {
    name: user.displayName || "Anónimo",
    text,
    timestamp: Date.now(),
    likes: {},
    comments: {},
    categories: selectedCategories  // Array con al menos 1 categoría
  });

  textarea.value = "";
  suggestionsContainer.innerHTML = "";
  suggestionsContainer.style.display = "none";
  // Desmarcar checkboxes después de enviar
  document.querySelectorAll('input[name="category"]').forEach(cb => cb.checked = false);
  await loadAllForSuggestions();
});

// Detector restaurado con mejoras
function levenshteinDistance(str1 = '', str2 = '') {
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null)
  );
  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }
  return track[str2.length][str1.length];
}

/* ============================
   ENTRADA DEL TEXTAREA: búsqueda de similares
   - usa _textNorm precalculado
   - umbral adaptativo
   ============================ */
textarea.addEventListener("input", async () => {
  const valueRaw = textarea.value.trim();
  const value = valueRaw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const submitBtn = form.querySelector('button[type="submit"]');
  if (valueRaw.length < 3) {
    suggestionsContainer.innerHTML = '';
    suggestionsContainer.style.display = 'none';
    submitBtn.disabled = false;
    submitBtn.style.backgroundColor = '';
    return;
  }

  if (recommendations.length === 0) {
    await loadAllForSuggestions();
  }

  // Filtrar recomendaciones similares
  const similar = recommendations
    .filter((rec) => {
      const recLower = rec._textNorm;
      const dist = levenshteinDistance(value, recLower);
      return dist < 3 || recLower.includes(value);
    })
    .sort((a, b) => {
      return levenshteinDistance(value, a._textNorm) - levenshteinDistance(value, b._textNorm);
    });

  suggestionsContainer.innerHTML = '';
  if (similar.length > 0) {
    suggestionsContainer.style.display = 'block';
    
    // Agregar leyenda de advertencia
    const warning = document.createElement('div');
    warning.className = 'suggestion-warning';
    warning.textContent = 'Tu recomendacion ya fué hecha, votala en lugar de repetirla:';
    suggestionsContainer.appendChild(warning);
    
    // Agregar sugerencias
    similar.forEach((rec) => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.innerHTML = linkifyAndEscape(rec.text); // Usar la función para sugerencias también
      suggestionsContainer.appendChild(item);
    });
    
    // Deshabilitar botón y cambiar estilo
    submitBtn.disabled = true;
    submitBtn.style.backgroundColor = 'gray';
  } else {
    suggestionsContainer.style.display = 'none';
    submitBtn.disabled = false;
    submitBtn.style.backgroundColor = ''; // Restaurar color original
  }
});

// Inicial
loadAllForSuggestions().then(() => {
  unsubscribe = onValue(getPendingRef(), (snapshot) => renderRecommendations(snapshot));
  
  // *** NUEVA ADICIÓN: Crear botones de filtro ***
  createFilterButtons();
});

const scrollToTopBtn = document.querySelector(".scroll-to-top");
if (scrollToTopBtn) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 200) {
      scrollToTopBtn.classList.add("visible");
    } else {
      scrollToTopBtn.classList.remove("visible");
    }
  });

  scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Generar checkboxes para categorías en el form
  const checkboxGroup = document.querySelector(".checkbox-group");
  if (checkboxGroup) {
    availableCategories.forEach(cat => {
      const label = document.createElement("label");
      label.className = "category-checkbox";
      label.innerHTML = `
        <input type="checkbox" name="category" value="${cat}">
        ${cat}
      `;
      checkboxGroup.appendChild(label);
    });
  }
}