// Importar Firebase desde tu config
import { db, ref, push, onValue, set, remove, get } from "./firebase-config.js";

// UID temporal para simular "usuario"
const userId = "user_" + Math.random().toString(36).substring(2, 9);

/* Estado local para mantener posts expandidos entre re-renders */
const expandedPosts = {};

/* ========================
   FORMULARIO
======================== */
const form = document.getElementById("recommend-form");
const recName = document.getElementById("rec-name");
const recText = document.getElementById("rec-text");
const recList = document.getElementById("recommend-list");

const recommendationsRef = ref(db, "recommendations");

// Publicar recomendación
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = recName.value.trim() || "Anónimo";
  const text = recText.value.trim();
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
======================== */
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

  recList.innerHTML = "";
  posts.forEach(renderPost);
}, (err) => console.error("onValue recommendations error:", err));

/* ========================
   RENDER DE UN POST
======================== */
function renderPost(post) {
  const postEl = document.createElement("div");
  postEl.className = "recommend-post";

  const likesCount = Object.keys(post.likes || {}).length;
  const dislikesCount = Object.keys(post.dislikes || {}).length;
  const userLiked = post.likes && post.likes[userId];
  const userDisliked = post.dislikes && post.dislikes[userId];
  const commentsCount = post.comments ? Object.keys(post.comments).length : 0;

  // Nota: botones con type="button" para evitar submit involuntario
  postEl.innerHTML = `
    <div class="post-header">
      <strong>${escapeHtml(post.name)}</strong>
      <span>${post.timestamp ? new Date(post.timestamp).toLocaleString("es-AR") : ""}</span>
    </div>
    <p class="post-text">${escapeHtml(post.text)}</p>
    <div class="post-actions">
      <button type="button" class="like-btn ${userLiked ? "active" : ""}">⬆️ ${likesCount}</button>
      <button type="button" class="dislike-btn ${userDisliked ? "active" : ""}">⬇️ ${dislikesCount}</button>
      <button type="button" class="toggle-comments">💬 Comentarios (${commentsCount})</button>
    </div>
    <div class="comments-section" style="display: none;">
      <div class="comments-list"></div>
      <form class="comment-form">
        <input type="text" class="comment-name" placeholder="Tu nombre" maxlength="30">
        <input type="text" class="comment-text" placeholder="Escribe un comentario" maxlength="300" required>
        <button type="submit">Comentar</button>
      </form>
    </div>
  `;

  // Agregar al DOM
  recList.appendChild(postEl);

  // Referencias
  const likeBtn = postEl.querySelector(".like-btn");
  const dislikeBtn = postEl.querySelector(".dislike-btn");
  const toggleBtn = postEl.querySelector(".toggle-comments");
  const commentsSection = postEl.querySelector(".comments-section");
  const commentsListEl = postEl.querySelector(".comments-list");
  const commentForm = postEl.querySelector(".comment-form");

  // Restaurar estado expandido si estaba abierto
  if (expandedPosts[post.id]) {
    commentsSection.style.display = "block";
  } else {
    commentsSection.style.display = "none";
  }

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

  // Toggle comentarios
  toggleBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    const isOpen = commentsSection.style.display === "block";
    commentsSection.style.display = isOpen ? "none" : "block";
    expandedPosts[post.id] = !isOpen;
    // actualizar texto con cantidad actual (se actualizará al re-render automático)
  });

  // Render comentarios (y crear botones ❤️ por comentario)
  renderComments(post, commentsListEl);

  // Manejar nuevo comentario
  commentForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const name = commentForm.querySelector(".comment-name").value.trim() || "Anónimo";
    const text = commentForm.querySelector(".comment-text").value.trim();
    if (!text) return;
    const commentsRef = ref(db, `recommendations/${post.id}/comments`);
    push(commentsRef, { name, text, timestamp: Date.now(), likes: {} })
      .catch(err => console.error("Error guardando comentario:", err));
    commentForm.reset();
    // opcional: mantener la sección abierta
    expandedPosts[post.id] = true;
  });
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

// Render lista de comentarios y botones ❤️ (preserva orden cronológico inverso)
function renderComments(post, container) {
  container.innerHTML = "";
  if (!post.comments) return;

  // Orden cronológico inverso (más nuevo arriba)
  const entries = Object.entries(post.comments)
    .map(([id, c]) => ({ id, ...c }))
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  entries.forEach(c => {
    const likesCount = c.likes ? Object.keys(c.likes).length : 0;
    const userLiked = c.likes && c.likes[userId];

    const div = document.createElement("div");
    div.className = "comment";
    // botón tipo button para no disparar submit
    div.innerHTML = `
      <div class="comment-text"><strong>${escapeHtml(c.name)}</strong>: ${escapeHtml(c.text)}</div>
      <div class="comment-meta">
        <button type="button" class="comment-like ${userLiked ? "active" : ""}">❤️ <span class="count">${likesCount}</span></button>
      </div>
    `;

    // Evitar que el click burbujee al padre que cambia visibilidad
    const likeBtn = div.querySelector(".comment-like");
    likeBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      toggleCommentLike(post.id, c.id);
    });

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
