import { auth, db, ref, push, onValue, set, remove, get } from "./firebase-config.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

// UID persistente para simular "usuario único" (para likes no autenticados)
let userId = localStorage.getItem("userId");
if (!userId) {
  userId = "user_" + Math.random().toString(36).substring(2, 9);
  localStorage.setItem("userId", userId);
}

// Sincronizar userId con auth.currentUser.uid si el usuario está autenticado
auth.onAuthStateChanged((user) => {
  if (user) {
    userId = user.uid; // Usar uid del usuario autenticado
    localStorage.setItem("userId", userId); // Actualizar localStorage
  }
});

/* ========================
   FORMULARIO
======================== */
const form = document.getElementById("recommend-form");
const recText = document.getElementById("rec-text");
const recImage = document.getElementById("rec-image");
const imagePreview = document.getElementById("image-preview");
const recList = document.getElementById("recommend-list");
const suggestions = document.getElementById("suggestions");
const submitBtn = form.querySelector('button[type="submit"]');

const recommendationsRef = ref(db, "recommendations");
const storage = getStorage();
let recommendations = []; // Array para almacenar recomendaciones

// Mostrar vista previa de la imagen seleccionada
recImage.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    // Validar tipo y tamaño (máximo 5MB)
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecciona una imagen válida (jpg, png, gif).");
      recImage.value = "";
      imagePreview.innerHTML = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen no debe exceder los 5MB.");
      recImage.value = "";
      imagePreview.innerHTML = "";
      return;
    }

    // Mostrar vista previa
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.innerHTML = `<img src="${e.target.result}" alt="Vista previa">`;
    };
    reader.readAsDataURL(file);
  } else {
    imagePreview.innerHTML = "";
  }
});

// Función de distancia Levenshtein
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
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  return track[str2.length][str1.length];
}

