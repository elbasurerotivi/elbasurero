// recommendations.js actualizado con compatibilidad total
import {
  db,
  auth,
  ref,
  onValue,
  push,
  update,
  remove,
  get,
  set,
  onAuthStateChanged,
} from "./firebase-config.js";

let currentCategory = "movies"; // pestaña activa por defecto
let recommendations = [];
let unsubscribe = null;

// Función para obtener la referencia correcta según la categoría
function getCategoryRef() {
  if (currentCategory === "movies") {
    // Recomendaciones viejas (raíz original)
    return ref(db, "recommendations");
  } else {
    // Nueva rama para música
    return ref(db, `music`);
  }
}

// ===============================
// ELEMENTOS DEL DOM
// ===============================
const form = document.getElementById("recommend-form");
const textarea = document.getElementById("rec-text");
const suggestionsContainer = document.getElementById("suggestions");
const tabButtons = document.querySelectorAll(".tab-btn");
const lists = {
  movies: document.getElementById("recommend-list-movies"),
  music: document.getElementById("recommend-list-music"),
};

// ===============================
// CAMBIO DE TABS (CATEGORÍAS)
// ===============================
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

// ===============================
// FUNCIÓN PARA MOSTRAR RECOMENDACIONES
// ===============================
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
    container.innerHTML =
      "<p>No hay recomendaciones todavía. ¡Sé el primero en publicar!</p>";
  } else {
    posts.forEach(renderPost);
  }
}

// ===============================
// FUNCIÓN PARA CREAR UNA PUBLICACIÓN
// ===============================
function renderPost(post) {
  const container = lists[currentCategory];
  const postElement = document.createElement("div");
  postElement.className = "recommend-item";

  const likesCount = Object.keys(post.likes || {}).length;
  const commentsCount = post.comments
    ? Object.keys(post.comments).length
    : 0;

  postElement.innerHTML = `
    <p class="recommend-text">${post.text}</p>
    <div class="recommend-meta">
      <span class="recommend-author">Por: ${post.name}</span>
      <div class="recommend-actions">
        <button class="like-btn">❤️ ${likesCount}</button>
        <button class="comment-btn">💬 ${commentsCount}</button>
      </div>
    </div>
    <div class="comments-container" style="display:none;"></div>
  `;

  const likeBtn = postElement.querySelector(".like-btn");
  const commentBtn = postElement.querySelector(".comment-btn");
  const commentsContainer = postElement.querySelector(".comments-container");

  // Likes
  likeBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) return alert("Debes iniciar sesión para dar like.");
    const uid = user.uid;
    const likeRef = ref(db, `${currentCategory === "movies" ? "recommendations" : "music"}/${post.id}/likes/${uid}`);
    const snapshot = await get(likeRef);
    if (snapshot.exists()) {
      await remove(likeRef);
    } else {
      await set(likeRef, true);
    }
  });

  // Comentarios
  commentBtn.addEventListener("click", () => {
    commentsContainer.style.display =
      commentsContainer.style.display === "none" ? "block" : "none";
    renderComments(post.id, commentsContainer);
  });

  container.appendChild(postElement);
}

// ===============================
// RENDERIZAR COMENTARIOS
// ===============================
function renderComments(postId, container) {
  const commentsRef = ref(db, `${currentCategory === "movies" ? "recommendations" : "music"}/${postId}/comments`);

  onValue(commentsRef, (snapshot) => {
    container.innerHTML = "";

    const form = document.createElement("form");
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

      const newCommentRef = push(
        ref(db, `${currentCategory === "movies" ? "recommendations" : "music"}/${postId}/comments`)
      );

      await set(newCommentRef, {
        name: user.displayName || "Anónimo",
        text: input.value,
        timestamp: Date.now(),
      });

      input.value = "";
    });

    snapshot.forEach((child) => {
      const comment = child.val();
      const div = document.createElement("div");
      div.classList.add("comment");
      div.innerHTML = `
        <p><strong>${comment.name}:</strong> ${comment.text}</p>
      `;
      container.appendChild(div);
    });
  });
}

// ===============================
// PUBLICAR NUEVA RECOMENDACIÓN
// ===============================
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
  });

  textarea.value = "";
});

// ===============================
// SUGERENCIAS (ANTI-DUPLICADOS)
// ===============================
textarea.addEventListener("input", () => {
  const query = textarea.value.toLowerCase();
  const filtered = recommendations.filter((rec) =>
    rec.text.toLowerCase().includes(query)
  );

  suggestionsContainer.innerHTML = "";

  if (query && filtered.length > 0) {
    filtered.forEach((rec) => {
      const div = document.createElement("div");
      div.className = "suggestion";
      div.textContent = rec.text;
      suggestionsContainer.appendChild(div);
      div.addEventListener("click", () => {
        textarea.value = rec.text;
        suggestionsContainer.innerHTML = "";
      });
    });
  }
});

// ===============================
// LISTENER INICIAL
// ===============================
unsubscribe = onValue(getCategoryRef(), renderRecommendations);
