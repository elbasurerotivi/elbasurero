// Importar Firebase
import { db, ref, push, onValue, remove, update, set } from "./firebase-config.js";

/* ========================
   CHAT / MURO
======================== */
const wall = document.getElementById("community-wall");
const form = document.getElementById("message-form");
const nameInput = document.getElementById("name");
const messageInput = document.getElementById("message");

// Referencia en Firebase
const messagesRef = ref(db, "messages");

// Paleta de colores
const colors = ["#e74c3c", "#2ecc71", "#3498db", "#f39c12", "#9b59b6", "#1abc9c"];
function getRandomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}

// Enviar mensaje
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = nameInput.value.trim() || "Anónimo";
  const text = messageInput.value.trim();
  if (!text) return;

  push(messagesRef, {
    name,
    text,
    timestamp: Date.now(),
    color: getRandomColor(),
    reactions: { likes: {}, encanta: {} } // 👈 objetos vacíos
  });

  messageInput.value = "";
});

// Mostrar mensajes
onValue(messagesRef, (snapshot) => {
  const msgs = [];
  snapshot.forEach((child) => msgs.push({ id: child.key, ...child.val() }));
  msgs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  wall.innerHTML = "";
  msgs.forEach((data) => {
    const likesCount = data.reactions?.likes ? Object.keys(data.reactions.likes).length : 0;
    const encantaCount = data.reactions?.encanta ? Object.keys(data.reactions.encanta).length : 0;

    const div = document.createElement("div");
    div.classList.add("message");

    div.innerHTML = `
      <div class="msg-header">
        <strong style="color:${data.color || "#000"}">${data.name}</strong>
        <span class="msg-time">${new Date(data.timestamp || Date.now()).toLocaleString("es-AR")}</span>
      </div>
      <p>${data.text}</p>
      <div class="msg-actions">
        <button class="like-btn">👍 ${likesCount}</button>
        <button class="encanta-btn">❤️ ${encantaCount}</button>
        <button class="edit-btn">Editar</button>
        <button class="delete-btn">Eliminar</button>
      </div>
    `;

    // Usuario actual
    const user = nameInput.value.trim() || "Anónimo";

    // Toggle like
    div.querySelector(".like-btn").addEventListener("click", () => {
      const path = ref(db, `messages/${data.id}/reactions/likes/${user}`);
      if (data.reactions?.likes?.[user]) {
        remove(path); // quitar reacción
      } else {
        set(path, true); // agregar reacción
      }
    });

    // Toggle encanta
    div.querySelector(".encanta-btn").addEventListener("click", () => {
      const path = ref(db, `messages/${data.id}/reactions/encanta/${user}`);
      if (data.reactions?.encanta?.[user]) {
        remove(path);
      } else {
        set(path, true);
      }
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
