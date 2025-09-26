// Importar Firebase
import { db, ref, push, onValue, remove, update } from "./firebase-config.js";

/* ========================
   CHAT / MURO
======================== */
const wall = document.getElementById("community-wall");
const form = document.getElementById("message-form");
const nameInput = document.getElementById("name");
const messageInput = document.getElementById("message");

// Referencia en Firebase
const messagesRef = ref(db, "messages");

// Paleta de colores para nombres
const colors = ["#e74c3c", "#2ecc71", "#3498db", "#f39c12", "#9b59b6", "#1abc9c"];
function getRandomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}

// Enviar mensaje
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const text = messageInput.value.trim();
  if (!name || !text) return;

  push(messagesRef, {
    name,
    text,
    timestamp: Date.now(),
    color: getRandomColor(),
    reactions: { likes: 0 }
  });

  messageInput.value = "";
});

// Mostrar mensajes en tiempo real
onValue(messagesRef, (snapshot) => {
  const msgs = [];
  snapshot.forEach((child) => msgs.push({ id: child.key, ...child.val() }));
  msgs.sort((a, b) => b.timestamp - a.timestamp); // más nuevo primero

  wall.innerHTML = "";
  msgs.forEach((data) => {
    const div = document.createElement("div");
    div.classList.add("message");

    div.innerHTML = `
      <div class="msg-header">
        <strong style="color:${data.color || "#000"}">${data.name}</strong>
        <span class="msg-time">${new Date(data.timestamp).toLocaleString("es-AR")}</span>
      </div>
      <p>${data.text}</p>
      <div class="msg-actions">
        <button class="like-btn">👍 ${data.reactions?.likes || 0}</button>
        <button class="encanta-btn">❤️ ${data.reactions?.encanta || 0}</button>
        <button class="edit-btn">Editar</button>
        <button class="delete-btn">Eliminar</button>
      </div>
    `;

    // Reaccionar
    div.querySelector(".like-btn").addEventListener("click", () => {
      update(ref(db, "messages/" + data.id + "/reactions"), {
        likes: (data.reactions?.likes || 0) + 1
      });
    });

    // Editar
    div.querySelector(".edit-btn").addEventListener("click", () => {
      const nuevoTexto = prompt("Editar mensaje:", data.text);
      if (nuevoTexto) {
        update(ref(db, "messages/" + data.id), { text: nuevoTexto });
      }
    });

    // Eliminar
    div.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm("¿Seguro que quieres eliminar este mensaje?")) {
        remove(ref(db, "messages/" + data.id));
      }
    });

    wall.appendChild(div);
  });
});

/* ========================
   CALENDARIO DE CUMPLEAÑOS
======================== */
const birthdayForm = document.getElementById("birthday-form");
const birthdayList = document.getElementById("birthday-list");

const birthdaysRef = ref(db, "birthdays");

// Guardar cumpleaños
birthdayForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("bday-name").value.trim();
  const date = document.getElementById("bday-date").value;
  if (!name || !date) return;

  push(birthdaysRef, { name, date });
  birthdayForm.reset();
});

// Mostrar cumpleaños ordenados
onValue(birthdaysRef, (snapshot) => {
  const arr = [];
  snapshot.forEach((child) => arr.push({ id: child.key, ...child.val() }));
  arr.sort((a, b) => new Date(a.date) - new Date(b.date));

  birthdayList.innerHTML = "";
  arr.forEach((data) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="name">${data.name}</span>
      <span class="date">${new Date(data.date).toLocaleDateString("es-AR")}</span>
      <div class="bday-actions">
        <button class="edit-bday">Editar</button>
        <button class="delete-bday">Eliminar</button>
      </div>
    `;

    // Editar cumpleaños
    li.querySelector(".edit-bday").addEventListener("click", () => {
      const nuevoNombre = prompt("Nuevo nombre:", data.name) || data.name;
      const nuevaFecha = prompt("Nueva fecha (YYYY-MM-DD):", data.date) || data.date;
      update(ref(db, "birthdays/" + data.id), { name: nuevoNombre, date: nuevaFecha });
    });

    // Eliminar cumpleaños
    li.querySelector(".delete-bday").addEventListener("click", () => {
      if (confirm("¿Seguro que quieres eliminar este cumpleaños?")) {
        remove(ref(db, "birthdays/" + data.id));
      }
    });

    birthdayList.appendChild(li);
  });
});
