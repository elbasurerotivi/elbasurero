// Importar Firebase desde tu config
import { db, ref, push, onValue, set, remove, get } from "./firebase-config.js";

// UID persistente para simular "usuario único"
let userId = localStorage.getItem("userId");
if (!userId) {
  userId = "user_" + Math.random().toString(36).substring(2, 9);
  localStorage.setItem("userId", userId);
}


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
  });

  form.reset();
});

// Guardamos qué posts tienen comentarios abiertos
let openComments = new Set();

/* ========================
   MOSTRAR RECOMENDACIONES
======================== */
onValue(recommendationsRef, (snapshot) => {
  const posts = [];
  snapshot.forEach((child) => {
    posts.push({ id: child.key, ...child.val() });
  });

  // Ordenar: más likes primero, después más reciente
  posts.sort((a, b) => {
    const likesA = Object.keys(a.likes || {}).length;
    const likesB = Object.keys(b.likes || {}).length;
    if (likesB !== likesA) return likesB - likesA;
    return b.timestamp - a.timestamp;
  });

  // Render posts
  recList.innerHTML = "";
  if (posts.length === 0) {
    recList.innerHTML = "<p>No hay recomendaciones todavía. ¡Sé el primero en publicar!</p>";
  } else {
    posts.forEach(renderPost);
  }
});

/* ========================
   RENDER POST
======================== */
function renderPost(post) {
  const postEl = document.createElement("div");
  postEl.className = "recommend-post";

  const likesCount = Object.keys(post.likes || {}).length;
  const dislikesCount = Object.keys(post.dislikes || {}).length;
  const commentsCount = post.comments ? Object.keys(post.comments).length : 0;
  const userLiked = post.likes && post.likes[userId];
  const userDisliked = post.dislikes && post.dislikes[userId];

  // Si estaba abierto antes, mantenerlo
  const isOpen = openComments.has(post.id);

  postEl.innerHTML = `
    <div class="post-header">
      <strong>${post.name}</strong>
      <span>${new Date(post.timestamp).toLocaleString("es-AR")}</span>
    </div>
    <p class="post-text">${post.text}</p>
    <div class="post-actions">
      <button class="like-btn ${userLiked ? "active" : ""}">⬆️ ${likesCount}</button>
      <button class="dislike-btn ${userDisliked ? "active" : ""}">⬇️ ${dislikesCount}</button>
      <button class="toggle-comments">💬 Comentarios (${commentsCount})</button>
    </div>
    <div class="comments-section" style="display:${isOpen ? "block" : "none"};">
      <div class="comments-list"></div>
      <form class="comment-form">
        <input type="text" class="comment-name" placeholder="Tu nombre" maxlength="30">
        <input type="text" class="comment-text" placeholder="Escribe un comentario" maxlength="300" required>
        <button type="submit">Comentar</button>
      </form>
    </div>
  `;

  // Botón mostrar/ocultar comentarios
  const toggleBtn = postEl.querySelector(".toggle-comments");
  const commentsSection = postEl.querySelector(".comments-section");

  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (commentsSection.style.display === "none") {
      commentsSection.style.display = "block";
      openComments.add(post.id);   // marcar como abierto
    } else {
      commentsSection.style.display = "none";
      openComments.delete(post.id); // marcar como cerrado
    }
  });

  // Render comentarios
  renderComments(post, postEl.querySelector(".comments-list"));

  // Nuevo comentario
  const commentForm = postEl.querySelector(".comment-form");
  commentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = commentForm.querySelector(".comment-name").value.trim() || "Anónimo";
    const text = commentForm.querySelector(".comment-text").value.trim();
    if (!text) return;

    const commentsRef = ref(db, `recommendations/${post.id}/comments`);
    push(commentsRef, {
      name,
      text,
      timestamp: Date.now(),
      likes: {}
    });

    commentForm.reset();
  });

  recList.appendChild(postEl);
}


/* ========================
   FUNCIONES AUXILIARES
======================== */
function toggleReaction(postId, target, opposite) {
  const postRef = ref(db, `recommendations/${postId}/${target}/${userId}`);
  const oppRef = ref(db, `recommendations/${postId}/${opposite}/${userId}`);

  get(postRef).then((snap) => {
    if (snap.exists()) {
      remove(postRef); // quitar reacción
    } else {
      set(postRef, true); // dar reacción
      remove(oppRef); // quitar opuesta
    }
  });
}

function renderComments(post, container) {
  container.innerHTML = "";
  if (!post.comments) return;

  const comments = Object.entries(post.comments).sort((a, b) => a[1].timestamp - b[1].timestamp);

  comments.forEach(([commentId, c]) => {
    const likesCount = c.likes ? Object.keys(c.likes).length : 0;
    const userLiked = c.likes && c.likes[userId];

    const div = document.createElement("div");
    div.className = "comment";
    div.innerHTML = `
      <div class="comment-header"><strong>${c.name}</strong></div>
      <div class="comment-text">${c.text}</div>
      <div class="comment-meta">
        <button type="button" class="comment-like ${userLiked ? "active" : ""}">
          ❤️ <span class="count">${likesCount}</span>
        </button>
      </div>
    `;

    // Evento: ❤️ en comentario
    div.querySelector(".comment-like").addEventListener("click", (e) => {
      e.stopPropagation();
      const likeRef = ref(db, `recommendations/${post.id}/comments/${commentId}/likes/${userId}`);
      get(likeRef).then((snap) => {
        if (snap.exists()) {
          remove(likeRef);
        } else {
          set(likeRef, true);
        }
      });
    });

    container.appendChild(div);
  });
}
