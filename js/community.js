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

  const name = nameInput.value.trim() || "An贸nimo";

  const text = messageInput.value.trim();

  if (!text) return;



  push(messagesRef, {

    name,

    text,

    timestamp: Date.now(),

    color: getRandomColor(),

    reactions: { likes: {}, encanta: {} } // objetos vac铆os

  });



  messageInput.value = "";

});



// Mostrar mensajes en tiempo real

onValue(messagesRef, (snapshot) => {

  const msgs = [];

  snapshot.forEach((child) => msgs.push({ id: child.key, ...child.val() }));



  // Ordenar: m谩s nuevo arriba

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

        <button class="like-btn">馃憤 ${likesCount}</button>

        <button class="encanta-btn">鉂わ笍 ${encantaCount}</button>

        <button class="edit-btn">Editar</button>

        <button class="delete-btn">Eliminar</button>

      </div>

    `;



    // Usuario actual (para reacciones 煤nicas)

    const user = nameInput.value.trim() || "An贸nimo";



    // Toggle 馃憤

    div.querySelector(".like-btn").addEventListener("click", () => {

      const path = ref(db, `messages/${data.id}/reactions/likes/${user}`);

      if (data.reactions?.likes?.[user]) {

        remove(path); // quitar reacci贸n

      } else {

        set(path, true); // agregar reacci贸n

      }

    });



    // Toggle 鉂わ笍

    div.querySelector(".encanta-btn").addEventListener("click", () => {

      const path = ref(db, `messages/${data.id}/reactions/encanta/${user}`);

      if (data.reactions?.encanta?.[user]) {

        remove(path);

      } else {

        set(path, true);

      }

    });



    // Editar mensaje

    div.querySelector(".edit-btn").addEventListener("click", () => {

      const nuevoTexto = prompt("Editar mensaje:", data.text);

      if (nuevoTexto) {

        update(ref(db, "messages/" + data.id), { text: nuevoTexto });

      }

    });



    // Eliminar mensaje

    div.querySelector(".delete-btn").addEventListener("click", () => {

      if (confirm("驴Seguro que quieres eliminar este mensaje?")) {

        remove(ref(db, "messages/" + data.id));

      }

    });



    wall.appendChild(div);

  });

});



/* ========================

   CALENDARIO DE CUMPLEA脩OS

======================== */

const birthdayForm = document.getElementById("birthday-form");

const birthdayList = document.getElementById("birthday-list");



const birthdaysRef = ref(db, "birthdays");



// Guardar cumplea帽os

birthdayForm.addEventListener("submit", (e) => {

  e.preventDefault();

  const name = document.getElementById("bday-name").value.trim();

  const date = document.getElementById("bday-date").value;

  if (!name || !date) return;



  push(birthdaysRef, { name, date });

  birthdayForm.reset();

});



// Mostrar cumplea帽os ordenados

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



    // Editar cumplea帽os

    li.querySelector(".edit-bday").addEventListener("click", () => {

      const nuevoNombre = prompt("Nuevo nombre:", data.name) || data.name;

      const nuevaFecha = prompt("Nueva fecha (YYYY-MM-DD):", data.date) || data.date;

      update(ref(db, "birthdays/" + data.id), { name: nuevoNombre, date: nuevaFecha });

    });



    // Eliminar cumplea帽os

    li.querySelector(".delete-bday").addEventListener("click", () => {

      if (confirm("驴Seguro que quieres eliminar este cumplea帽os?")) {

        remove(ref(db, "birthdays/" + data.id));

      }

    });



    birthdayList.appendChild(li);

  });

});

