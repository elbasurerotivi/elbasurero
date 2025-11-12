// js/video-interaction.js
import { auth, db, ref, push, onValue, set, remove, get, update, onAuthStateChanged } from "./firebase-config.js";

let currentUser = null;
let videoId = null;

export function initVideoInteraction(vId) {
  videoId = vId;

  // Escuchar autenticación
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
      document.getElementById('commentForm').style.display = 'none';
      document.getElementById('showCommentForm').style.display = 'block';
      loadLikes();
      loadComments();
    } else {
      document.getElementById('showCommentForm').style.display = 'none';
      document.getElementById('commentForm').style.display = 'none';
    }
  });

  // Botones
  document.getElementById('likeBtn').addEventListener('click', () => toggleLike(true));
  document.getElementById('dislikeBtn').addEventListener('click', () => toggleLike(false));
  document.getElementById('showCommentForm').addEventListener('click', showCommentForm);
  document.getElementById('cancelComment').addEventListener('click', hideCommentForm);
  document.getElementById('sendComment').addEventListener('click', sendComment);
}

async function toggleLike(isLike) {
  if (!currentUser) return alert("Debes iniciar sesión");

  const userRef = ref(db, `videos/${videoId}/likedBy/${currentUser.uid}`);
  const videoRef = ref(db, `videos/${videoId}`);

  const snapshot = await get(userRef);
  const currentValue = snapshot.val(); // true, false, o null

  let likesChange = 0;
  let dislikesChange = 0;

  if (currentValue === isLike) {
    // Quitar like/dislike
    await set(userRef, null);
    if (isLike) likesChange = -1;
    else dislikesChange = -1;
  } else {
    // Cambiar o poner nuevo
    await set(userRef, isLike);
    if (isLike) likesChange = 1;
    else dislikesChange = 1;

    // Si había uno opuesto, restarlo
    if (currentValue !== null && currentValue !== isLike) {
      if (currentValue) likesChange = -1;
      else dislikesChange = -1;
    }
  }

  // Actualizar contadores en Firebase
  const likesRef = ref(db, `videos/${videoId}/likesCount`);
  const dislikesRef = ref(db, `videos/${videoId}/dislikesCount`);

  const [likesSnap, dislikesSnap] = await Promise.all([get(likesRef), get(dislikesRef)]);
  const currentLikes = likesSnap.val() || 0;
  const currentDislikes = dislikesSnap.val() || 0;

  await Promise.all([
    set(likesRef, Math.max(0, currentLikes + likesChange)),
    set(dislikesRef, Math.max(0, currentDislikes + dislikesChange))
  ]);

  updateButtonStates();
}

// === LIKE A COMENTARIOS Y RESPUESTAS ===
async function toggleCommentLike(fullId, isReply) {
  if (!currentUser) return;

  let basePath;

  if (isReply) {
    // fullId debe tener formato "commentId-replyId"
    const parts = fullId.split('-');
    if (parts.length < 2) {
      console.error("❌ Error: fullId inválido para respuesta:", fullId);
      return;
    }
    const [commentId, replyId] = parts;
    basePath = `videos/${videoId}/comments/${commentId}/replies/${replyId}`;
  } else {
    basePath = `videos/${videoId}/comments/${fullId}`;
  }

  console.log("✅ toggleCommentLike →", basePath);

  const userRef = ref(db, `${basePath}/likedBy/${currentUser.uid}`);
  const likesCountRef = ref(db, `${basePath}/likesCount`);

  const [userSnap, countSnap] = await Promise.all([get(userRef), get(likesCountRef)]);
  const alreadyLiked = userSnap.val() === true;
  let newCount = (countSnap.val() || 0);

  if (alreadyLiked) {
    await set(userRef, null);
    newCount = Math.max(0, newCount - 1);
  } else {
    await set(userRef, true);
    newCount += 1;
  }

  await set(likesCountRef, newCount);

  const btn = document.querySelector(`.like-comment[data-id="${fullId}"]`);
  if (btn) {
    btn.classList.toggle('liked', !alreadyLiked);
    btn.innerHTML = `Like ${newCount}`;
  }
}


function loadLikes() {
  const likesRef = ref(db, `videos/${videoId}/likesCount`);
  const dislikesRef = ref(db, `videos/${videoId}/dislikesCount`);

  onValue(likesRef, (snap) => {
    document.getElementById('likeCount').textContent = snap.val() || 0;
  });

  onValue(dislikesRef, (snap) => {
    document.getElementById('dislikeCount').textContent = snap.val() || 0;
  });

  // Estado del botón del usuario
  const userRef = ref(db, `videos/${videoId}/likedBy/${currentUser?.uid}`);
  onValue(userRef, (snap) => {
    const val = snap.val();
    const likeBtn = document.getElementById('likeBtn');
    const dislikeBtn = document.getElementById('dislikeBtn');
    likeBtn.classList.toggle('liked', val === true);
    dislikeBtn.classList.toggle('disliked', val === false);
  });
}

// Comentarios
function showCommentForm() {
  document.getElementById('showCommentForm').style.display = 'none';
  document.getElementById('commentForm').style.display = 'flex';
  document.getElementById('commentText').focus();
}

function hideCommentForm() {
  document.getElementById('commentForm').style.display = 'none';
  document.getElementById('showCommentForm').style.display = 'block';
  document.getElementById('commentText').value = '';
}

