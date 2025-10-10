// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, push, onValue, set, remove, get, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Configuración de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDqj18mvS9a4Ud3Y0voD5wolrhL3bSnhUw",
  authDomain: "elbasurero-af722.firebaseapp.com",
  databaseURL: "https://elbasurero-af722-default-rtdb.firebaseio.com",
  projectId: "elbasurero-af722",
  storageBucket: "elbasurero-af722.firebasestorage.app",
  messagingSenderId: "577473118837",
  appId: "1:577473118837:web:6a6ab394c6cec3bff36e3c"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Exportar todo lo necesario
export { auth, db, ref, push, onValue, set, remove, get, update };