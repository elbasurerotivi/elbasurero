import { auth, db, ref, push, onValue, set, remove, get } from "./firebase-config.js";

// UID persistente para simular "usuario único" (para likes no autenticados)
let userId = localStorage.getItem("userId");
if (!userId) {
  userId = "user_" + Math.random().toString(36).substring(2, 9);
  localStorage.setItem("userId", userId);
}

/* ========================
   FORMULARIO
======================== */
const form = document.getElementById("recommend-form");
const recText = document.getElementById("rec-text");
const recList = document.getElementById("recommend-list");

const recommendationsRef = ref(db, "recommendations");

// Publicar recomendación
form.addEventListener("submit", (e) => {
  e.preventDefault();
  accionProtegida(() => {
    const user = auth.currentUser;
    let name = "Anónimo";
    if (user) {
      if (user.displayName) {
        name = user.displayName;
      } else {
        const userRef = ref(db, `users/${user.uid}`);
        get(userRef).then(snapshot => {
          if (snapshot.exists()) {
            name = snapshot.val().username || "Anónimo";
          }
        }).catch(err => console.error("Error obteniendo datos del usuario:", err));
      }
    }
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

  const likeBtn = postEl.querySelector(".like-btn");
  likeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    accionProtegida(() => {
      const uid = auth.currentUser ? auth.currentUser.uid : userId;
      const likeRef = ref(db, `recommendations/${post.id}/likes/${uid}`);
      get(likeRef).then((snap) => {
        if (snap.exists()) {
          remove(likeRef);
          likeBtn.classList.remove("active");
          likeBtn.nextElementSibling.classList.remove("active");
        } else {
          set(likeRef, true);
          likeBtn.classList.add("active");
          likeBtn.nextElementSibling.classList.add("active");
        }
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
  commentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    accionProtegida(async () => {
      const user = auth.currentUser;
      let name = "Anónimo";
      if (user) {
        if (user.displayName) {
          name = user.displayName;
        } else {
          const userRef = ref(db, `users/${user.uid}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            name = snapshot.val().username || "Anónimo";
          }
        }
      }
      const text = commentForm.querySelector(".comment-text").value.trim();
      if (!text) return;
      const commentsRef = ref(db, `recommendations/${post.id}/comments`);
      push(commentsRef, { name, text, timestamp: Date.now(), likes: {} });
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
      <div class="comment-header"><strong>${c.name}</strong></div>
      <div class="comment-text">${c.text}</div>
      <div class="comment-meta">
        <div class="like-wrapper">
          <button type="button" class="comment-like ${userLiked ? "active" : ""}">❤️</button>
          <span class="like-count ${userLiked ? "active" : ""}">${likesCount}</span>
        </div>
      </div>
    `;

    div.querySelector(".comment-like").addEventListener("click", (e) => {
      e.stopPropagation();
      accionProtegida(() => {
        const uid = auth.currentUser ? auth.currentUser.uid : userId;
        const likeRef = ref(db, `recommendations/${post.id}/comments/${commentId}/likes/${uid}`);
        get(likeRef).then((snap) => {
          if (snap.exists()) {
            remove(likeRef);
            e.target.classList.remove("active");
            e.target.nextElementSibling.classList.remove("active");
          } else {
            set(likeRef, true);
            e.target.classList.add("active");
            e.target.nextElementSibling.classList.add("active");
          }
        });
      });
    });

    container.appendChild(div);
  });
}