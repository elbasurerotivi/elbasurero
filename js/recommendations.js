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
    comments: {}
  });

  form.reset();
});

// Guardamos qué posts tienen comentarios abiertos
let openComments = new Set();

/* ========================
   MAPA DE POSTS (para FLIP)
======================== */
const postMap = new Map();

/* Crear nodo de post */
function createPostElement(post) {
  const el = document.createElement("div");
  el.className = "recommend-post";

  el.innerHTML = `
    <div class="post-header">
      <strong class="post-author"></strong>
      <span class="post-time"></span>
    </div>
    <div class="post-text"></div>
    <div class="post-actions">
      <button type="button" class="like-btn">❤️ <span class="like-count">0</span></button>
      <button type="button" class="toggle-comments">💬 Comentarios (<span class="comments-count">0</span>)</button>
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

  const authorEl = el.querySelector(".post-author");
  const timeEl = el.querySelector(".post-time");
  const textEl = el.querySelector(".post-text");
  const likeBtn = el.querySelector(".like-btn");
  const likeCountEl = el.querySelector(".like-count");
  const toggleBtn = el.querySelector(".toggle-comments");
  const commentsCountEl = el.querySelector(".comments-count");
  const commentsSection = el.querySelector(".comments-section");
  const commentsListEl = el.querySelector(".comments-list");
  const commentForm = el.querySelector(".comment-form");

  // Evitar cierre accidental
  commentsSection.addEventListener("click", (e) => e.stopPropagation());

  // Toggle comentarios
  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = commentsSection.style.display === "block";
    commentsSection.style.display = isOpen ? "none" : "block";
    if (!isOpen) openComments.add(post.id);
    else openComments.delete(post.id);
  });

  // Nuevo comentario
  commentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const name = commentForm.querySelector(".comment-name").value.trim() || "Anónimo";
    const text = commentForm.querySelector(".comment-text").value.trim();
    if (!text) return;
    const commentsRef = ref(db, `recommendations/${post.id}/comments`);
    push(commentsRef, { name, text, timestamp: Date.now(), likes: {} });
    commentForm.reset();
    openComments.add(post.id);
  });

  // Like en post
  likeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const likeRef = ref(db, `recommendations/${post.id}/likes/${userId}`);
    get(likeRef).then((snap) => {
      if (snap.exists()) return remove(likeRef);
      return set(likeRef, true);
    }).then(() => {
      highlightPost(el);
      setTimeout(() => scrollToPost(el), 380);
    });
  });

  return {
    el,
    authorEl,
    timeEl,
    textEl,
    likeBtn,
    likeCountEl,
    toggleBtn,
    commentsCountEl,
    commentsSection,
    commentsListEl,
    commentForm
  };
}

/* Actualizar nodo existente */
function updatePostElement(obj, post) {
  obj.authorEl.textContent = post.name || "Anónimo";
  obj.timeEl.textContent = post.timestamp ? new Date(post.timestamp).toLocaleString("es-AR") : "";
  obj.textEl.textContent = post.text || "";

  const likesCount = post.likes ? Object.keys(post.likes).length : 0;
  obj.likeCountEl.textContent = likesCount;
  const userLiked = post.likes && post.likes[userId];
  obj.likeBtn.classList.toggle("active", !!userLiked);

  const commentsCount = post.comments ? Object.keys(post.comments).length : 0;
  obj.commentsCountEl.textContent = commentsCount;

  const isOpen = openComments.has(post.id);
  obj.commentsSection.style.display = isOpen ? "block" : "none";

  renderCommentsForPost(post, obj.commentsListEl);
}

/* Render comentarios */
function renderCommentsForPost(post, container) {
  container.innerHTML = "";
  if (!post.comments) return;

  const entries = Object.entries(post.comments)
    .map(([id, c]) => ({ id, ...c }))
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  entries.forEach(c => {
    const likesCount = c.likes ? Object.keys(c.likes).length : 0;
    const userLiked = c.likes && c.likes[userId];

    const d = document.createElement("div");
    d.className = "comment";
    d.innerHTML = `
      <div class="comment-header"><strong>${escapeHtml(c.name)}</strong></div>
      <div class="comment-text">${escapeHtml(c.text)}</div>
      <div class="comment-meta">
        <button type="button" class="comment-like ${userLiked ? "active" : ""}">❤️ <span class="count">${likesCount}</span></button>
      </div>
    `;
    d.querySelector(".comment-like").addEventListener("click", (ev) => {
      ev.stopPropagation();
      const likeRef = ref(db, `recommendations/${post.id}/comments/${c.id}/likes/${userId}`);
      get(likeRef).then((snap) => {
        if (snap.exists()) return remove(likeRef);
        return set(likeRef, true);
      });
    });

    container.appendChild(d);
  });
}

/* ====== FLIP: actualizar con animación ====== */
function updatePostsWithFLIP(posts) {
  const container = recList;
  const prevRects = new Map();
  postMap.forEach((obj, id) => prevRects.set(id, obj.el.getBoundingClientRect()));

  posts.forEach(post => {
    if (!postMap.has(post.id)) {
      const obj = createPostElement(post);
      postMap.set(post.id, obj);
      container.appendChild(obj.el);
      updatePostElement(obj, post);
    } else {
      const obj = postMap.get(post.id);
      updatePostElement(obj, post);
    }
  });

  posts.forEach(post => {
    const obj = postMap.get(post.id);
    if (obj.el.parentNode !== container || container.lastChild !== obj.el) {
      container.appendChild(obj.el);
    }
  });

  const newRects = new Map();
  posts.forEach(post => newRects.set(post.id, postMap.get(post.id).el.getBoundingClientRect()));

  posts.forEach(post => {
    const el = postMap.get(post.id).el;
    const prev = prevRects.get(post.id);
    const next = newRects.get(post.id);
    if (prev) {
      const dx = prev.left - next.left;
      const dy = prev.top - next.top;
      if (dx || dy) {
        el.style.transition = "none";
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        el.getBoundingClientRect();
        el.style.transition = "transform 350ms ease, opacity 350ms ease";
        el.style.transform = "";
        el.addEventListener("transitionend", () => { el.style.transition = ""; }, { once: true });
      }
    } else {
      el.style.opacity = "0";
      requestAnimationFrame(() => {
        el.style.transition = "opacity 300ms ease";
        el.style.opacity = "1";
      });
    }
  });
}

/* Helpers */
function highlightPost(postEl) {
  postEl.classList.add("highlight");
  setTimeout(() => postEl.classList.remove("highlight"), 1800);
}
function scrollToPost(postEl) {
  postEl.scrollIntoView({ behavior: "smooth", block: "center" });
}
function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}

/* ========================
   ESCUCHAR POSTS
======================== */
onValue(recommendationsRef, (snapshot) => {
  const posts = [];
  snapshot.forEach((child) => posts.push({ id: child.key, ...child.val() }));
  posts.sort((a, b) => {
    const likesA = Object.keys(a.likes || {}).length;
    const likesB = Object.keys(b.likes || {}).length;
    if (likesB !== likesA) return likesB - likesA;
    return (b.timestamp || 0) - (a.timestamp || 0);
  });
  updatePostsWithFLIP(posts);
});
