// Importar Firebase desde tu config
import { db, ref, push, onValue, set, remove, get } from "./firebase-config.js";

// UID temporal para simular "usuario"
const userId = "user_" + Math.random().toString(36).substring(2, 9);

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

  recList.innerHTML = "";
  posts.forEach(renderPost);
});

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
    <div class="comments-section" style="display:none;">
      <div class="comments-list"></div>
      <form class="comment-form">
        <input type="text" class="comment-name" placeholder="Tu nombre" maxlength="30">
        <input type="text" class="comment-text" placeholder="Escribe un comentario" maxlength="300" required>
        <button type="submit">Comentar</button>
      </form>
    </div>
  `;

  // Botón Like
  postEl.querySelector(".like-btn").addEventListener("click", () => {
    toggleReaction(post.id, "likes", "dislikes");
  });

  // Botón Dislike
  postEl.querySelector(".dislike-btn").addEventListener("click", () => {
    toggleReaction(post.id, "dislikes", "likes");
  });

  // Botón mostrar comentarios
  const toggleBtn = postEl.querySelector(".toggle-comments");
  const commentsSection = postEl.querySelector(".comments-section");
  toggleBtn.addEventListener("click", () => {
    commentsSection.style.display = commentsSection.style.display === "none" ? "block" : "none";
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
      likes: {} // 👈 cada comentario tendrá reacciones ❤️
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
      set(postRef, true); // agregar reacción
      remove(oppRef);     // quitar la opuesta
    }
  });
}

function renderComments(post, container) {
  container.innerHTML = "";
  if (!post.comments) return;

  const comments = Object.entries(post.comments).sort((a, b) => b[1].timestamp - a[1].timestamp);
  comments.forEach(([id, c]) => {
    const likesCount = c.likes ? Object.keys(c.likes).length : 0;
    const userLiked = c.likes && c.likes[userId];

    const div = document.createElement("div");
    div.className = "comment";
    div.innerHTML = `
      <strong>${c.name}</strong>: ${c.text}
      <button class="comment-like ${userLiked ? "active" : ""}">❤️ ${likesCount}</button>
    `;

    // Reacción ❤️ en comentario
    const likeBtn = div.querySelector(".comment-like");
    likeBtn.addEventListener("click", () => {
      const likeRef = ref(db, `recommendations/${post.id}/comments/${id}/likes/${userId}`);
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
