// Importar Firebase desde firebase-config.js
import { db, ref, push, onValue }
from "./firebase-config.js";
/* ======================== MURO DE MENSAJES ======================== */
const wall = document.getElementById("community-wall");
const form = document.getElementById("message-form");
const nameInput = document.getElementById("name");
const messageInput = document.getElementById("message");

// Referencia a mensajes en Firebase
const messagesRef = ref(db, "messages");

// Enviar mensaje
form.addEventListener("submit", (e) => { e.preventDefault();
  const name = nameInput.value.trim();
  const message = messageInput.value.trim();
  if (name && message) { push(messagesRef, { name, text: message, timestamp: Date.now() });
  messageInput.value = ""; } });
  
  // Mostrar mensajes en tiempo real
  onValue(messagesRef, (snapshot) => { wall.innerHTML = "";
    snapshot.forEach((child) => { const data = child.val();
      const div = document.createElement("div");
      div.classList.add("message");
      div.innerHTML = <strong>${data.name}</strong>: ${data.text};
      wall.appendChild(div);
      
      // Siempre mostrar el último mensaje arriba
      wall.scrollTop = 0; }); });
      
      /* ======================== CALENDARIO DE CUMPLEAÑOS ======================== */
      const birthdayForm = document.getElementById("birthday-form");
      const birthdayList = document.getElementById("birthday-list");
      const birthdaysRef = ref(db, "birthdays");
      
      // Enviar cumpleaños
      birthdayForm.addEventListener("submit", (e) => { e.preventDefault();
        const name = document.getElementById("bday-name").value.trim();
        const date = document.getElementById("bday-date").value;
        if (name && date) { push(birthdaysRef, { name, date });
        birthdayForm.reset(); } });
        
        // Mostrar cumpleaños en tiempo real
        onValue(birthdaysRef, (snapshot) => { birthdayList.innerHTML = "";
          snapshot.forEach((child) => { const data = child.val();
            const li = document.createElement("li");
            li.textContent = ${data.name} 🎂 (${data.date});
            birthdayList.appendChild(li);
          });
        });