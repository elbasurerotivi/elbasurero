import { db, ref, onValue } from "./firebase-config.js";

export function initNotifications() {
  document.addEventListener("DOMContentLoaded", () => {

    const notifCountEl = document.getElementById("notifCount");
    const notifPanel   = document.getElementById("notifPanel");
    const notifBell    = document.getElementById("notifBell");

    if (!notifCountEl || !notifPanel || !notifBell) {
      console.warn("⚠️ Elementos de notificaciones no encontrados");
      return;
    }

    // Toggle panel
    notifBell.addEventListener("click", () => {
      notifPanel.classList.toggle("active");
    });

    const videosRef = ref(db, "videos");

    onValue(videosRef, (snapshot) => {
      let total = 0;
      let notifs = [];

      snapshot.forEach(videoSnap => {
        const videoId = videoSnap.key;
        const data = videoSnap.val();

        // 👍 Likes
        if (data.likesCount) {
          total += data.likesCount;

          notifs.push({
            type: "like",
            text: `👍 Nuevo like en un video`,
            videoId
          });
        }

        // 💬 Comentarios
        if (data.comments) {
          const comments = Object.values(data.comments);

          total += comments.length;

          comments.forEach(c => {
            notifs.push({
              type: "comment",
              text: `💬 ${c.userName} comentó: "${c.text.slice(0, 30)}..."`,
              videoId
            });

            // 🔁 Respuestas
            if (c.replies) {
              Object.values(c.replies).forEach(r => {
                notifs.push({
                  type: "reply",
                  text: `↩️ ${r.userName} respondió`,
                  videoId
                });
              });
            }
          });
        }
      });

      // contador
      notifCountEl.textContent = total;

      // panel
      renderNotifications(notifs, notifPanel);
    });
  });
}

// Render UI
function renderNotifications(notifs, panel) {
  panel.innerHTML = "";

  if (notifs.length === 0) {
    panel.innerHTML = "<p>No hay notificaciones</p>";
    return;
  }

  // últimas 10
  const latest = notifs.slice(-10).reverse();

  latest.forEach(n => {
    const item = document.createElement("div");
    item.className = "notif-item";

    item.innerHTML = `
      <p>${n.text}</p>
    `;

    item.addEventListener("click", () => {
      window.location.href = `player.html?id=${n.videoId}`;
    });

    panel.appendChild(item);
  });
}