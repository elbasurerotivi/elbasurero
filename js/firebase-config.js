// Importar Firebase (versión modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { 
  getDatabase, 
  ref, 
  push, 
  onValue, 
  remove, 
  update, 
  set // 👈 agregado
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

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
const db = getDatabase(app);

// Exportar
export { db, ref, push, onValue, remove, update, set };
