/// header ///

document.addEventListener("DOMContentLoaded", () => {
  // Cargar header dinámico
  fetch("header.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("header-placeholder").innerHTML = data;

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