async function sendComment() {
  const text = document.getElementById('commentText').value.trim();
  if (!text || !currentUser) return;

  const commentsRef = ref(db, `videos/${videoId}/comments`);
  await push(commentsRef, {
    userId: currentUser.uid,
    userName: currentUser.displayName || "Anónimo",
    userPhoto: currentUser.photoURL || "",
    text: text,
    timestamp: Date.now(),
    likesCount: 0
  });

  document.getElementById('commentText').value = '';
  hideCommentForm();
}

function loadComments() {
  const commentsRef = ref(db, `videos/${videoId}/comments`);
  onValue(commentsRef, (snapshot) => {
    const list = document.getElementById('commentsList');
    list.innerHTML = '';

    if (!snapshot.exists()) {
      list.innerHTML = '<p style="color:#999;text-align:center;">Sé el primero en comentar</p>';
      return;
    }

    const comments = [];
    snapshot.forEach(child => {
      comments.push({ id: child.key, ...child.val() });
    });

    // Ordenar por timestamp descendente
    comments.sort((a, b) => b.timestamp - a.timestamp);

    comments.forEach(comment => {
      const commentEl = createCommentElement(comment);
      list.appendChild(commentEl);
    });
  });
}

function createCommentElement(comment, isReply = false) {
  const div = document.createElement('div');
  div.className = 'comment';
  if (isReply) div.classList.add('reply');

  // ID único
   const fullId = isReply 
    ? `${comment.parentCommentId}-${comment.id}` 
    : comment.id;

    // ✅ Agregá el log acá, dentro de la función
  console.log("🧩 fullId generado:", fullId, "→ parent:", comment.parentCommentId);



  // Estado del like
  const userLiked = currentUser && comment.likedBy && comment.likedBy[currentUser.uid] === true;
  const likedClass = userLiked ? 'liked' : '';

  const photo = comment.userPhoto 
    ? `<img src="${comment.userPhoto}" class="comment-photo" alt="${escapeHtml(comment.userName)}" />` 
    : '<div class="comment-photo-placeholder"></div>';

  div.innerHTML = `
    <div class="comment-header">
      ${photo}
      <span class="comment-user">${escapeHtml(comment.userName)}</span>
      <span class="comment-time">${formatTime(comment.timestamp)}</span>
    </div>
    <div class="comment-text">${escapeHtml(comment.text)}</div>
    <div class="comment-actions">
      <button class="like-comment ${likedClass}" 
              data-id="${fullId}" 
              data-is-reply="${isReply}">
        Like ${comment.likesCount || 0}
      </button>
      <button class="reply-btn">Responder</button>
    </div>
    <div class="reply-form" style="display:none;">
      <textarea placeholder="Escribe una respuesta..." maxlength="500"></textarea>
      <button class="send-reply">Enviar</button>
      <button class="cancel-reply">Cancelar</button>
    </div>
    <div class="replies"></div>
  `;

  // === LIKE ===
  const likeBtn = div.querySelector('.like-comment');
  likeBtn.addEventListener('click', async () => {
    if (!currentUser) return alert("Debes iniciar sesión");
    const isReplyMode = likeBtn.dataset.isReply === 'true';
    const targetId = likeBtn.dataset.id;
    await toggleCommentLike(targetId, isReplyMode);
  });

  // === RESPONDER ===
  div.querySelector('.reply-btn').onclick = () => {
    const form = div.querySelector('.reply-form');
    form.style.display = form.style.display === 'none' ? 'flex' : 'none';
    form.querySelector('textarea').focus();
  };

  div.querySelector('.cancel-reply').onclick = () => {
    const form = div.querySelector('.reply-form');
    form.style.display = 'none';
    form.querySelector('textarea').value = '';
  };

  div.querySelector('.send-reply').onclick = async () => {
    const textarea = div.querySelector('.reply-form textarea');
    const text = textarea.value.trim();
    if (!text || !currentUser) return;

    const repliesRef = ref(db, `videos/${videoId}/comments/${comment.id}/replies`);
    await push(repliesRef, {
      userId: currentUser.uid,
      userName: currentUser.displayName || "Anónimo",
      userPhoto: currentUser.photoURL || "",
      text: text,
      timestamp: Date.now(),
      likesCount: 0,
      likedBy: {}
    });

    textarea.value = '';
    div.querySelector('.reply-form').style.display = 'none';
  };

  // === CARGAR RESPUESTAS ===
  if (!isReply) {
    loadReplies(comment.id, div.querySelector('.replies'));
  }

  return div;
}

function loadReplies(commentId, container) {
  const repliesRef = ref(db, `videos/${videoId}/comments/${commentId}/replies`);
  onValue(repliesRef, (snapshot) => {
    container.innerHTML = '';
    if (!snapshot.exists()) return;

    const replies = [];
    snapshot.forEach(child => {
      replies.push({ id: child.key, ...child.val() });
    });
    replies.sort((a, b) => b.timestamp - a.timestamp);

    replies.forEach(reply => {
      // 👇 Pasamos explícitamente el commentId como parentCommentId
      const replyEl = createCommentElement(
        { ...reply, parentCommentId: commentId },
        true // isReply = true
      );
      container.appendChild(replyEl);
    });
  });
}




function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'hace un momento';
  if (diff < 3600000) return `hace ${Math.floor(diff/60000)} min`;
  if (diff < 86400000) return `hace ${Math.floor(diff/3600000)} h`;
  return date.toLocaleDateString('es-AR');
}