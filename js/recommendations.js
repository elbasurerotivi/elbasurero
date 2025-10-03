// js/recommendations.js
import { auth, db, ref, push, onValue, set, remove, get } from "./firebase-config.js";

// UID persistente para simular "usuario único" (para likes no autenticados)
let userId = localStorage.getItem("userId");
if (!userId) {
  userId = "user_" + Math.random().toString(36).substring(2, 9);
  localStorage.setItem("userId", userId);
}

const form = document.getElementById("recommend-form");
const recText = document.getElementById("rec-text");
const recList = document.getElementById("recommend-list");

const recommendationsRef = ref(db, "recommendations");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  accionProtegida(async () => {
    // Obtener nombre de usuario desde la base de datos
    const userRef = ref(db, `users/${auth.currentUser.uid}`);
    const snapshot = await get(userRef);
    const username = snapshot.exists() ? snapshot.val().username || "Anónimo" : "Anónimo";

    const text = recText.value.trim();
    if (!text) return;
    await push(recommendationsRef, {
      name: username,
      text,
      timestamp: Date.now(),
      likes: {},
      comments: {}
    });
    form.reset();
  });
});

let openComments = new Set();

onValue(recommendationsRef, (snapshot) => {
  const posts = [];
  snapshot.forEach((child) => {
    posts.push({ id: child.key, ...child.val() });
  });

  posts.sort((a, b) => {
    const likesA = Object.keys(a.likes || {}).length;
    const likesB = Object.keys(b.likes || {}).length;
    if (likesB !== likesA) return likesB - likesA;
    return b.timestamp - a.timestamp;
  });

  recList.innerHTML = "";
  if (posts.length === 0) {
    recList.innerHTML = "<p>No hay recomendaciones todavía. ¡Sé el primero en publicar!</p>";
  } else {
    posts.forEach(renderPost);
  }
});

function renderPost(post) {
  const postEl = document.createElement("div");
  postEl.className = "recommend-post";

  const likesCount = Object.keys(post.likes || {}).length;
  const commentsCount = post.comments ? Object.keys(post.comments).length : 0;
  const userLiked = post.likes && post.likes[userId];

  const isOpen = openComments.has(post.id);

  postEl.innerHTML = `
    <div class="post-header">
      <strong>${escapeHtml(post.name)}</strong>
      <span>${new Date(post.timestamp).toLocaleString("es-AR")}</span>
    </div>
    <p class="post-text">${escapeHtml(post.text)}</p>
    <div class="post-actions">
      <button class="like-btn ${userLiked ? "active" : ""}">❤️ ${likesCount}</button>
      <button class="toggle-comments">💬 Comentarios (${commentsCount})</button>
    </div>
    <div class="comments-section" style="display:${isOpen ? "block" : "none"};">
      <div class="comments-list"></div>
      <form class="comment-form">
        <input type="text" class="comment-text" placeholder="Escribe un comentario" maxlength="300" required>
        <button type="submit" class="btn btn-primary">Comentar</button>
      </form>
    </div>
  `;

  const likeBtn = postEl.querySelector(".like-btn");
  likeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    accionProtegida(() => {
      const likeRef = ref(db, `recommendations/${post.id}/likes/${userId}`);
      get(likeRef).then((snap) => {
        if (snap.exists()) remove(likeRef);
        else set(likeRef, true);
      });
    });
  });

  const toggleBtn = postEl.querySelector(".toggle-comments");
  const commentsSection = postEl.querySelector(".comments-section");

  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (commentsSection.style.display === "none") {
      commentsSection.style.display = "block";
      openComments.add(post.id);
    } else {
      commentsSection.style.display = "none";
      openComments.delete(post.id);
    }
  });

  renderComments(post, postEl.querySelector(".comments-list"));

  const commentForm = postEl.querySelector(".comment-form");
  commentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    accionProtegida(async () => {
      // Obtener nombre de usuario desde la base de datos
      const userRef = ref(db, `users/${auth.currentUser.uid}`);
      const snapshot = await get(userRef);
      const username = snapshot.exists() ? snapshot.val().username || "Anónimo" : "Anónimo";

      const text = commentForm.querySelector(".comment-text").value.trim();
      if (!text) return;
      const commentsRef = ref(db, `recommendations/${post.id}/comments`);
      await push(commentsRef, { name: username, text, timestamp: Date.now(), likes: {} });
      commentForm.reset();
    });
  });

  postEl.style.opacity = "0";
  postEl.style.transform = "translateY(20px)";
  requestAnimationFrame(() => {
    postEl.style.transition = "all 0.4s ease";
    postEl.style.opacity = "1";
    postEl.style.transform = "translateY(0)";
  });

  recList.appendChild(postEl);
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
      <div class="comment-header"><strong>${escapeHtml(c.name)}</strong></div>
      <div class="comment-text">${escapeHtml(c.text)}</div>
      <div class="comment-meta">
        <button type="button" class="comment-like ${userLiked ? "active" : ""}">
          ❤️ <span class="count">${likesCount}</span>
        </button>
      </div>
    `;

    div.querySelector(".comment-like").addEventListener("click", (e) => {
      e.stopPropagation();
      accionProtegida(() => {
        const likeRef = ref(db, `recommendations/${post.id}/comments/${commentId}/likes/${userId}`);
        get(likeRef).then((snap) => {
          if (snap.exists()) remove(likeRef);
          else set(likeRef, true);
        });
      });
    });

    container.appendChild(div);
  });
}

function highlightPost(postEl) {
  postEl.classList.add("highlight");
  setTimeout(() => postEl.classList.remove("highlight"), 2000); // 2s resaltado
}

function scrollToPost(postEl) {
  postEl.scrollIntoView({ behavior: "smooth", block: "center" });
}

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

function escapeHtml(str) {
  if (!str && str !== 0) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}