// Importar Firebase desde firebase-config.js
import { db, ref, push, onValue } from "./firebase-config.js";

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
  const msgs = [];
  snapshot.forEach((child) => msgs.push({ id: child.key, ...child.val() }));

  // Ordenar: más nuevo arriba
  msgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  msgs.reverse();

  wall.innerHTML = "";
  msgs.forEach((data) => {
    const likesCount = data.reactions?.likes ? Object.keys(data.reactions.likes).length : 0;
    const encantaCount = data.reactions?.encanta ? Object.keys(data.reactions.encanta).length : 0;

    const div = document.createElement("div");
    div.classList.add("message");

    div.innerHTML = `
      <div class="msg-header">
        <strong style="color:${data.color || "#000"}">${data.name}</strong>
        <span class="msg-time">${data.timestamp ? new Date(data.timestamp).toLocaleString("es-AR") : ""}</span>
      </div>
      <p>${data.text || ""}</p>
      <div class="msg-actions">
        <button class="like-btn">👍 ${likesCount}</button>
        <button class="encanta-btn">❤️ ${encantaCount}</button>
        <button class="edit-btn">Editar</button>
        <button class="delete-btn">Eliminar</button>
      </div>
    `;

    wall.appendChild(div);
  });

  // 👇 Esto asegura que siempre se vea el último mensaje
  wall.scrollTop = 0;
});


/* ========================
   CALENDARIO DE CUMPLEAÑOS
======================== */
const birthdayForm = document.getElementById("birthday-form");
const birthdayList = document.getElementById("birthday-list");

const birthdaysRef = ref(db, "birthdays");

// Enviar cumpleaños
birthdayForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("bday-name").value.trim();
  const date = document.getElementById("bday-date").value;

  if (name && date) {
    push(birthdaysRef, { name, date });
    birthdayForm.reset();
  }
});

// Mostrar cumpleaños en tiempo real
onValue(birthdaysRef, (snapshot) => {
  birthdayList.innerHTML = "";
  snapshot.forEach((child) => {
    const data = child.val();
    const li = document.createElement("li");
    li.textContent = `${data.name} 🎂 (${data.date})`;
    birthdayList.appendChild(li);
  });
});
