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