// js/recommendations.js
// Importar Firebase desde tu config
import { db, ref, push, onValue, set, remove, get } from "./firebase-config.js";

// UID temporal para simular "usuario"
const userId = "user_" + Math.random().toString(36).substring(2, 9);

// Mantener qué posts están expandidos entre re-renders
const expandedPosts = new Set();

/* ========================
   FORMULARIO
======================== */
const form = document.getElementById("recommend-form");
const recName = document.getElementById("rec-name");
const recText = document.getElementById("rec-text");
const recList = document.getElementById("recommend-list");

if (!form || !recList) {
  console.error("recommendations.js: faltan elementos #recommend-form o #recommend-list en el DOM.");
} else {
  const recommendationsRef = ref(db, "recommendations");

  // Publicar recomendación
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const name = (recName?.value || "").trim() || "Anónimo";
    const text = (recText?.value || "").trim();

    if (!text) return;

    push(recommendationsRef, {
      name,
      text,
      timestamp: Date.now(),
      likes: {},
      dislikes: {},
      comments: {}
    }).catch(err => console.error("Error guardando recomendación:", err));

    form.reset();
  });

  /* ========================
     MOSTRAR RECOMENDACIONES (REALTIME)
  ========================= */
  onValue(recommendationsRef, (snapshot) => {
    const posts = [];
    snapshot.forEach((child) => posts.push({ id: child.key, ...child.val() }));

    // Ordenar: más likes primero, después más reciente
    posts.sort((a, b) => {
      const likesA = Object.keys(a.likes || {}).length;
      const likesB = Object.keys(b.likes || {}).length;
      if (likesB !== likesA) return likesB - likesA;
      return (b.timestamp || 0) - (a.timestamp || 0);
    });

    // Re-render completo (se reconstruyen elementos) pero usamos expandedPosts para mantener abiertos
    recList.innerHTML = "";
    posts.forEach(renderPost);
  }, (err) => console.error("onValue recommendations error:", err));
}

/* ========================
   RENDER DE UN POST
======================== */
function renderPost(post) {
  try {
    const postEl = document.createElement("div");
    postEl.className = "recommend-post";

    const likesCount = Object.keys(post.likes || {}).length;
    const dislikesCount = Object.keys(post.dislikes || {}).length;
    const userLiked = post.likes && post.likes[userId];
    const userDisliked = post.dislikes && post.dislikes[userId];
    const commentsCount = post.comments ? Object.keys(post.comments).length : 0;

    // Botones con type="button" para evitar submits no deseados
    postEl.innerHTML = `
      <div class="post-header">
        <strong>${escapeHtml(post.name)}</strong>
        <span>${post.timestamp ? new Date(post.timestamp).toLocaleString("es-AR") : ""}</span>
      </div>
      <div class="post-text">${escapeHtml(post.text)}</div>
      <div class="post-actions">
        <button type="button" class="like-btn ${userLiked ? "active" : ""}">⬆️ ${likesCount}</button>
        <button type="button" class="dislike-btn ${userDisliked ? "active" : ""}">⬇️ ${dislikesCount}</button>
        <button type="button" class="toggle-comments">💬 Comentarios (${commentsCount})</button>
      </div>
      <div class="comments-section" style="display:none;">
        <div class="comments-list"></div>
        <form class="comment-form">
          <input type="text" class="comment-name" placeholder="Tu nombre" maxlength="30">
          <input type="text" class="comment-text" placeholder="Escribe un comentario" maxlength="300" required>
          <button type="submit">Comentar</button>
        </form>
      </div>
    `;

    // Añadir al DOM
    recList.appendChild(postEl);

    // Referencias
    const likeBtn = postEl.querySelector(".like-btn");
    const dislikeBtn = postEl.querySelector(".dislike-btn");
    const toggleBtn = postEl.querySelector(".toggle-comments");
    const commentsSection = postEl.querySelector(".comments-section");
    const commentsListEl = postEl.querySelector(".comments-list");
    const commentForm = postEl.querySelector(".comment-form");

    // Restaurar estado expando si estaba abierto
    if (expandedPosts.has(post.id)) {
      commentsSection.style.display = "block";
    } else {
      commentsSection.style.display = "none";
    }

    // Evitar que cualquier click dentro de commentsSection burbujee al toggle
    commentsSection.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // HANDLERS

    // Like post
    likeBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      toggleReaction(post.id, "likes", "dislikes");
    });

    // Dislike post
    dislikeBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      toggleReaction(post.id, "dislikes", "likes");
    });

    // Toggle comentarios (solo este botón abre/cierra)
    toggleBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const isOpen = expandedPosts.has(post.id);
      if (isOpen) expandedPosts.delete(post.id);
      else expandedPosts.add(post.id);
      commentsSection.style.display = isOpen ? "none" : "block";
    });

    // Render comentarios
    renderComments(post, commentsListEl);

    // Nuevo comentario
    commentForm.addEventListener("submit", (ev) => {
      ev.preventDefault();
      ev.stopPropagation(); // importante: evitar cerrar por bubbling
      const name = (commentForm.querySelector(".comment-name")?.value || "").trim() || "Anónimo";
      const text = (commentForm.querySelector(".comment-text")?.value || "").trim();
      if (!text) return;

      const commentsRef = ref(db, `recommendations/${post.id}/comments`);
      // aseguramos que la sección quede abierta mientras se procesa
      expandedPosts.add(post.id);
      push(commentsRef, {
        name,
        text,
        timestamp: Date.now(),
        likes: {}
      }).catch(err => console.error("Error guardando comentario:", err));

      commentForm.reset();
    });
  } catch (err) {
    console.error("renderPost error:", err);
  }
}

