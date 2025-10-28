// js/encuestas.js
import { db, auth, ref, push, onValue, set, remove, get, update, onAuthStateChanged } from "./firebase-config.js";

let currentUserId = localStorage.getItem('userId') || 'user_' + Math.random().toString(36).substring(2,9);
localStorage.setItem('userId', currentUserId);
let isAdmin = false;
let activeSurvey = null;
let countdownInterval = null;
let surveysCache = {};

// Helpers
function escapeHtml(str=''){
  return (str+'')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
function linkifyAndEscape(text=''){
  const urlRegex = /(https?:\/\/[^\n\s<>"']+|www\.[^\s<>"']+)/g;
  const esc = escapeHtml(text);
  return esc.replace(urlRegex, (url) => {
    let link = url;
    if (!link.startsWith('http')) link = 'https://' + link;
    return `<a href="${link}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}

// UI elements
const adminControls = document.getElementById('admin-controls');
const btnNewSurvey = document.getElementById('btn-new-survey');
const surveyCreator = document.getElementById('survey-creator');
const btnAddOption = document.getElementById('btn-add-option');
const optionsList = document.getElementById('options-list');
const btnStartSurvey = document.getElementById('btn-start-survey');
const btnCancelCreate = document.getElementById('btn-cancel-create');
const surveyTitleInput = document.getElementById('survey-title');
const surveyMultiple = document.getElementById('survey-multiple');
const durDays = document.getElementById('dur-days');
const durHours = document.getElementById('dur-hours');
const durMins = document.getElementById('dur-mins');

const activeContainer = document.getElementById('active-survey-container');
const closedList = document.getElementById('closed-surveys-list');

const tabButtons = document.querySelectorAll('.tab-btn');

// Auth & role
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUserId = user.uid;
    localStorage.setItem('userId', currentUserId);
    try {
      const roleSnap = await get(ref(db, `users/${user.uid}/role`));
      isAdmin = roleSnap.val() === 'admin';
      console.log('Auth UID:', user.uid, 'Role:', roleSnap.val(), 'isAdmin:', isAdmin);  // DEBUG: Verifica aquí
    } catch (e) {
      console.error('Error leyendo role:', e);
      isAdmin = false;
    }
    adminControls.style.display = isAdmin ? 'block' : 'none';
    surveyCreator.style.display = 'none';  // Oculto por defecto, se muestra solo si admin en click
  } else {
    currentUserId = localStorage.getItem('userId') || currentUserId;
    adminControls.style.display = 'none';
    surveyCreator.style.display = 'none';
    isAdmin = false;
  }
});

// Tabs
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none');
    document.getElementById(`${btn.dataset.tab}-tab`).style.display = 'block';
  });
});

// Listen surveys in realtime
const surveysRef = ref(db, 'encuestas');
onValue(surveysRef, (snap) => {
  const data = snap.val() || {};
  surveysCache = data;
  renderSurveys(data);
}, { onlyOnce: false });

function renderSurveys(data){
  // find active (activa === true) - allow only one active visually (we deactivate on create)
  activeSurvey = null;
  Object.keys(data).forEach(id => {
    if (data[id] && data[id].activa) activeSurvey = { id, ...data[id] };
  });

  renderActive(activeSurvey);
  renderClosed(data);
}

function renderActive(survey){
  clearInterval(countdownInterval);
  activeContainer.innerHTML = '';
  if (!survey){
    activeContainer.innerHTML = '<p>No hay ninguna encuesta activa actualmente.</p>';
    return;
  }

  const card = document.createElement('div');
  card.className = 'recommend-post';
  card.dataset.surveyId = survey.id;

  const titleHtml = linkifyAndEscape(survey.titulo || 'Sin título');
  const endsAt = Number(survey.fin) || Date.now();

  card.innerHTML = `
    <div class="post-encuesta"><strong>${titleHtml}</strong>
      <span class="survey-meta">Finaliza: <span class="time-remaining" data-fin="${endsAt}"></span></span>
    </div>
    <div class="survey-options" style="margin-top:12px"></div>
    <div style="margin-top:12px;display:flex;gap:10px;align-items:center;">
      ${isAdmin ? `<button class="btn btn-danger" id="btn-end-manual">Finalizar ahora</button>` : ''}
    </div>
  `;

  activeContainer.appendChild(card);

  const optsContainer = card.querySelector('.survey-options');

  // render options
  const options = survey.options || {};
  // order of options is not important; keep insertion order from DB
  Object.keys(options).forEach(optId => {
    const opt = options[optId];
    const votesObj = opt.votes || {};
    const votesCount = Object.keys(votesObj).length;
    const userVotedThis = !!votesObj[currentUserId];

    const optEl = document.createElement('div');
    optEl.className = 'survey-option';
    optEl.style.display = 'flex';
    optEl.style.justifyContent = 'space-between';
    optEl.style.alignItems = 'center';
    optEl.style.padding = '10px';
    optEl.style.marginBottom = '8px';
    optEl.style.background = 'rgba(255,255,255,0.03)';
    optEl.style.borderRadius = '10px';

    optEl.innerHTML = `
      <div class="opt-left">${linkifyAndEscape(opt.text)}</div>
      <div class="opt-right" style="display:flex;gap:8px;align-items:center;">
        <div class="vote-count">${votesCount}</div>
        <button class="btn-vote btn">${userVotedThis ? '✔' : 'Votar'}</button>
      </div>
    `;

    const voteBtn = optEl.querySelector('.btn-vote');
    voteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!auth.currentUser) return alert('Debes iniciar sesión para votar.');
      await toggleVote(survey.id, optId, !!survey.multiple);
    });

    optsContainer.appendChild(optEl);
  });

  // start countdown
  startCountdown(card.querySelector('.time-remaining'));

  // manual end button
  const endBtn = card.querySelector('#btn-end-manual');
  if (endBtn){
    endBtn.addEventListener('click', async () => {
      if (!confirm('¿Finalizar encuesta ahora?')) return;
      await finalizeSurvey(survey.id);
    });
  }
}

function renderClosed(data){
  closedList.innerHTML = '';
  const items = [];
  Object.keys(data).forEach(id => {
    const s = data[id];
    if (!s.activa){
      items.push({ id, ...s });
    }
  });
  if (items.length === 0){
    closedList.innerHTML = '<p>No hay encuestas finalizadas.</p>';
    return;
  }

  // sort by closed/fin descending
  items.sort((a,b)=> (b.fin||0) - (a.fin||0));
  items.forEach(s => {
    const card = document.createElement('div');
    card.className = 'completed-post';
    const titleHtml = linkifyAndEscape(s.titulo || 'Sin título');

    // determine winner (may be tie: choose first with max)
    let winnerId = null; let maxVotes = -1;
    const optEls = [];
    const options = s.options || {};
    Object.keys(options).forEach(optId => {
      const opt = options[optId];
      const votes = Object.keys(opt.votes || {}).length;
      if (votes > maxVotes){ maxVotes = votes; winnerId = optId; }
      optEls.push({ id: optId, text: opt.text, votes });
    });

    const optsHtml = optEls.map(o => `<div style="padding:8px;border-radius:8px;background:rgba(255,255,255,0.02);margin-bottom:6px;">${linkifyAndEscape(o.text)} <strong>(${o.votes}) votos</strong> ${o.id===winnerId?'<span style="color:var(--accent);">⭐ Ganador</span>':''}</div>`).join('');

    card.innerHTML = `
      <div class="post-encuesta"><strong>${titleHtml}</strong>
        <span>${s.fin ? new Date(s.fin).toLocaleString('es-AR') : ''}</span>
      </div>
      <div class="post-text">${optsHtml}</div>
    `;

    closedList.appendChild(card);
  });
}

async function toggleVote(surveyId, optId, multiple){
  const user = auth.currentUser;
  if (!user) return alert('Debes iniciar sesión para votar.');
  const uid = user.uid;

  // read latest survey snapshot (atomic enough for typical usage)
  const surveySnap = await get(ref(db, `encuestas/${surveyId}`));
  if (!surveySnap.exists()) return alert('Encuesta no encontrada.');
  const survey = surveySnap.val();
  if (!survey.activa) return alert('La encuesta ya no está activa.');

  const options = survey.options || {};

  // Single-choice: remove UID from all options, then toggle the requested one
  if (!multiple){
    const updates = {};
    Object.keys(options).forEach(id => {
      updates[`encuestas/${surveyId}/options/${id}/votes/${uid}`] = null;
    });
    const votePath = `encuestas/${surveyId}/options/${optId}/votes/${uid}`;
    const voteSnap = await get(ref(db, votePath));
    updates[votePath] = !voteSnap.exists();  // Toggle: si ya votó, no agregar; pero como limpiamos, siempre agregar si click
    await update(ref(db), updates);
  } else {
    // multiple choice: toggle only this vote
    const votePath = `encuestas/${surveyId}/options/${optId}/votes/${uid}`;
    const voteSnap = await get(ref(db, votePath));
    if (voteSnap.exists()){
      await remove(ref(db, votePath));
    } else {
      await set(ref(db, votePath), true);
    }
  }
}

// Countdown logic: runs per active survey element; when reaches 0, finalize surveys that expired
function startCountdown(elem){
  if (!elem) return;
  const fin = Number(elem.dataset.fin) || Date.now();
  function tick(){
    const diff = fin - Date.now();
    if (diff <= 0){
      elem.textContent = 'Finalizada';
      clearInterval(countdownInterval);
      // finalize all surveys that reached time
      Object.keys(surveysCache).forEach(async id => {
        const s = surveysCache[id];
        if (s && s.activa && Number(s.fin) <= Date.now()){
          await finalizeSurvey(id);
        }
      });
      return;
    }
    const days = Math.floor(diff / (1000*60*60*24));
    const hours = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
    const mins = Math.floor((diff % (1000*60*60)) / (1000*60));
    const secs = Math.floor((diff % (1000*60)) / 1000);
    elem.textContent = `${days}d ${hours}h ${mins}m ${secs}s`;
  }
  tick();
  countdownInterval = setInterval(tick, 1000);
}

async function finalizeSurvey(surveyId){
  // mark activa false and set closedAt
  try {
    await update(ref(db, `encuestas/${surveyId}`), { activa: false, closedAt: Date.now() });
  } catch (e) {
    console.error('Error finalizando encuesta:', e);
  }
}

// Admin: creation UI handling
btnNewSurvey.addEventListener('click', () => {
  if (!isAdmin) return alert('Acceso denegado');
  surveyCreator.style.display = surveyCreator.style.display === 'block' ? 'none' : 'block';
});

btnAddOption.addEventListener('click', () => {
  const row = document.createElement('div');
  row.className = 'option-row';
  row.innerHTML = `<input class="option-input" placeholder="Nueva opción" /><button class="btn-remove-option btn">✖</button>`;
  optionsList.appendChild(row);
});

optionsList.addEventListener('click', (e) => {
  if (e.target.classList.contains('btn-remove-option')){
    const row = e.target.closest('.option-row');
    if (row) row.remove();
  }
});

btnCancelCreate.addEventListener('click', () => {
  surveyCreator.style.display = 'none';
});

// Start survey (crear nueva encuesta)
btnStartSurvey.addEventListener('click', async () => {
  if (!isAdmin) return alert('Solo administradores pueden crear encuestas.');
  if (!auth.currentUser) return alert('Debes estar autenticado.');

  console.log('Iniciando creación - UID:', currentUserId, 'isAdmin:', isAdmin);  // DEBUG

  // título y opciones
  const titulo = surveyTitleInput.value.trim();
  if (!titulo) return alert('Ingrese un título');
  
  const inputs = Array.from(document.querySelectorAll('.option-input'))
    .map(i => i.value.trim())
    .filter(Boolean);

  if (inputs.length < 2) return alert('La encuesta necesita al menos 2 opciones.');

  // duración
  const days = Number(durDays.value) || 0;
  const hours = Number(durHours.value) || 0;
  const mins = Number(durMins.value) || 0;
  const finTs = Date.now() + ((days*24 + hours)*60 + mins)*60*1000;

  // construir objeto de opciones
  const optionsObj = {};
  inputs.forEach((t, idx) => {
    const id = 'opt_' + Math.random().toString(36).substring(2, 9);
    optionsObj[id] = { text: t, votes: {} };
  });

  try {
    // Multi-path update: desactivar otras + crear nueva en un solo call
    const updates = {};
    for (const id of Object.keys(surveysCache)) {
      if (surveysCache[id] && surveysCache[id].activa) {
        updates[`encuestas/${id}/activa`] = false;
        updates[`encuestas/${id}/closedAt`] = Date.now();
      }
    }

    const newRef = push(ref(db, 'encuestas'));
    const newId = newRef.key;
    updates[`encuestas/${newId}`] = {
      titulo,
      options: optionsObj,
      multiple: !!surveyMultiple.checked,
      fin: finTs,
      activa: true,
      creador: currentUserId,
      createdAt: Date.now()
    };
    await update(ref(db), updates);
    console.log('Encuesta creada con ID:', newId);  // DEBUG

  } catch (e) {
    console.error('Error creando encuesta:', e);
    alert('Error al crear encuesta. Revisa la consola.');
    return;
  }

  // resetear formulario
  surveyTitleInput.value = '';
  const optionInputs = document.querySelectorAll('.option-input');
  optionInputs.forEach((i, idx) => {
    if (idx > 1) {
      const row = i.closest('.option-row');
      if (row) row.remove();
    } else {
      i.value = '';
    }
  });

  surveyMultiple.checked = false;
  durDays.value = '';
  durHours.value = '';
  durMins.value = '';
  surveyCreator.style.display = 'none';
});


// small UX: avoid clicks on closed list doing nothing weird
closedList.addEventListener('click', (e)=>{ /* placeholder */ });

export {}; // keep module scope clean