import { auth, db, ref, push, onValue, set, remove, get } from "./firebase-config.js";

// Crear un identificador temporal si el usuario no está logueado
let userId = localStorage.getItem("userId");
if (!userId) {
  userId = "user_" + Math.random().toString(36).substring(2, 9);
  localStorage.setItem("userId", userId);
}

const form = document.getElementById("recommend-form");
const recText = document.getElementById("rec-text");
const recList = document.getElementById("recommend-list");

const recommendationsRef = ref(db, "recommendations");

/* ========================
   ENVIAR NUEVA RECOMENDACIÓN
======================== */
form.addEventListener("submit", (e) => {
  e.preventDefault();
  accionProtegida(async () => {
    const user = auth.currentUser;
    let name = "Anónimo";
    if (user) {
      if (user.displayName) name = user.displayName;
      else {
        const userRef = ref(db, `users/${user.uid}`);
        const snap = await get(userRef);
        if (snap.exists()) name = snap.val().username || "Anónimo";
      }
    }
    const text = recText.value.trim();
    if (!text) return;
    push(recommendationsRef, {
      name,
      text,
      timestamp: Date.now(),
      likes: {},
      comments: {},
    });
    form.reset();
  });
});

/* ========================
   MOSTRAR RECOMENDACIONES
======================== */
let openComments = new Set();

onValue(recommendationsRef, (snapshot) => {
  const posts = [];
  snapshot.forEach((child) => posts.push({ id: child.key, ...child.val() }));

  // Ordenar por likes y fecha
  posts.sort((a, b) => {
    const la = Object.keys(a.likes || {}).length;
    const lb = Object.keys(b.likes || {}).length;
    return lb - la || b.timestamp - a.timestamp;
  });

  recList.innerHTML = "";

  if (posts.length === 0) {
    recList.innerHTML = "<p>No hay recomendaciones todavía. ¡Sé el primero en publicar!</p>";
  } else {
    posts.forEach((post) => renderPost(post));
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
      <strong>${post.name}</strong>
      <span>${new Date(post.timestamp).toLocaleString("es-AR")}</span>
    </div>

    <p class="post-text">${post.text}</p>

    <div class="post-actions">
      <div class="like-wrapper">
        <button class="like-btn ${userLiked ? "active" : ""}">❤️</button>
        <span class="like-count ${userLiked ? "active" : ""}">${likesCount}</span>
      </div>
      <button class="toggle-comments">💬 Comentarios (${commentsCount})</button>
    </div>

    <div class="comments-section" style="display:${isOpen ? "block" : "none"};">
      <div class="comments-list"></div>
      <form class="comment-form">
        <input type="text" class="comment-text" placeholder="Escribe un comentario" maxlength="300" required>
        <button type="submit">Comentar</button>
      </form>
    </div>
  `;

  // LIKE DEL POST
  const likeBtn = postEl.querySelector(".like-btn");
  const likeCount = postEl.querySelector(".like-count");
  likeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    accionProtegida(() => {
      const uid = auth.currentUser ? auth.currentUser.uid : userId;
      const likeRef = ref(db, `recommendations/${post.id}/likes/${uid}`);
      get(likeRef).then((snap) => {
        if (snap.exists()) {
          remove(likeRef);
          likeBtn.classList.remove("active");
          likeCount.classList.remove("active");
        } else {
          set(likeRef, true);
          likeBtn.classList.add("active");
          likeCount.classList.add("active");
        }
      });
    });
  });

  // MOSTRAR/OCULTAR COMENTARIOS
  const toggleBtn = postEl.querySelector(".toggle-comments");
  const commentsSection = postEl.querySelector(".comments-section");
  toggleBtn.addEventListener("click", () => {
    if (commentsSection.style.display === "none") {
      commentsSection.style.display = "block";
      openComments.add(post.id);
    } else {
      commentsSection.style.display = "none";
      openComments.delete(post.id);
    }
  });

  // RENDERIZAR COMENTARIOS
  const commentsList = postEl.querySelector(".comments-list");
  renderComments(post, commentsList);

  // FORMULARIO DE COMENTARIO
  const commentForm = postEl.querySelector(".comment-form");
  commentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    accionProtegida(async () => {
      const user = auth.currentUser;
      let name = "Anónimo";
      if (user?.displayName) name = user.displayName;
      const text = commentForm.querySelector(".comment-text").value.trim();
      if (!text) return;
      const commentsRef = ref(db, `recommendations/${post.id}/comments`);
      push(commentsRef, { name, text, timestamp: Date.now(), likes: {} });
      commentForm.reset();
    });
  });

  recList.appendChild(postEl);
}

/* ========================
   RENDERIZAR COMENTARIOS
======================== */
function renderComments(post, container) {
  container.innerHTML = "";
  if (!post.comments) return;

  Object.entries(post.comments)
    .sort((a, b) => a[1].timestamp - b[1].timestamp)
    .forEach(([commentId, c]) => {
      const likesCount = c.likes ? Object.keys(c.likes).length : 0;
      const userLiked = c.likes && c.likes[userId];
      const div = document.createElement("div");
      div.className = "comment";
      div.innerHTML = `
        <div class="comment-header"><strong>${c.name}</strong></div>
        <div class="comment-text">${c.text}</div>
        <div class="comment-meta">
          <div class="like-wrapper">
            <button class="comment-like ${userLiked ? "active" : ""}">❤️</button>
            <span class="like-count ${userLiked ? "active" : ""}">${likesCount}</span>
          </div>
        </div>
      `;

      // LIKE EN COMENTARIO
      const likeBtn = div.querySelector(".comment-like");
      const likeCount = div.querySelector(".like-count");
      likeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        accionProtegida(() => {
          const uid = auth.currentUser ? auth.currentUser.uid : userId;
          const likeRef = ref(db, `recommendations/${post.id}/comments/${commentId}/likes/${uid}`);
          get(likeRef).then((snap) => {
            if (snap.exists()) {
              remove(likeRef);
              likeBtn.classList.remove("active");
              likeCount.classList.remove("active");
            } else {
              set(likeRef, true);
              likeBtn.classList.add("active");
              likeCount.classList.add("active");
            }
          });
        });
      });

      container.appendChild(div);
    });
}
