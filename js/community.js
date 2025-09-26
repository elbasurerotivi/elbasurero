// community.js
// Handles forum (localStorage fallback) and simple birthday calendar

(function(){
  // ---------- Forum (messages) ----------
  const forumForm = document.getElementById('forum-form');
  const messagesDiv = document.getElementById('messages');
  const clearForumBtn = document.getElementById('clear-forum');
  const STORAGE_KEY = 'communityMessages_v1';

  function loadMessages(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e){
      console.error('Error leyendo mensajes:', e);
      return [];
    }
  }

  function saveMessages(messages){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }

  function renderMessages(){
    const messages = loadMessages();
    if(messages.length === 0){
      messagesDiv.innerHTML = '<p class="muted">No hay mensajes todavía. Sé el primero en escribir.</p>';
      return;
    }
    messagesDiv.innerHTML = messages.slice().reverse().map((m, idx) => {
      return `
        <article class="post">
          <div class="post-header">
            <strong>${escapeHtml(m.username)}</strong>
            <span class="time">${escapeHtml(m.date)}</span>
          </div>
          <p class="post-body">${escapeHtml(m.text)}</p>
          <div class="post-actions">
            <button class="delete-btn" data-index="${messages.length - 1 - idx}">Eliminar</button>
          </div>
        </article>
      `;
    }).join('');
    // attach delete handlers
    Array.from(messagesDiv.querySelectorAll('.delete-btn')).forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(btn.getAttribute('data-index'));
        deleteMessage(idx);
      });
    });
  }

  function addMessage(username, text){
    const messages = loadMessages();
    messages.push({
      username: String(username).slice(0,30),
      text: String(text).slice(0,500),
      date: new Date().toLocaleString()
    });
    saveMessages(messages);
    renderMessages();
  }

  function deleteMessage(index){
    const messages = loadMessages();
    if(index >=0 && index < messages.length){
      messages.splice(index,1);
      saveMessages(messages);
      renderMessages();
    }
  }

  function escapeHtml(str){ return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }

  if(forumForm){
    forumForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value.trim() || 'Anónimo';
      const message = document.getElementById('message').value.trim();
      if(!message) return;
      // If Firebase is configured, try to push there; otherwise use localStorage
      if(window.firebase && firebase.database){
        try {
          const db = firebase.database();
          const ref = db.ref('community/messages');
          ref.push({ username, text: message, date: new Date().toLocaleString() });
        } catch(err){ console.warn('Firebase push falló, guardando localmente', err); addMessage(username, message); }
      } else {
        addMessage(username, message);
      }
      forumForm.reset();
    });
    clearForumBtn && clearForumBtn.addEventListener('click', () => {
      if(confirm('Borrar todos los mensajes locales? Esto no afecta una base remota.')){
        localStorage.removeItem(STORAGE_KEY);
        renderMessages();
      }
    });
  }
  // Initial render (try Firebase read if available)
  if(window.firebase && firebase.database){
    try {
      const db = firebase.database();
      const ref = db.ref('community/messages');
      ref.off(); // remove previous listeners if any
      ref.limitToLast(200).on('value', snapshot => {
        const val = snapshot.val();
        const arr = [];
        for(let k in val) arr.push(val[k]);
        // Save a cached copy locally too
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
        renderMessages();
      }, err => {
        console.warn('Firebase read error, loading local messages', err);
        renderMessages();
      });
    } catch(e){
      console.warn('Firebase not ready, using localStorage', e);
      renderMessages();
    }
  } else {
    renderMessages();
  }

  // ---------- Calendar (birthdays) ----------
  const BKEY = 'communityBirthdays_v1';
  const calendarEl = document.getElementById('calendar');
  const monthYearEl = document.getElementById('monthYear');
  const prevBtn = document.getElementById('prevMonth');
  const nextBtn = document.getElementById('nextMonth');
  const birthdayListEl = document.getElementById('birthdayList');
  const modal = document.getElementById('birthdayModal');
  const closeModalBtn = document.getElementById('closeModal');
  const cancelModalBtn = document.getElementById('cancelModal');
  const birthdayForm = document.getElementById('birthdayForm');
  const bNameInput = document.getElementById('bName');
  const bDateInput = document.getElementById('bDate');

  let today = new Date();
  let currentMonth = today.getMonth();
  let currentYear = today.getFullYear();

  function loadBirthdays(){
    try {
      const raw = localStorage.getItem(BKEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e){ console.error('Error leyendo cumpleaños:', e); return []; }
  }
  function saveBirthdays(list){ localStorage.setItem(BKEY, JSON.stringify(list)); }

  function getBirthdaysForMonth(year, month){
    const all = loadBirthdays();
    return all.filter(b => {
      const d = new Date(b.date);
      return d.getFullYear() === year || true; // store full-year but highlight by month-day
    }).filter(b => {
      const d = new Date(b.date);
      return d.getMonth() === month;
    });
  }

  function renderBirthdayList(year, month){
    const list = loadBirthdays().filter(b => new Date(b.date).getMonth() === month);
    if(list.length === 0){
      birthdayListEl.innerHTML = '<li class="muted">No hay cumpleaños este mes</li>';
      return;
    }
    birthdayListEl.innerHTML = list.map((b,idx) => {
      const d = new Date(b.date);
      return `<li>${escapeHtml(b.name)} — ${d.getDate()}/${d.getMonth()+1} <button class="del-bday" data-index="${idx}">Eliminar</button></li>`;
    }).join('');
    Array.from(birthdayListEl.querySelectorAll('.del-bday')).forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(btn.getAttribute('data-index'));
        deleteBirthdayByIndex(year, month, idx);
      });
    });
  }

  function deleteBirthdayByIndex(year, month, idx){
    // Remove nth birthday of that month (careful: the index is local to filtered list)
    const all = loadBirthdays();
    const filtered = all.filter(b => new Date(b.date).getMonth() === month);
    const target = filtered[idx];
    if(!target) return;
    // find its index in all
    const allIdx = all.findIndex(x => x.name === target.name && x.date === target.date);
    if(allIdx >= 0){
      if(confirm('Eliminar este cumpleaños?')){
        all.splice(allIdx,1);
        saveBirthdays(all);
        renderCalendar(currentYear, currentMonth);
      }
    }
  }

  function renderCalendar(year, month){
    if(!calendarEl) return;
    // set header
    const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    monthYearEl.textContent = `${monthNames[month]} ${year}`;

    calendarEl.innerHTML = '';
    // day names
    const dayNames = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
    dayNames.forEach(dn => {
      const cell = document.createElement('div');
      cell.className = 'calendar-cell calendar-header';
      cell.textContent = dn;
      calendarEl.appendChild(cell);
    });

    const firstDay = new Date(year, month, 1);
    const startDay = (firstDay.getDay() + 6) % 7; // convert Sun(0) to 6 so Monday = 0
    const daysInMonth = new Date(year, month+1, 0).getDate();

    // fill empty cells before the 1st
    for(let i=0;i<startDay;i++){
      const empty = document.createElement('div');
      empty.className = 'calendar-cell empty';
      calendarEl.appendChild(empty);
    }

    const allBirthdays = loadBirthdays();
    for(let d=1; d<=daysInMonth; d++){
      const cell = document.createElement('div');
      cell.className = 'calendar-cell day';
      const fullDate = new Date(year, month, d);
      cell.innerHTML = `<div class="date-num">${d}</div>`;

      // find birthdays on this day (ignoring year)
      const matches = allBirthdays.filter(b => {
        const bd = new Date(b.date);
        return bd.getDate() === d && bd.getMonth() === month;
      });
      if(matches.length){
        const badge = document.createElement('div');
        badge.className = 'birthday-badge';
        badge.textContent = matches.length;
        cell.appendChild(badge);
      }

      cell.addEventListener('click', () => {
        openBirthdayModal(fullDate);
      });

      calendarEl.appendChild(cell);
    }

    renderBirthdayList(year, month);
  }

  function openBirthdayModal(dateObj){
    modal.setAttribute('aria-hidden','false');
    modal.classList.add('open');
    const iso = dateObj.toISOString().slice(0,10);
    bDateInput.value = iso;
    bNameInput.focus();
  }

  function closeModal(){
    modal.setAttribute('aria-hidden','true');
    modal.classList.remove('open');
    birthdayForm.reset();
  }

  prevBtn && prevBtn.addEventListener('click', () => {
    currentMonth--;
    if(currentMonth < 0){ currentMonth = 11; currentYear--; }
    renderCalendar(currentYear, currentMonth);
  });
  nextBtn && nextBtn.addEventListener('click', () => {
    currentMonth++;
    if(currentMonth > 11){ currentMonth = 0; currentYear++; }
    renderCalendar(currentYear, currentMonth);
  });

  closeModalBtn && closeModalBtn.addEventListener('click', closeModal);
  cancelModalBtn && cancelModalBtn.addEventListener('click', closeModal);

  birthdayForm && birthdayForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = bNameInput.value.trim();
    const date = bDateInput.value;
    if(!name || !date) return;
    const all = loadBirthdays();
    all.push({ name, date });
    saveBirthdays(all);
    closeModal();
    renderCalendar(currentYear, currentMonth);
  });

  // helper to delete by exact match
  function deleteBirthday(name, date){
    const all = loadBirthdays();
    const idx = all.findIndex(b => b.name === name && b.date === date);
    if(idx >= 0){ all.splice(idx,1); saveBirthdays(all); renderCalendar(currentYear, currentMonth); }
  }

  // initial render
  renderCalendar(currentYear, currentMonth);

  // Utility: escapeHtml same as above (duplicate OK scope)
  function escapeHtml(str){ return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }

})();