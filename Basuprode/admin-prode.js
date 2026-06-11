const agregarBtn = document.getElementById(
  "agregarBtn"
);

const descargarBtn = document.getElementById(
  "descargarBtn"
);

const resultado = document.getElementById(
  "resultado"
);

let fragmentos = [];



/*
========================================
AGREGAR
========================================
*/

agregarBtn.addEventListener("click", () => {

  const participante =
  document.getElementById("participante").value;

  const partidoId =
  document.getElementById("partidoId").value;

  const prediccion =
  document.getElementById("prediccion").value;

  if(
    !participante ||
    !partidoId ||
    !prediccion
  ){
    alert("Completa todos los campos");
    return;
  }

  const fragmento = `
{
  participante: "${participante}",
  partidoId: ${partidoId},
  prediccion: "${prediccion}"
},
`;

  fragmentos.push(fragmento);

  resultado.textContent =
  fragmentos.join("\n");



  /*
  ================================
  LIMPIAR CAMPOS
  ================================
  */

  document.getElementById(
    "participante"
  ).value = "";

  document.getElementById(
    "partidoId"
  ).value = "";

  document.getElementById(
    "prediccion"
  ).value = "";

});



/*
========================================
DESCARGAR
========================================
*/

descargarBtn.addEventListener("click", () => {

  if(fragmentos.length === 0){

    alert("No hay fragmentos");

    return;
  }

  const contenido =
  fragmentos.join("\n");

  const blob = new Blob(
    [contenido],
    { type:"text/javascript" }
  );

  const a = document.createElement("a");

  a.href =
  URL.createObjectURL(blob);

  a.download =
  "fragmento-basuprode.js";

  a.click();

});
