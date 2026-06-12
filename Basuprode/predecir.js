import {
  auth,
  db,
  ref,
  set,
  get,
  onAuthStateChanged
}
from "../firebase-config.js";


/*
====================================
PARTIDO ID DESDE URL
====================================
*/

const params =
new URLSearchParams(
  window.location.search
);

const partidoId =
params.get("id");


/*
====================================
ELEMENTOS
====================================
*/

const partidoDiv =
document.getElementById("partido");

const mensaje =
document.getElementById("mensaje");

const btnLocal =
document.getElementById("btnLocal");

const btnEmpate =
document.getElementById("btnEmpate");

const btnVisitante =
document.getElementById("btnVisitante");


/*
====================================
PARTIDO ACTUAL
====================================
*/

let partido = null;


/*
====================================
CARGAR PARTIDO
====================================
*/

async function cargarPartido(){

  const partidoRef = ref(
    db,
    `prode/partidos/${partidoId}`
  );

  const snapshot =
  await get(partidoRef);

  if(!snapshot.exists()){

    mensaje.innerHTML =
    "Partido no encontrado.";

    return;
  }

  partido = snapshot.val();


  /*
  ================================
  RENDER
  ================================
  */

  partidoDiv.innerHTML = `
    ${partido.local}
    vs
    ${partido.visitante}
  `;

  btnLocal.innerText =
  `Gana ${partido.local}`;

  btnVisitante.innerText =
  `Gana ${partido.visitante}`;

}

cargarPartido();


/*
====================================
AUTH
====================================
*/

let usuarioActual = null;

onAuthStateChanged(auth, user => {

  if(!user){

    mensaje.innerHTML =
    "Debes iniciar sesión.";

    return;
  }

  usuarioActual = user;

});


/*
====================================
PREDECIR
====================================
*/

async function predecir(prediccion){

  if(!usuarioActual){

    mensaje.innerHTML =
    "Debes iniciar sesión.";

    return;
  }

  if(!partido){

    mensaje.innerHTML =
    "Cargando partido...";

    return;
  }


  /*
  ================================
  REFERENCIA
  ================================
  */

  const prediccionRef = ref(
    db,
    `prode/predicciones/${partidoId}/${usuarioActual.uid}`
  );


  /*
  ================================
  YA PREDIJO
  ================================
  */

  const snapshot =
  await get(prediccionRef);

  if(snapshot.exists()){

    mensaje.innerHTML =
    "Ya realizaste tu predicción.";

    return;
  }


  /*
  ================================
  GUARDAR
  ================================
  */

  await set(prediccionRef, {

    nombre:
    usuarioActual.displayName
    ||
    "Usuario",

    prediccion:
    prediccion

  });

  mensaje.innerHTML =
  "✅ Predicción enviada.";

}


/*
====================================
EVENTOS
====================================
*/

btnLocal.addEventListener(
  "click",
  () => predecir("local")
);

btnEmpate.addEventListener(
  "click",
  () => predecir("empate")
);

btnVisitante.addEventListener(
  "click",
  () => predecir("visitante")
);
