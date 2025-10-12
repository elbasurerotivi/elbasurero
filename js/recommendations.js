import { db, auth, ref, onValue, push, update, remove, get, set, onAuthStateChanged } from "./firebase-config.js";

let currentCategory = "movies";
let recommendations = [];
let unsubscribe = null;
let openComments = new Set();
let userId = localStorage.getItem("userId") || "user_" + Math.random().toString(36).substring(2, 9);
localStorage.setItem("userId", userId);

onAuthStateChanged(auth, (user) => {
  if (user) {
    userId = user.uid;
    localStorage.setItem("userId", userId);
  }
});

function getCategoryRef() {
  return ref(db, currentCategory === "movies" ? "recommendations" : "music");
}

const form = document.getElementById("recommend-form");
const textarea = document.getElementById("rec-text");
const suggestionsContainer = document.getElementById("suggestions");
const tabButtons = document.querySelectorAll(".tab-btn");
const lists = {
  movies: document.getElementById("recommend-list-movies"),
  music: document.getElementById("recommend-list-music"),
};

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentCategory = btn.dataset.category;
    Object.keys(lists).forEach((key) => {
      lists[key].style.display = key === currentCategory ? "block" : "none";
    });
    if (unsubscribe) unsubscribe();
    unsubscribe = onValue(getCategoryRef(), renderRecommendations);
  });
});

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

function renderRecommendations(snapshot) {
  recommendations = [];
  const posts = [];
  snapshot.forEach((child) => {
    const postData = child.val();
    recommendations.push({ id: child.key, ...postData });
    posts.push({ id: child.key, ...postData });
  });

  posts.sort((a, b) => {
    const likesA = Object.keys(a.likes || {}).length;
    const likesB = Object.keys(b.likes || {}).length;
    if (likesB !== likesA) return likesB - likesA;
    return b.timestamp - a.timestamp;
  });

  const container = lists[currentCategory];
  container.innerHTML = "";
  if (posts.length === 0) {
    container.innerHTML = "<p>No hay recomendaciones todavía. ¡Sé el primero en publicar!</p>";
  } else {
    posts.forEach((post) => renderPost(post, container));
  }
}

function renderPost(post, container) {
  const existingPost = container.querySelector(`[data-post-id="${post.id}"]`);
  const likesCount = Object.keys(post.likes || {}).length;
  const commentsCount = post.comments ? Object.keys(post.comments).length : 0;
  const userLiked = post.likes && post.likes[userId];

  let postElement;
  if (existingPost) {
    // Actualizar post existente
    postElement = existingPost;
    const likeBtn = postElement.querySelector(".like-btn");
    const likeCount = postElement.querySelector(".like-count");
    const commentBtn = postElement.querySelector(".toggle-comments");
    likeBtn.className = `like-btn ${userLiked ? "active" : ""}`;
    likeCount.className = `like-count ${userLiked ? "active" : ""}`;
    likeCount.textContent = likesCount;
    commentBtn.textContent = `💬 Comentarios (${commentsCount})`;
  } else {
    // Crear nuevo post
    postElement = document.createElement("div");
    postElement.className = "recommend-post";
    postElement.dataset.postId = post.id;
    postElement.innerHTML = `
      <div class="post-header">
        <strong>${post.name}</strong>
        <span>${new Date(post.timestamp).toLocaleString("es-AR")}</span>
      </div>
      <p class="post-text">${linkifyAndEscape(post.text)}</p>
      <div class="post-actions">
        <div class="like-wrapper">
          <button class="like-btn ${userLiked ? "active" : ""}">❤️</button>
          <span class="like-count ${userLiked ? "active" : ""}">${likesCount}</span>
        </div>
        <button class="toggle-comments">💬 Comentarios (${commentsCount})</button>
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

  likeBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const user = auth.currentUser;
    if (!user) return alert("Debes iniciar sesión para dar like.");
    const uid = user.uid;
    const likeRef = ref(db, `${currentCategory === "movies" ? "recommendations" : "music"}/${post.id}/likes/${uid}`);
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

  if (openComments.has(post.id)) {
    renderComments(post.id, commentsContainer);
  }
}

function renderComments(postId, container) {
  const commentsRef = ref(db, `${currentCategory === "movies" ? "recommendations" : "music"}/${postId}/comments`);

  onValue(commentsRef, (snapshot) => {
    // Preservar el formulario si ya existe
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

    // Actualizar solo la lista de comentarios
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
        <div class="comment-header"><strong>${comment.name}</strong></div>
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
        const likeRef = ref(db, `${currentCategory === "movies" ? "recommendations" : "music"}/${postId}/comments/${child.key}/likes/${uid}`);
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

      commentsList.appendChild(div);
    });

    // Reemplazar solo la lista de comentarios, preservando el formulario
    const existingList = container.querySelector(".comments-list");
    if (existingList) {
      existingList.replaceWith(commentsList);
    } else {
      container.insertBefore(commentsList, form);
    }
  }, { onlyOnce: false });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return alert("Debes iniciar sesión para publicar.");

  const text = textarea.value.trim();
  if (!text) return;

  await push(getCategoryRef(), {
    name: user.displayName || "Anónimo",
    text,
    timestamp: Date.now(),
    likes: {},
    comments: {},
  });

  textarea.value = "";
  suggestionsContainer.innerHTML = "";
  suggestionsContainer.style.display = "none";
});

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

textarea.addEventListener("input", () => {
  const value = textarea.value.trim().toLowerCase();
  const submitBtn = form.querySelector('button[type="submit"]');
  if (value.length < 3) {
    suggestionsContainer.innerHTML = '';
    suggestionsContainer.style.display = 'none';
    submitBtn.disabled = false;
    submitBtn.style.backgroundColor = '';
    return;
  }

  const similar = recommendations
    .filter((rec) => {
      const recLower = rec.text.toLowerCase();
      const dist = leveshteinDistance(value, recLower);
      return dist < 5 || recLower.includes(value);
    })
    .sort((a, b) => {
      return leveshteinDistance(value, a.text.toLowerCase()) - leveshteinDistance(value, b.text.toLowerCase());
    });

  suggestionsContainer.innerHTML = '';
  if (similar.length > 0) {
    suggestionsContainer.style.display = 'block';
    const warning = document.createElement('div');
    warning.className = 'suggestion-warning';
    warning.textContent = 'Tu recomendación ya fue hecha';
    suggestionsContainer.appendChild(warning);

    similar.forEach((rec) => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.innerHTML = linkifyAndEscape(rec.text);
      suggestionsContainer.appendChild(item);
      item.addEventListener("click", () => {
        textarea.value = rec.text;
        suggestionsContainer.innerHTML = "";
      });
    });

    submitBtn.disabled = true;
    submitBtn.style.backgroundColor = 'gray';
  } else {
    suggestionsContainer.style.display = 'none';
    submitBtn.disabled = false;
    submitBtn.style.backgroundColor = '';
  }
});

unsubscribe = onValue(getCategoryRef(), renderRecommendations);

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
}