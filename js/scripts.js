// Toggle menú en móviles
document.querySelector('.menu-toggle').addEventListener('click', () => {
    document.querySelector('.nav-menu').classList.toggle('active');
});

// Ejemplo de carga dinámica de videos (puedes integrarlo con la API de YouTube más adelante)
const videos = [
    { title: '🌄 Reacción a un video sobre San Luis, Argentina 🇦🇷 | Descubriendo provincias', url: 'https://www.youtube.com/watch?v=sdR4Tw0xT6w' },
    { title: '🍫 Lunes de Mariano: Reacción a Mariano Rodríguez, Willy Wonka y la fábrica de chocolate (1971) 🎬', url: 'https://www.youtube.com/watch?v=gfFO4uTJZiU' }
];

const videoGrid = document.getElementById('video-grid');
videos.forEach(video => {
    const videoCard = document.createElement('div');
    videoCard.innerHTML = `<h3>${video.title}</h3><a href="${video.url}" target="_blank">Ver video</a>`;
    videoGrid.appendChild(videoCard);
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


// MENU HAMBURGUESA
const mobileMenu = document.getElementById("mobile-menu");
const navMenu = document.querySelector(".nav-menu");

mobileMenu.addEventListener("click", () => {
  mobileMenu.classList.toggle("active");
  navMenu.classList.toggle("active");
});
