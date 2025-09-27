// js/community.js
import { db } from "./firebase-config.js";
import { ref, push, onValue, set, remove, update } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

console.log("community.js loaded (module)");

// Reactions supported
const REACTIONS = [
  { key: 'like', emoji: '👍', title: 'Me gusta' },
  { key: 'dislike', emoji: '👎', title: 'No me gusta' },
  { key: 'love', emoji: '❤️', title: 'Me encanta' },
  { key: 'angry', emoji: '😡', title: 'Me enoja' },
  { key: 'wow', emoji: '😮', title: 'Me sorprende' }
];

// Elements
const wall = document.getElementById('community-wall');
const form = document.getElementById('message-form');
const nameInput = document.getElementById('name');
const messageInput = document.getElementById('message');
const participantsEl = document.getElementById('participants');
const saveNameBtn = document.getElementById('save-name');

if (!wall || !form || !nameInput || !messageInput) {
  console.error("Missing DOM elements for chat. Check comunidad.html IDs.");
}

// Simple uid for each browser (stored in localStorage)
let uid = localStorage.getItem('chat_uid');
if (!uid) {
  uid = 'u_' + Math.random().toString(36).slice(2,10);
  localStorage.setItem('chat_uid', uid);
}

// Name handling
let savedName = localStorage.getItem('chat_name') || '';
if (!savedName) {
  savedName = prompt('Elegí un nombre para el chat (se guardará en este navegador):') || 'Anónimo';
  localStorage.setItem('chat_name', savedName);
}
nameInput.value = savedName;

// Save name button
saveNameBtn.addEventListener('click', () => {
  const v = nameInput.value.trim() || 'Anónimo';
  localStorage.setItem('chat_name', v);
  savedName = v;
  alert('Nombre guardado: ' + v);
});

// helpers
function getRandomColor() {
  const colors = ['#e74c3c', '#2ecc71', '#3498db', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'];
  return colors[Math.floor(Math.random()*colors.length)];
}
function timeString(ts) {
  try { return new Date(ts).toLocaleString('es-AR'); } catch(e) { return ''; }
}

// DB refs
const messagesRef = ref(db, 'messages');
const participantsRef = ref(db, 'participants');

// send message
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  const name = nameInput.value.trim() || savedName || 'Anónimo';
  if (!text) return;

  const newMsg = {
    uid,
    name,
    text,
    timestamp: Date.now(),
    color: getRandomColor(),
    reactions: {}
  };
  try {
    await push(messagesRef, newMsg);
    messageInput.value = '';
  } catch (err) {
    console.error('Error sending message:', err);
    alert('Error al enviar el mensaje. Revisa la consola.');
  }
});

// register participant (simple online marker)
(function registerParticipant(){
  try{
    set(ref(db, 'participants/' + uid), { name: nameInput.value || savedName, ts: Date.now() });
    window.addEventListener('beforeunload', () => {
      remove(ref(db, 'participants/' + uid)).catch(()=>{});
    });
  }catch(e){ console.warn('participant registration failed', e); }
})();

// render participants
onValue(participantsRef, (snap) => {
  const parts = [];
  snap.forEach(child => parts.push(child.val()));
  if (parts.length === 0) {
    participantsEl.innerHTML = '<div class="muted">No hay participantes</div>';
    return;
  }
  participantsEl.innerHTML = parts.map(p=> '<div class="participant-item">' + escapeHtml(p.name || 'Anon') + '</div>').join('');
}, (err)=>{ console.error('participants read error', err); });

// Listen messages in realtime
onValue(messagesRef, (snapshot) => {
  const msgs = [];
  snapshot.forEach(child => {
    msgs.push({ id: child.key, ...child.val() });
  });

  // sort by timestamp desc (newest first)
  msgs.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));

  // render
  renderMessages(msgs);
}, (err) => {
  console.error('messages read error', err);
  wall.innerHTML = '<div class="muted">No se pueden cargar mensajes: ' + (err.message || '') + '</div>';
});

function renderMessages(messages){
  // messages is an array newest-first
  wall.innerHTML = '';
  if (!messages || messages.length === 0) {
    wall.innerHTML = '<div class="muted" style="text-align:center; padding:24px;">No hay mensajes todavía. Sé el primero en escribir.</div>';
    return;
  }

  messages.forEach(msg => {
    const el = document.createElement('div');
    el.className = 'msg';

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.style.background = msg.color || '#777';
    avatar.textContent = (msg.name && msg.name.slice(0,1).toUpperCase()) || 'A';

    const body = document.createElement('div');
    body.className = 'msg-body';

    // Header
    const header = document.createElement('div');
    header.className = 'msg-head';
    const nameEl = document.createElement('div');
    nameEl.className = 'name';
    nameEl.textContent = msg.name || 'Anónimo';
    const timeEl = document.createElement('div');
    timeEl.className = 'msg-time';
    timeEl.textContent = timeString(msg.timestamp);

    header.appendChild(nameEl);
    header.appendChild(timeEl);

    // Text
    const textP = document.createElement('div');
    textP.className = 'msg-text';
    textP.textContent = msg.text || '';

    // Actions: reactions
    const actions = document.createElement('div');
    actions.className = 'msg-actions';

    REACTIONS.forEach(r => {
      const count = msg.reactions && msg.reactions[r.key] ? Object.keys(msg.reactions[r.key]).length : 0;
      const active = msg.reactions && msg.reactions[r.key] && msg.reactions[r.key][uid];
      const btn = document.createElement('button');
      btn.className = 'react-btn' + (active ? ' active' : '');
      btn.setAttribute('data-reaction', r.key);
      btn.innerHTML = '<span class="emoji">'+r.emoji+'</span> <span class="count">'+count+'</span>';
      btn.title = r.title;

      btn.addEventListener('click', async () => {
        try {
          const path = 'messages/' + msg.id + '/reactions/' + r.key + '/' + uid;
          if (active) {
            await remove(ref(db, path));
          } else {
            await set(ref(db, path), true);
          }
        } catch (err) {
          console.error('reaction toggle error', err);
        }
      });
      actions.appendChild(btn);
    });

    // Controls (edit/delete only if author)
    const controls = document.createElement('div');
    controls.className = 'msg-controls';
    if (msg.uid === uid) {
      const editBtn = document.createElement('button');
      editBtn.className = 'control-btn';
      editBtn.textContent = 'Editar';
      editBtn.addEventListener('click', async () => {
        const nuevo = prompt('Editar tu mensaje:', msg.text || '');
        if (nuevo !== null) {
          try {
            await update(ref(db, 'messages/' + msg.id), { text: nuevo });
          } catch (err) { console.error('edit error', err); }
        }
      });
      const delBtn = document.createElement('button');
      delBtn.className = 'control-btn';
      delBtn.textContent = 'Eliminar';
      delBtn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar este mensaje?')) return;
        try {
          await remove(ref(db, 'messages/' + msg.id));
        } catch (err) { console.error('delete error', err); }
      });
      controls.appendChild(editBtn);
      controls.appendChild(delBtn);
    }

    // Compose message node
    body.appendChild(header);
    body.appendChild(textP);
    body.appendChild(actions);
    body.appendChild(controls);

    el.appendChild(avatar);
    el.appendChild(body);

    wall.appendChild(el);
  });

  // Keep scroll at top (newest-first layout)
  try { wall.scrollTop = 0; } catch(e){}
}

// Minimal safe escape
function escapeHtml(str){ if(!str) return ''; return String(str).replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',\"'\":'&#39;' }[m])); }
   
