


/* ========================
   CALENDARIO DE CUMPLEAÑOS
======================== */
const birthdayForm = document.getElementById("birthday-form");
const birthdayList = document.getElementById("birthday-list");

const birthdaysRef = ref(db, "birthdays");

// Enviar cumpleaños
birthdayForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("bday-name").value.trim();
  const date = document.getElementById("bday-date").value;

  if (name && date) {
    push(birthdaysRef, { name, date });
    birthdayForm.reset();
  }
});

// Mostrar cumpleaños en tiempo real
onValue(birthdaysRef, (snapshot) => {
  birthdayList.innerHTML = "";
  snapshot.forEach((child) => {
    const data = child.val();
    const li = document.createElement("li");
    li.textContent = `${data.name} 🎂 (${data.date})`;
    birthdayList.appendChild(li);
  });
});
