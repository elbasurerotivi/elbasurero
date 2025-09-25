document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("forum-form");
  const messagesDiv = document.getElementById("messages");

  // Enviar mensaje a Firebase
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const text = document.getElementById("message").value.trim();

    if (username && text) {
      const newMessage = {
        username,
        text,
        time: new Date().toLocaleString(),
        likes: 0
      };

      db.ref("messages").push(newMessage);
      form.reset();
    }
  });

  // Mostrar mensajes en tiempo real
  db.ref("messages").on("value", (snapshot) => {
    messagesDiv.innerHTML = "";
    snapshot.forEach((childSnapshot) => {
      const msg = childSnapshot.val();
      const messageEl = document.createElement("div");
      messageEl.classList.add("post");

      messageEl.innerHTML = `
        <div class="post-header">
          <strong>${msg.username}</strong> <span class="time">${msg.time}</span>
        </div>
        <p>${msg.text}</p>
      `;

      messagesDiv.prepend(messageEl);
    });
  });
});
