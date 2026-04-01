import { db, ref, onValue } from "./firebase-config.js";

let notifCountEl;

document.addEventListener("DOMContentLoaded", () => {
  notifCountEl = document.getElementById("notifCount");
});

if (!notifCountEl) return;

export function initNotifications() {
  const videosRef = ref(db, "videos");

  onValue(videosRef, (snapshot) => {
    let total = 0;

    snapshot.forEach(videoSnap => {
      const data = videoSnap.val();

      // contar comentarios
      if (data.comments) {
        total += Object.keys(data.comments).length;
      }

      // contar likes
      total += data.likesCount || 0;
    });

    notifCountEl.textContent = total;
  });
}
import { db, ref, onValue } from "./firebase-config.js";

let notifCountEl;
let notifPanel;

export function initNotifications() {

  notifCountEl = document.getElementById("notifCount");
  notifPanel = document.getElementById("notifPanel");
  const bell = document.getElementById("notifBell");

  if (!notifCountEl || !notifPanel || !bell) return;

  // Toggle panel
  bell.addEventListener("click", () => {
    notifPanel.style.display =
      notifPanel.style.display === "block" ? "none" : "block";
  });

  const videosRef = ref(db, "videos");

  onValue(videosRef, (snapshot) => {
    let total = 0;
    let notifications = [];

    snapshot.forEach(videoSnap => {
      const videoId = videoSnap.key;
      const data = videoSnap.val();

      // === LIKES ===
      if (data.likesCount) {
        total += data.likesCount;

        notifications.push({
          text: `👍 Nuevo like en video`,
          videoId
        });
      }

      // === COMENTARIOS ===
      if (data.comments) {
        const comments = Object.values(data.comments);

        comments.forEach(c => {
          notifications.push({
            text: `💬 ${c.userName} comentó`,
            videoId
          });

          // === RESPUESTAS ===
          if (c.replies) {
            Object.values(c.replies).forEach(r => {
              notifications.push({
                text: `↩️ ${r.userName} respondió`,
                videoId
              });
            });
          }
        });

        total += comments.length;
      }
    });

    notifCountEl.textContent = total;

    renderNotifications(notifications);
  });
}

function renderNotifications(list) {
  notifPanel.innerHTML = "";

  if (list.length === 0) {
    notifPanel.innerHTML = "<p>Sin notificaciones</p>";
    return;
  }

  // mostrar últimas 10
  list.slice(-10).reverse().forEach(n => {
    const div = document.createElement("div");
    div.className = "notif-item";
    div.textContent = n.text;

    div.onclick = () => {
      window.location.href = `player.html?id=${n.videoId}`;
    };

    notifPanel.appendChild(div);
  });
}