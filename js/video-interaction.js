// js/video-interaction.js
import { auth, db, ref, onValue, set, get, push, update, onAuthStateChanged } from "../firebase-config.js";

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
  const alreadyLiked = snapshot.val() === true;
  const alreadyDisliked = snapshot.val() === false;

  if ((isLike && alreadyLiked) || (!isLike && alreadyDisliked)) {
    // Quitar like/dislike
    await set(userRef, null);
    updateCounts();
  } else {
    // Cambiar o poner
    await set(userRef, isLike);
    updateCounts();
  }
}

async function updateCounts() {
  const videoRef = ref(db, `videos/${videoId}/likedBy`);
  const snapshot = await get(videoRef);
  let likes = 0, dislikes = 0;

  snapshot.forEach(child => {
    if (child.val() === true) likes++;
    else if (child.val() === false) dislikes++;
  });

  document.getElementById('likeCount').textContent = likes;
  document.getElementById('dislikeCount').textContent = dislikes;

  // Actualizar botón visual
  const userLike = (await get(ref(db, `videos/${videoId}/likedBy/${currentUser?.uid}`))).val();
  const likeBtn = document.getElementById('likeBtn');
  const dislikeBtn = document.getElementById('dislikeBtn');

  likeBtn.classList.toggle('liked', userLike === true);
  dislikeBtn.classList.toggle('disliked', userLike === false);
}

function loadLikes() {
  const likesRef = ref(db, `videos/${videoId}/likedBy`);
  onValue(likesRef, () => updateCounts());
  updateCounts();
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

  const photo = comment.userPhoto ? `<img src="${comment.userPhoto}" class="comment-photo" />` : '';
  div.innerHTML = `
    <div class="comment-header">
      ${photo}
      <span class="comment-user">${escapeHtml(comment.userName)}</span>
      <span class="comment-time">${formatTime(comment.timestamp)}</span>
    </div>
    <div class="comment-text">${escapeHtml(comment.text)}</div>
    <div class="comment-actions">
      <button class="like-comment" data-id="${comment.id}">👍 ${comment.likesCount || 0}</button>
      <button class="reply-btn">Responder</button>
    </div>
    <div class="reply-form" style="display:none;">
      <textarea placeholder="Escribe una respuesta..." maxlength="500"></textarea>
      <button class="send-reply">Enviar</button>
      <button class="cancel-reply">Cancelar</button>
    </div>
    <div class="replies"></div>
  `;

  // Responder
  div.querySelector('.reply-btn').onclick = () => {
    const form = div.querySelector('.reply-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  };

  div.querySelector('.cancel-reply').onclick = () => {
    div.querySelector('.reply-form').style.display = 'none';
  };

  div.querySelector('.send-reply').onclick = async () => {
    const textarea = div.querySelector('.reply-form textarea');
    const text = textarea.value.trim();
    if (!text) return;

    const repliesRef = ref(db, `videos/${videoId}/comments/${comment.id}/replies`);
    await push(repliesRef, {
      userId: currentUser.uid,
      userName: currentUser.displayName || "Anónimo",
      userPhoto: currentUser.photoURL || "",
      text: text,
      timestamp: Date.now(),
      likesCount: 0
    });

    textarea.value = '';
    div.querySelector('.reply-form').style.display = 'none';
  };

  // Cargar respuestas
  loadReplies(comment.id, div.querySelector('.replies'));

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
      const replyEl = createCommentElement(reply, true);
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