// Función para convertir URLs en enlaces y soportar emojis
function linkifyAndEscape(text) {
  // Escapar HTML para seguridad, pero permitir emojis (UTF-8)
  const escapeHtml = (str) => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Regex para detectar URLs (incluye http/https/www)
  const urlRegex = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/g;

  // Reemplazar URLs con <a> tags, preservando emojis
  return escapeHtml(text).replace(urlRegex, (url) => {
    let link = url;
    if (!link.startsWith('http')) {
      link = 'https://' + link;
    }
    return `<a href="${link}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}

// Publicar recomendación
form.addEventListener("submit", async (e) => {
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
    const text = recText.value.trim();
    const file = recImage.files[0];
    let imageUrl = null;

    if (!text) return;

    // Subir imagen a Firebase Storage si existe
    if (file) {
      const storagePath = `recommendations/${userId}/${Date.now()}_${file.name}`;
      const imageRef = storageRef(storage, storagePath);
      try {
        const snapshot = await uploadBytes(imageRef, file);
        imageUrl = await getDownloadURL(snapshot.ref);
      } catch (err) {
        console.error("Error al subir la imagen:", err);
        alert("No se pudo subir la imagen. Intenta de nuevo.");
        return;
      }
    }

    // Guardar recomendación en la base de datos
    push(recommendationsRef, {
      name,
      text,
      imageUrl, // Guardar URL de la imagen
      timestamp: Date.now(),
      likes: {},
      comments: {}
    });

    form.reset();
    recImage.value = "";
    imagePreview.innerHTML = "";
    suggestions.innerHTML = "";
    suggestions.style.display = "none";
    submitBtn.disabled = false;
    submitBtn.style.backgroundColor = ""; // Restaurar color original
  });
});

// Detectar input y mostrar sugerencias
recText.addEventListener("input", () => {
  const value = recText.value.trim().toLowerCase();
  if (value.length < 3) {
    suggestions.innerHTML = "";
    suggestions.style.display = "none";
    submitBtn.disabled = false;
    submitBtn.style.backgroundColor = "";
    return;
  }

  // Filtrar recomendaciones similares
  const similar = recommendations
    .filter((rec) => {
      const recLower = rec.text.toLowerCase();
      const dist = levenshteinDistance(value, recLower);
      return dist < 5 || recLower.includes(value);
    })
    .sort((a, b) => {
      return levenshteinDistance(value, a.text.toLowerCase()) - levenshteinDistance(value, b.text.toLowerCase());
    });

  suggestions.innerHTML = "";
  if (similar.length > 0) {
    suggestions.style.display = "block";
    
    // Agregar leyenda de advertencia
    const warning = document.createElement("div");
    warning.className = "suggestion-warning";
    warning.textContent = "Tu recomendación ya fue hecha";
    suggestions.appendChild(warning);
    
    // Agregar sugerencias
    similar.forEach((rec) => {
      const item = document.createElement("div");
      item.className = "suggestion-item";
      item.innerHTML = linkifyAndEscape(rec.text);
      if (rec.imageUrl) {
        const img = document.createElement("img");
        img.src = rec.imageUrl;
        img.alt = "Imagen de la recomendación";
        img.className = "suggestion-image";
        item.appendChild(img);
      }
      suggestions.appendChild(item);
    });
    
    submitBtn.disabled = true;
    submitBtn.style.backgroundColor = "gray";
  } else {
    suggestions.style.display = "none";
    submitBtn.disabled = false;
    submitBtn.style.backgroundColor = "";
  }
});

// Guardamos qué posts tienen comentarios abiertos
let openComments = new Set();

/* ========================
   MOSTRAR RECOMENDACIONES
======================== */
onValue(recommendationsRef, (snapshot) => {
  console.log("Snapshot recibido:", snapshot.val()); // Depuración
  recommendations = []; // Reiniciar array
  const posts = [];
  snapshot.forEach((child) => {
    const postData = child.val();
    recommendations.push({ id: child.key, ...postData }); // Almacenar para sugerencias
    posts.push({ id: child.key, ...postData });
    console.log(`Post ${child.key} likes:`, postData.likes); // Depuración
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
  console.log(`Post ${post.id} - userId: ${userId}, userLiked: ${userLiked}`); // Depuración

  const isOpen = openComments.has(post.id);

  // Construir el HTML del post
  let postContent = `
    <div class="post-header">
      <strong>${post.name}</strong>
      <span>${new Date(post.timestamp).toLocaleString("es-AR")}</span>
    </div>
    <p class="post-text">${linkifyAndEscape(post.text)}</p>
  `;
  if (post.imageUrl) {
    postContent += `<img src="${post.imageUrl}" alt="Imagen de la recomendación" class="post-image" loading="lazy">`;
  }
  postContent += `
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

  postEl.innerHTML = postContent;

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
          console.log(`Like removido para post ${post.id}, uid: ${uid}`); // Depuración
        } else {
          set(likeRef, true);
          likeBtn.classList.add("active");
          likeBtn.nextElementSibling.classList.add("active");
          console.log(`Like agregado para post ${post.id}, uid: ${uid}`); // Depuración
        }
      }).catch(err => console.error("Error al actualizar like:", err));
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
    console.log(`Comentario ${commentId} - userId: ${userId}, userLiked: ${userLiked}`); // Depuración

    const div = document.createElement("div");
    div.className = "comment";
    div.innerHTML = `
      <div class="comment-header"><strong>${c.name}</strong></div>
      <div class="comment-text">${linkifyAndEscape(c.text)}</div>
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
            console.log(`Like removido para comentario ${commentId}, uid: ${uid}`); // Depuración
          } else {
            set(likeRef, true);
            e.target.classList.add("active");
            e.target.nextElementSibling.classList.add("active");
            console.log(`Like agregado para comentario ${commentId}, uid: ${uid}`); // Depuración
          }
        }).catch(err => console.error("Error al actualizar like de comentario:", err));
      });
    });

    container.appendChild(div);
  });
}

// Lógica para el botón Scroll to Top
const scrollToTopBtn = document.querySelector(".scroll-to-top");

if (scrollToTopBtn) {
  // Mostrar/Ocultar botón según el scroll
  window.addEventListener("scroll", () => {
    if (window.scrollY > 200) {
      scrollToTopBtn.classList.add("visible");
    } else {
      scrollToTopBtn.classList.remove("visible");
    }
  });

  // Desplazar suavemente hacia arriba al hacer clic
  scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}