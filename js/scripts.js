/// header ///

document.addEventListener("DOMContentLoaded", () => {
  // Cargar header dinámico
  fetch("header.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("header").innerHTML = data;

      // Vuelve a enganchar la lógica del menú hamburguesa
      const mobileMenu = document.getElementById("mobile-menu");
      const navMenu = document.querySelector(".nav-menu");

      if (mobileMenu && navMenu) {
        mobileMenu.addEventListener("click", () => {
          mobileMenu.classList.toggle("active");
          navMenu.classList.toggle("active");
        });
      }
    })
    .catch(err => console.error("Error cargando header:", err));


     // Cargar footer dinámico
  fetch("footer.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("footer").innerHTML = data;
   
});




/// Comunidad ///
document.getElementById('forum-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const message = document.getElementById('message').value;
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');
    messages.push({ username, message, date: new Date().toLocaleString() });
    localStorage.setItem('messages', JSON.stringify(messages));
    displayMessages();
});

function displayMessages() {
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = messages.map(m => `<p><strong>${m.username}</strong> (${m.date}): ${m.message}</p>`).join('');
}
displayMessages();




///Recomendaciones////


document.getElementById('recommend-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value || 'Anónimo';
    const recommendation = document.getElementById('recommendation').value;
    const recommendations = JSON.parse(localStorage.getItem('recommendations') || '[]');
    recommendations.push({ name, recommendation, date: new Date().toLocaleString() });
    localStorage.setItem('recommendations', JSON.stringify(recommendations));
    displayRecommendations();
});

function displayRecommendations() {
    const recommendations = JSON.parse(localStorage.getItem('recommendations') || '[]');
    const list = document.getElementById('recommendations-list');
    list.innerHTML = recommendations.map(r => `<p><strong>${r.name}</strong> (${r.date}): ${r.recommendation}</p>`).join('');
}
displayRecommendations();

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("forum-form");
  const messagesDiv = document.getElementById("messages");

  // Cargar mensajes guardados en LocalStorage
  let messages = JSON.parse(localStorage.getItem("messages")) || [];

  function renderMessages() {
    messagesDiv.innerHTML = "";
    messages.forEach((msg, index) => {
      const messageEl = document.createElement("div");
      messageEl.classList.add("post");

      messageEl.innerHTML = `
        <div class="post-header">
          <strong>${msg.username}</strong> <span class="time">${msg.time}</span>
        </div>
        <p>${msg.text}</p>
        <div class="post-actions">
          <button onclick="likePost(${index})">👍 ${msg.likes}</button>
          <button onclick="deletePost(${index})">🗑️ Eliminar</button>
        </div>
      `;

      messagesDiv.appendChild(messageEl);
    });
  }

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

      messages.unshift(newMessage); // al inicio, estilo muro
      localStorage.setItem("messages", JSON.stringify(messages));
      renderMessages();

      form.reset();
    }
  });

  // Funciones globales para botones
  window.likePost = function(index) {
    messages[index].likes++;
    localStorage.setItem("messages", JSON.stringify(messages));
    renderMessages();
  };

  window.deletePost = function(index) {
    messages.splice(index, 1);
    localStorage.setItem("messages", JSON.stringify(messages));
    renderMessages();
  };

  // Render inicial
  renderMessages();
});




