
const partidos = [

  {
    id: 1,
    local: "México",
    visitante: "Sudáfrica",
    resultado: "México"
  },

  {
    id: 2,
    local: "Korea del Sur",
    visitante: "Chequia",
    resultado: "Próximamente"
  }

];


/*
====================================
PREDICCIONES
====================================
*/

const predicciones = [

  {
    participante: "Lucia Suárez",
    partidoId: 1,
    prediccion: "México"
  },
  {
    participante: "Angie",
    partidoId: 1,
    prediccion: "México"
  },
  {
    participante: "Charsvolta",
    partidoId: 1,
    prediccion: "México"
  },
  {
    participante: "Andrea",
    partidoId: 1,
    prediccion: "México"
  },
  {
    participante: "Gustavo",
    partidoId: 1,
    prediccion: "México"
  },
  {
    participante: "Mai",
    partidoId: 1,
    prediccion: "México"
  },
  {
    participante: "La Corrupción Mata",
    partidoId: 1,
    prediccion: "México"
  },
  {
    participante: "A",
    partidoId: 1,
    prediccion: "México"
  },
  {
    participante: "Gracias Charly",
    partidoId: 1,
    prediccion: "México"
  },
  {
    participante: "Xpupumbus",
    partidoId: 1,
    prediccion: "México"
  },
  {
    participante: "Pepe",
    partidoId: 1,
    prediccion: "México"
  },
  {
    participante: "Soledad",
    partidoId: 1,
    prediccion: "México"
  },
  {
    participante: "Diego",
    partidoId: 1,
    prediccion: "México"
  },
  {
    participante: "Davincho",
    partidoId: 1,
    prediccion: "México"
  },

  {
    participante: "Lautaro Gomez",
    partidoId: 1,
    prediccion: "Sudáfrica"
  },
  {
    participante: "Adriana Larosa",
    partidoId: 1,
    prediccion: "Sudáfrica"
  },
  {
    participante: "Agostina",
    partidoId: 1,
    prediccion: "Sudáfrica"
  },
  {
    participante: "Juancho",
    partidoId: 1,
    prediccion: "Sudáfrica"
  },
  {
    participante: "Blanqui",
    partidoId: 1,
    prediccion: "Sudáfrica"
  },


  {
    participante: "Rafa",
    partidoId: 1,
    prediccion: "Empate"
  },
  {
    participante: "Patito",
    partidoId: 1,
    prediccion: "Empate"
  },
  {
    participante: "Gonza",
    partidoId: 1,
    prediccion: "Empate"
  },
  {
    participante: "Charly!",
    partidoId: 1,
    prediccion: "Empate"
  },

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
