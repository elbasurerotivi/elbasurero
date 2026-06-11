
const partidos = [

  {
    id: 1,
    local: "México",
    visitante: "Sudáfrica",
    resultado: "empate"
  },

  {
    id: 2,
    local: "Argentina",
    visitante: "Brasil",
    resultado: "Argentina"
  }

];


/*
====================================
PREDICCIONES
====================================
*/

const predicciones = [

  {
    participante: "Juan",
    partidoId: 1,
    prediccion: "empate"
  },

  {
    participante: "Pedro",
    partidoId: 1,
    prediccion: "México"
  },

  {
    participante: "Juan",
    partidoId: 2,
    prediccion: "Argentina"
  },

  {
    participante: "Pedro",
    partidoId: 2,
    prediccion: "Brasil"
  }

];


/*
====================================
GENERAR TABLA
====================================
*/

const estadisticas = {};

predicciones.forEach(pred => {

  const partido = partidos.find(
    p => p.id === pred.partidoId
  );

  if(!partido) return;

  if(!estadisticas[pred.participante]){

    estadisticas[pred.participante] = {
      nombre: pred.participante,
      ganados:0,
      empatados:0,
      perdidos:0,
      puntos:0
    };

  }

  const jugador = estadisticas[pred.participante];

  if(pred.prediccion === partido.resultado){

    jugador.ganados++;
    jugador.puntos++;

  }else{

    jugador.perdidos++;

  }

});


/*
====================================
ORDENAR
====================================
*/

const ranking = Object.values(estadisticas)
.sort((a,b) => {

  if(b.puntos !== a.puntos){
    return b.puntos - a.puntos;
  }

  return b.ganados - a.ganados;

});


/*
====================================
RENDER TABLA
====================================
*/

const tbody = document.querySelector("#tablaPosiciones tbody");

ranking.forEach((jugador,index) => {

  const tr = document.createElement("tr");

  if(index === 0){
    tr.classList.add("top1");
  }

  if(index === 1){
    tr.classList.add("top2");
  }

  if(index === 2){
    tr.classList.add("top3");
  }

  tr.innerHTML = `
  
    <td class="posicion">
      ${index + 1}
    </td>

    <td>
      ${jugador.nombre}
    </td>

    <td>
      ${jugador.ganados}
    </td>

    <td>
      ${jugador.empatados}
    </td>

    <td>
      ${jugador.perdidos}
    </td>

    <td>
      ${jugador.puntos}
    </td>

  `;

  tbody.appendChild(tr);

});


/*
====================================
RENDER PARTIDOS
====================================
*/

const listaPartidos = document.getElementById("listaPartidos");

partidos.forEach(partido => {

  const div = document.createElement("div");

  div.classList.add("partido");

  div.innerHTML = `
  
    <div>
      ${partido.local}
      vs
      ${partido.visitante}
    </div>

    <div class="resultado">
      Resultado:
      ${partido.resultado}
    </div>

  `;

  listaPartidos.appendChild(div);

});
