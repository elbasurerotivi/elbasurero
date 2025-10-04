// Importar Firebase desde tu config
import { db, ref, push, onValue, set, remove, get } from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", () => {
  /* ========================
   MURO DE MENSAJES
  ======================== */
  const wall = document.getElementById("community-wall");
  const form = document.getElementById("message-form");
  const nameInput = document.getElementById("name");
  const messageInput = document.getElementById("message");

  // Referencia a mensajes en Firebase
  const messagesRef = ref(db, "messages");

  // Enviar mensaje
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      window.accionProtegida(() => {
        const name = nameInput?.value.trim();
        const message = messageInput?.value.trim();
        if (name && message) {
          push(messagesRef, { name, text: message, timestamp: Date.now() });
          messageInput.value = "";
        } else {
          alert("Por favor, completa todos los campos.");
        }
      });
    });
  } else {
    console.warn("No se encontró el elemento #message-form");
  }

  // Mostrar mensajes en tiempo real
  onValue(messagesRef, (snapshot) => {
    if (wall) {
      wall.innerHTML = "";
      snapshot.forEach((child) => {
        const data = child.val();
        const div = document.createElement("div");
        div.classList.add("message");
        div.innerHTML = `<strong>${escapeHtml(data.name)}</strong>: ${escapeHtml(data.text)}`;
        wall.appendChild(div);
      });
    } else {
      console.warn("No se encontró el elemento #community-wall");
    }
  });

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
    birthdayForm.addEventListener("submit", (e) => {
      e.preventDefault();
      window.accionProtegida(() => {
        const name = document.getElementById("bday-name")?.value.trim();
        const date = document.getElementById("bday-date")?.value;
        if (!name || !date) {
          alert("Por favor, completa todos los campos.");
          return;
        }
        push(birthdaysRef, { name, date })
          .then(() => birthdayForm.reset())
          .catch(err => console.error("Error guardando cumpleaños:", err));
      });
    });
  } else {
    console.warn("No se encontró el elemento #birthday-form");
  }

  // Escuchar cumpleaños en tiempo real
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
  }, (err) => console.error("onValue birthdays error:", err));

  // Render lista ordenada por mes/día
  function renderBirthdayList() {
    if (!birthdayList) {
      console.warn("No se encontró el elemento #birthday-list");
      return;
    }
    birthdayList.innerHTML = "";

    const sorted = [...allBirthdays].sort((a, b) => {
      const [, ma, da] = (a.date || "0000-00-00").split("-").map(Number);
      const [, mb, db] = (b.date || "0000-00-00").split("-").map(Number);
      return (ma - mb) || (da - db);
    });

    sorted.forEach(data => {
      const [y = "", m = "", d = ""] = (data.date || "").split("-");
      const fecha = `${String(d).padStart(2,"0")}-${String(m).padStart(2,"0")}-${y}`;

      const li = document.createElement("li");
      li.className = "bday-item";
      li.innerHTML = `
        <span class="bday-info"><strong>${escapeHtml(data.name)}</strong> 🎂 (${escapeHtml(fecha)})</span>
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
    if (!calendarEl || !monthLabel) {
      console.warn("No se encontró el elemento #calendar o #month-label");
      return;
    }

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
  } else {
    console.warn("No se encontró el elemento #prev-month");
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      renderCalendar();
    });
  } else {
    console.warn("No se encontró el elemento #next-month");
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