/* ========================
   FUNCIONES AUXILIARES
======================== */

// Toggle reacción de post (likes/dislikes)
function toggleReaction(postId, target, opposite) {
  const postRef = ref(db, `recommendations/${postId}/${target}/${userId}`);
  const oppRef = ref(db, `recommendations/${postId}/${opposite}/${userId}`);

  get(postRef).then((snap) => {
    if (snap.exists()) {
      remove(postRef).catch(err => console.error("Error removing reaction:", err));
    } else {
      set(postRef, true).catch(err => console.error("Error setting reaction:", err));
      // eliminar la opuesta si existiera
      remove(oppRef).catch(() => {});
    }
  }).catch(err => console.error("Error reading reaction:", err));
}

// Toggle like para un comentario (heart)
function toggleCommentLike(postId, commentId) {
  const likeRef = ref(db, `recommendations/${postId}/comments/${commentId}/likes/${userId}`);
  get(likeRef).then((snap) => {
    if (snap.exists()) {
      remove(likeRef).catch(err => console.error("Error removing comment like:", err));
    } else {
      set(likeRef, true).catch(err => console.error("Error setting comment like:", err));
    }
  }).catch(err => console.error("Error reading comment like:", err));
}

// Render lista de comentarios (más viejos arriba)
function renderComments(post, container) {
  container.innerHTML = "";
  if (!post.comments) return;

  // Orden cronológico ascendente: más viejo primero
  const entries = Object.entries(post.comments)
    .map(([id, c]) => ({ id, ...c }))
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  entries.forEach(c => {
    const likesCount = c.likes ? Object.keys(c.likes).length : 0;
    const userLiked = c.likes && c.likes[userId];

    const div = document.createElement("div");
    div.className = "comment";

    // Estructura: header, texto, meta con corazón (estilo CSS asumido)
    div.innerHTML = `
      <div class="comment-header">
        <strong>${escapeHtml(c.name)}</strong>
        <span>${c.timestamp ? new Date(c.timestamp).toLocaleDateString("es-AR") : ""}</span>
      </div>
      <div class="comment-text">${escapeHtml(c.text)}</div>
      <div class="comment-meta">
        <button type="button" class="comment-like ${userLiked ? "active" : ""}">
          ❤️ <span class="count">${likesCount}</span>
        </button>
      </div>
    `;

    // Evitar bubbling del click y llamar toggleCommentLike
    const likeBtn = div.querySelector(".comment-like");
    likeBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      toggleCommentLike(post.id, c.id);
    });

    // Prevenir que un enter accidental en inputs haga toggle global
    const inputs = div.querySelectorAll("input, textarea, button");
    inputs.forEach(inp => inp.addEventListener("click", (e) => e.stopPropagation()));

    container.appendChild(div);
  });
}

// escape simple para prevenir inyección
function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
