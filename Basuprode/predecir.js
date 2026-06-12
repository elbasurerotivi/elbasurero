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
PARTIDO ACTIVO
====================================
*/

const partido = {

  id:1,

  local:"México",

  visitante:"Sudáfrica"

};


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
RENDER
====================================
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

  const votoRef = ref(
    db,
    `prode/predicciones/${partido.id}/${usuarioActual.uid}`
  );



  /*
  ================================
  VERIFICAR SI YA VOTÓ
  ================================
  */

  const snapshot =
  await get(votoRef);

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

  await set(votoRef, {

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
