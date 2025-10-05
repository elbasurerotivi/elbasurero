import { auth, db, ref, push, onValue, set, remove, get } from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", () => {
  /* ========================
   MURO DE MENSAJES
  ======================== */
  const wall = document.getElementById("community-wall");
  const form = document.getElementById("message-form");
  const messageInput = document.getElementById("message");
  const messagesRef = ref(db, "messages");

  // UID persistente para likes no autenticados
  let userId = localStorage.getItem("userId");
  if (!userId) {
    userId = "user_" + Math.random().toString(36).substring(2, 9);
    localStorage.setItem("userId", userId);
  }

  // Sincronizar userId con auth.currentUser.uid si está autenticado
  auth.onAuthStateChanged((user) => {
    if (user) {
      userId = user.uid;
      localStorage.setItem("userId", userId);
    }
  });

  // Función para desplazar al último mensaje
  function scrollToBottom() {
    if (wall) {
      wall.scrollTo({
        top: wall.scrollHeight,
        behavior: "smooth"
      });
    }
  }

  // Enviar mensaje
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      accionProtegida(async () => {
        const user = auth.currentUser;
        let username = "Anónimo";
        if (user) {
          const userRef = ref(db, `users/${user.uid}`);
          const snapshot = await get(userRef);
          username = snapshot.exists() ? snapshot.val().username || "Anónimo" : "Anónimo";
        }
        const message = messageInput.value.trim();
        if (message) {
          await push(messagesRef, {
            name: username,
            text: message,
            timestamp: Date.now(),
            likes: {}
          })
            .then(() => {
              messageInput.value = "";
              scrollToBottom();
            })
            .catch(err => {
              console.error("Error enviando mensaje:", err);
              alert("Error al enviar mensaje: " + err.message);
            });
        }
      });
    });
  }

  // Mostrar mensajes en tiempo real
  if (wall) {
    onValue(messagesRef, (snapshot) => {
      wall.innerHTML = "";
      snapshot.forEach((child) => {
        const data = child.val();
        const messageId = child.key;
        const likesCount = data.likes ? Object.keys(data.likes).length : 0;
        const userLiked = data.likes && data.likes[userId];

        const div = document.createElement("div");
        div.className = "message";
        div.innerHTML = `
          <div class="message-header">
            <strong>${escapeHtml(data.name)}</strong>
            <span>${new Date(data.timestamp).toLocaleString("es-AR")}</span>
          </div>
          <p class="message-text">${escapeHtml(data.text)}</p>
          <div class="message-actions">
            <div class="like-wrapper">
              <button class="like-btn ${userLiked ? "active" : ""}">❤️</button>
              <span class="like-count ${userLiked ? "active" : ""}">${likesCount}</span>
            </div>
          </div>
        `;

        const likeBtn = div.querySelector(".like-btn");
        likeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          accionProtegida(() => {
            const uid = auth.currentUser ? auth.currentUser.uid : userId;
            const likeRef = ref(db, `messages/${messageId}/likes/${uid}`);
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
            }).catch(err => console.error("Error al actualizar like:", err));
          });
        });

        wall.appendChild(div);
      });
      scrollToBottom();
    }, (err) => {
      console.error("Error al cargar mensajes:", err);
      if (err.code === "PERMISSION_DENIED") {
        wall.innerHTML = '<p>No tienes permiso para ver los mensajes. <a href="#" onclick="abrirLogin()">Inicia sesión</a>.</p>';
      }
    });
  }


    /* ========================
     CALENDARIO DE CUMPLEAÑOS
  ======================== */
  const birthdayForm = document.getElementById("birthday-form");
  const birthdayList = document.getElementById("birthday-list");
  let calendarEl = document.getElementById("calendar");
  let monthLabel = document.getElementById("month-label");
  let prevBtn = document.getElementById("prev-month");
  let nextBtn = document.getElementById("next-month");
  const birthdaysRef = ref(db, "birthdays");
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let allBirthdays = [];

  // Crear estructura del calendario si falta
  function ensureCalendarStructure() {
    if (!calendarEl) {
      const wrapper = document.querySelector(".calendar-wrapper") || document.querySelector(".community-calendar");
      if (wrapper) {
        calendarEl = document.createElement("div");
        calendarEl.id = "calendar";
        wrapper.appendChild(calendarEl);
      }
    }

    if (!monthLabel || !prevBtn || !nextBtn) {
      const parent = calendarEl ? calendarEl.parentElement : document.querySelector(".community-calendar");
      if (parent) {
        const controls = document.createElement("div");
        controls.className = "calendar-controls";
        const p = document.createElement("button"); p.id = "prev-month"; p.type = "button"; p.textContent = "◀";
        const m = document.createElement("span"); m.id = "month-label";
        const n = document.createElement("button"); n.id = "next-month"; n.type = "button"; n.textContent = "▶";
        controls.appendChild(p);
        controls.appendChild(m);
        controls.appendChild(n);
        if (calendarEl) parent.insertBefore(controls, calendarEl);
        else parent.appendChild(controls);
        monthLabel = m;
        prevBtn = p;
        nextBtn = n;
      }
    }
  }

  ensureCalendarStructure();

  // Guardar cumpleaños
  if (birthdayForm) {
    birthdayForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      accionProtegida(async () => {
        const name = document.getElementById("bday-name")?.value.trim();
        const date = document.getElementById("bday-date")?.value;
        if (!name || !date) {
          alert("Por favor, completa todos los campos.");
          return;
        }
        await push(birthdaysRef, { name, date })
          .then(() => {
            birthdayForm.reset();
          })
          .catch(err => {
            console.error("Error guardando cumpleaños:", err);
            alert("Error al guardar cumpleaños: " + err.message);
          });
      });
    });
  }

  // Escuchar cumpleaños en tiempo real
  if (birthdayList) {
    onValue(birthdaysRef, (snapshot) => {
      try {
        allBirthdays = [];
        snapshot.forEach(child => {
          allBirthdays.push({ id: child.key, ...child.val() });
        });
        if (birthdayList) renderBirthdayList();
        if (calendarEl) renderCalendar();
      } catch (err) {
        console.error("Error onValue birthdays:", err);
      }
    }, (err) => {
      console.error("Error al cargar cumpleaños:", err);
      if (err.code === "PERMISSION_DENIED") {
        birthdayList.innerHTML = '<p>No tienes permiso para ver los cumpleaños. <a href="#" onclick="abrirLogin()">Inicia sesión</a>.</p>';
      }
    });
  }

  // Render lista ordenada por mes/día
  function renderBirthdayList() {
    birthdayList.innerHTML = "";
    const sorted = [...allBirthdays].sort((a, b) => {
      const [, ma, da] = (a.date || "0000-00-00").split("-").map(Number);
      const [, mb, db] = (b.date || "0000-00-00").split("-").map(Number);
      return (ma - mb) || (da - db);
    });

    sorted.forEach(data => {
      const [y = "", m = "", d = ""] = (data.date || "").split("-");
      const fecha = `${String(d).padStart(2, "0")}-${String(m).padStart(2, "0")}-${y}`;
      const li = document.createElement("li");
      li.className = "bday-item";
      li.innerHTML = `
        <span class="bday-info"><strong>${escapeHtml(data.name)}</strong> (${escapeHtml(fecha)})</span>
        <div class="bday-actions">
          <button class="edit-bday" type="button">✏️</button>
          <button class="delete-bday" type="button">🗑️</button>
        </div>
      `;
      const editBtn = li.querySelector(".edit-bday");
      editBtn?.addEventListener("click", () => {
        const nuevoNombre = prompt("Nuevo nombre:", data.name);
        const nuevaFecha = prompt("Nueva fecha (AAAA-MM-DD):", data.date);
        if (!nuevoNombre || !nuevaFecha) return;
        if (!confirm("¿Confirmar cambios?")) return;
        const updateRef = ref(db, "birthdays/" + data.id);
        set(updateRef, { name: nuevoNombre, date: nuevaFecha })
          .catch(err => console.error("Error actualizando cumpleaños:", err));
      });
      const deleteBtn = li.querySelector(".delete-bday");
      deleteBtn?.addEventListener("click", () => {
        if (!confirm("¿Seguro que quieres eliminar este cumpleaños?")) return;
        const deleteRef = ref(db, "birthdays/" + data.id);
        remove(deleteRef).catch(err => console.error("Error eliminando cumpleaños:", err));
      });
      birthdayList.appendChild(li);
    });
  }

  // Render calendario del mes actual
  function renderCalendar() {
    if (!calendarEl || !monthLabel) return;
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
    monthLabel.textContent = new Date(currentYear, currentMonth, 1)
      .toLocaleString("es-ES", { month: "long", year: "numeric" });
    let html = `<table class="calendar-table">
      <thead>
        <tr>
          <th>Dom</th><th>Lun</th><th>Mar</th><th>Mié</th><th>Jue</th><th>Vie</th><th>Sáb</th>
        </tr>
      </thead>
      <tbody><tr>`;
    let dayOfWeek = firstDay;
    for (let i = 0; i < dayOfWeek; i++) html += "<td></td>";
    for (let day = 1; day <= lastDate; day++) {
      const yyyy = String(currentYear);
      const mm = String(currentMonth + 1).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      const currentDate = `${yyyy}-${mm}-${dd}`;
      const people = allBirthdays.filter(b => b.date === currentDate).map(b => b.name);
      const tooltip = people.length ? people.join(", ") : "";
      const hasBirthday = people.length > 0;
      html += `<td class="${hasBirthday ? "birthday-cell" : ""}" title="${escapeHtml(tooltip)}">${day}</td>`;
      dayOfWeek++;
      if (dayOfWeek === 7 && day < lastDate) {
        html += "</tr><tr>";
        dayOfWeek = 0;
      }
    }
    html += "</tr></tbody></table>";
    calendarEl.innerHTML = html;
  }

  // Navegación del calendario
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      renderCalendar();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      renderCalendar();
    });
  }

  // Utilidad: escapar HTML
  function escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
});