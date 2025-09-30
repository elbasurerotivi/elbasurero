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




