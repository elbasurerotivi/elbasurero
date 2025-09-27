// js/firebase-config.js
// Firebase v9 modular - Realtime Database
// REEMPLAZA los valores de firebaseConfig con los de tu proyecto (desde Firebase Console)

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";


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


const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };
