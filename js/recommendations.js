import { db, auth, ref, onValue, push, update, remove, get, set, onAuthStateChanged } from "./firebase-config.js";

let currentCategory = "movies-pending";
let recommendations = []; // Para sugerencias: se carga con pending + completed de la cat actual
let unsubscribe = null;
let openComments = new Set();
let userId = localStorage.getItem("userId") || "user_" + Math.random().toString(36).substring(2, 9);
localStorage.setItem("userId", userId);
let isAdmin = false;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    userId = user.uid;
    localStorage.setItem("userId", userId);
    const roleSnap = await get(ref(db, `users/${user.uid}/role`));
    isAdmin = roleSnap.val() === 'admin';
    await loadAllForSuggestions(); // Carga inicial
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

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentCategory = btn.dataset.category;
    Object.keys(lists).forEach((key) => {
      lists[key].style.display = key === currentCategory ? "block" : "none";
    });
    if (unsubscribe) unsubscribe();
    loadAllForSuggestions(); // Recarga sugerencias al cambiar tab
    const refToUse = currentCategory.includes('completed') ? getCompletedRef() : getPendingRef();
    unsubscribe = onValue(refToUse, (snapshot) => {
      renderRecommendations(snapshot, currentCategory.includes('completed'));
    });
  });
});

async function loadAllForSuggestions() {
  const catKey = currentCategory.split('-')[0]; // 'movies' o 'music'
  const pendingSnap = await get(ref(db, catKey === "movies" ? "recommendations" : "music"));
  const completedSnap = await get(ref(db, catKey === "movies" ? "completed_recommendations" : "completed_music"));
  recommendations = [];
  pendingSnap.forEach(child => recommendations.push({ id: child.key, ...child.val() }));
  completedSnap.forEach(child => recommendations.push({ id: child.key, ...child.val() }));
  console.log("Recomendaciones cargadas para sugerencias (restaurado):", recommendations.length);
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

function renderRecommendations(snapshot, isCompleted = false) {
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
      <div class="post-actions">
        <div class="like-wrapper">
          <button class="like-btn ${userLiked ? "active" : ""}">❤️</button>
          <span class="like-count ${userLiked ? "active" : ""}">${likesCount}</span>
        </div>
        <button class="toggle-comments">Comentarios (${commentsCount})</button>
        ${isAdmin ? `<button class="complete-btn">Marcar Completada</button>` : ''}
        ${isAdmin ? `<button class="delete-btn">Eliminar Post</button>` : ''}
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

  const pendingRef = getPendingRef();
  await push(pendingRef, {
    name: user.displayName || "Anónimo",
    text,
    timestamp: Date.now(),
    likes: {},
    comments: {},
  });

  textarea.value = "";
  suggestionsContainer.innerHTML = "";
  suggestionsContainer.style.display = "none";
  await loadAllForSuggestions(); // Actualiza array después de post
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

function isSequelVariation(str1, str2) {
  function getBaseAndNum(s) {
    const match = s.match(/(.*?)(\s*\d+)?$/);
    return {
      base: match[1].trim().toLowerCase(),
      num: match[2] ? parseInt(match[2].trim(), 10) : null
    };
  }
  const { base: b1, num: n1 } = getBaseAndNum(str1);
  const { base: b2, num: n2 } = getBaseAndNum(str2);
  return b1 === b2 && n1 !== n2;
}

textarea.addEventListener("input", async () => {
  const valueRaw = textarea.value.trim();
  const value = valueRaw.toLowerCase();
  const submitBtn = form.querySelector('button[type="submit"]');
  if (valueRaw.length < 3) {
    suggestionsContainer.innerHTML = '';
    suggestionsContainer.style.display = 'none';
    submitBtn.disabled = false;
    submitBtn.style.backgroundColor = '';
    return;
  }

  await loadAllForSuggestions(); // Fresco siempre
  const similar = recommendations
    .filter((rec) => {
      const recLower = (rec.text || '').toLowerCase();
      const dist = levenshteinDistance(value, recLower);
      const includesInRec = recLower.includes(value);
      const includesRecInValue = value.includes(recLower); // Bidireccional para parciales
      const isSimilar = dist < 5 || includesInRec || includesRecInValue;
      console.log(`Comparando "${valueRaw}" con "${rec.text}": dist=${dist}, includesInRec=${includesInRec}, includesRecInValue=${includesRecInValue}, sequel=${isSequelVariation(value, recLower)}`); // Debug: pega esto!
      return isSimilar && !isSequelVariation(value, recLower);
    })
    .sort((a, b) => levenshteinDistance(value, a.text.toLowerCase()) - levenshteinDistance(value, b.text.toLowerCase()));

  console.log("Similares encontrados:", similar.length, similar.map(r => r.text)); // Debug

  suggestionsContainer.innerHTML = '';
  if (similar.length > 0) {
    suggestionsContainer.style.display = 'block';
    const warning = document.createElement('div');
    warning.className = 'suggestion-warning';
    warning.textContent = 'Recomendacion ya hecha';
    suggestionsContainer.appendChild(warning);

    const list = document.createElement('div');
    list.className = 'suggestion-list';
    similar.forEach((rec) => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.innerHTML = linkifyAndEscape(rec.text);
      item.addEventListener("click", () => {
        textarea.value = rec.text;
        suggestionsContainer.innerHTML = '';
        suggestionsContainer.style.display = 'none';
        submitBtn.disabled = false; // Habilita al clickear
        submitBtn.style.backgroundColor = '';
      });
      list.appendChild(item);
    });
    suggestionsContainer.appendChild(list);

    submitBtn.disabled = true;
    submitBtn.style.backgroundColor = 'gray';
  } else {
    suggestionsContainer.style.display = 'none';
    submitBtn.disabled = false;
    submitBtn.style.backgroundColor = '';
  }
});

// Inicial
loadAllForSuggestions().then(() => {
  unsubscribe = onValue(getPendingRef(), (snapshot) => renderRecommendations(snapshot));
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
}