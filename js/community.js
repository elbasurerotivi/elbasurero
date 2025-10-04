// Importar Firebase desde firebase-config.js
import { db, ref, push, onValue, set, remove } from "./firebase-config.js";


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
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const message = messageInput.value.trim();

  if (name && message) {
    push(messagesRef, {
      name,
      text: message,
      timestamp: Date.now()
    });

    messageInput.value = "";
  }
});

// Mostrar mensajes en tiempo real
onValue(messagesRef, (snapshot) => {
  wall.innerHTML = "";
  snapshot.forEach((child) => {
    const data = child.val();
    const div = document.createElement("div");
    div.classList.add("message");
    div.innerHTML = `<strong>${data.name}</strong>: ${data.text}`;
    wall.appendChild(div);
  });
});

/* ========================
   CALENDARIO DE CUMPLEAÑOS
======================== */
const birthdayForm = document.getElementById("birthday-form");
const birthdayList = document.getElementById("birthday-list");
const calendarEl = document.getElementById("calendar");
const monthLabel = document.getElementById("month-label");
const prevBtn = document.getElementById("prev-month");
const nextBtn = document.getElementById("next-month");

const birthdaysRef = ref(db, "birthdays");

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let allBirthdays = [];

// Guardar cumpleaños
birthdayForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("bday-name").value.trim();
  const date = document.getElementById("bday-date").value;

  if (name && date) {
    push(birthdaysRef, { name, date });
    birthdayForm.reset();
  }
});

// Escuchar cumpleaños
// Escuchar cumpleaños
onValue(birthdaysRef, (snapshot) => {
  allBirthdays = [];
  snapshot.forEach((child) => {
    allBirthdays.push({ id: child.key, ...child.val() }); // 👈 guardamos id + datos
  });

  renderBirthdayList();
  renderCalendar();
});

// Render lista ordenada
function renderBirthdayList() {
  birthdayList.innerHTML = "";

  const sorted = [...allBirthdays].sort((a, b) => {
    const [, ma, da] = a.date.split("-").map(Number);
    const [, mb, db] = b.date.split("-").map(Number);
    return ma - mb || da - db;
  });

  sorted.forEach((data) => {
    const [y, m, d] = data.date.split("-");
    const fecha = `${d.padStart(2, "0")}-${m.padStart(2, "0")}-${y}`;

    const li = document.createElement("li");
    li.innerHTML = `
      <span><strong>${data.name}</strong> 🎂 (${fecha})</span>
      <div class="bday-actions">
        <button class="edit-bday">✏️</button>
        <button class="delete-bday">🗑️</button>
      </div>
    `;

    // Editar cumpleaños
    li.querySelector(".edit-bday").addEventListener("click", () => {
      const nuevoNombre = prompt("Nuevo nombre:", data.name);
      const nuevaFecha = prompt("Nueva fecha (AAAA-MM-DD):", data.date);

      if (nuevoNombre && nuevaFecha) {
        if (confirm("¿Confirmar cambios?")) {
          const updateRef = ref(db, "birthdays/" + data.id);
          set(updateRef, { name: nuevoNombre, date: nuevaFecha });
        }
      }
    });

    // Eliminar cumpleaños
    li.querySelector(".delete-bday").addEventListener("click", () => {
      if (confirm("¿Seguro que quieres eliminar este cumpleaños?")) {
        const deleteRef = ref(db, "birthdays/" + data.id);
        remove(deleteRef);
      }
    });

    birthdayList.appendChild(li);
  });
}



// Render calendario
function renderCalendar() {
  const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 = domingo
  const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();

  monthLabel.textContent = new Date(currentYear, currentMonth).toLocaleString("es-ES", {
    month: "long",
    year: "numeric"
  });

  let html = `<table class="calendar-table">
    <thead>
      <tr>
        <th>Dom</th><th>Lun</th><th>Mar</th><th>Mié</th><th>Jue</th><th>Vie</th><th>Sáb</th>
      </tr>
    </thead>
    <tbody><tr>`;

  let dayOfWeek = firstDay;
  for (let i = 0; i < dayOfWeek; i++) {
    html += "<td></td>";
  }

  for (let day = 1; day <= lastDate; day++) {
  const currentDate = `${currentYear}-${String(currentMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

  const birthdayPeople = allBirthdays
    .filter(b => b.date === currentDate)
    .map(b => b.name)
    .join(", ");

  const hasBirthday = allBirthdays.some(b => b.date === currentDate);

  html += `<td class="${hasBirthday ? "birthday-cell" : ""}" title="${birthdayPeople}">
            ${day}
          </td>`;

  dayOfWeek++;
  if (dayOfWeek === 7 && day < lastDate) {
    html += "</tr><tr>";
    dayOfWeek = 0;
  }
}


const birthdayPeople = allBirthdays
  .filter(b => b.date === currentDate)
  .map(b => b.name)
  .join(", ");

html += `<td class="${hasBirthday ? "birthday-cell" : ""}" title="${birthdayPeople}">
          ${day}
        </td>`;

  html += "</tr></tbody></table>";
  calendarEl.innerHTML = html;
}

// Navegación entre meses
prevBtn.addEventListener("click", () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar();
});

nextBtn.addEventListener("click", () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
});

