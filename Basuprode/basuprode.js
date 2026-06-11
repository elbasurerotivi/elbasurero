
const partidos = [

  {
    id: 1,
    local: "México",
    visitante: "Sudáfrica",
    resultado: "local"
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
    partidoId: 1,

    local: [
      "Lucia Suárez",
      "Angie",
      "Charsvolta",
      "Andrea",
      "Gustavo",
      "Mai",
      "La Corrupción Mata",
      "A",
      "KarlangaxGD",
      "Xpupumbus",
      "Pepe",
      "Soledad",
      "Diego",
      "Davincho"

    ],

    visitante: [
      "Lautaro Gomez",
      "Adriana Larosa",
      "Agostina",
      "Juancho",
      "Blanqui"
    ],

    empate: [
      "Rafa",
      "Patito",
      "Gonza",
      "Charly",
    ]
  }

];


/*
====================================
GENERAR TABLA
====================================
*/

const estadisticas = {};

/*
====================================
CREAR JUGADOR
====================================
*/

function crearJugador(nombre){
  if(!estadisticas[nombre]){
    estadisticas[nombre] = {
      nombre: nombre,
      ganados:0,
      empatados:0,
      perdidos:0,
      puntos:0
    };
  }
}

/*
====================================
SUMAR ACIERTOS
====================================
*/

predicciones.forEach(pred => {

  const partido = partidos.find(
    p => p.id === pred.partidoId
  );

  if(!partido) return;

  if(
    partido.resultado === "proximamente"
  ) return;



  /*
  ================================
  GANÓ LOCAL
  ================================
  */

  if(partido.resultado === "local"){

    pred.local.forEach(nombre => {

      crearJugador(nombre);

      estadisticas[nombre].ganados++;
      estadisticas[nombre].puntos++;

    });

    pred.visitante.forEach(nombre => {

      crearJugador(nombre);

      estadisticas[nombre].perdidos++;

    });

    pred.empate.forEach(nombre => {

      crearJugador(nombre);

      estadisticas[nombre].perdidos++;

    });

  }



  /*
  ================================
  GANÓ VISITANTE
  ================================
  */

  if(partido.resultado === "visitante"){

    pred.visitante.forEach(nombre => {

      crearJugador(nombre);

      estadisticas[nombre].ganados++;
      estadisticas[nombre].puntos++;

    });

    pred.local.forEach(nombre => {

      crearJugador(nombre);

      estadisticas[nombre].perdidos++;

    });

    pred.empate.forEach(nombre => {

      crearJugador(nombre);

      estadisticas[nombre].perdidos++;

    });

  }



  /*
  ================================
  EMPATE
  ================================
  */

  if(partido.resultado === "empate"){

    pred.empate.forEach(nombre => {

      crearJugador(nombre);

      estadisticas[nombre].empatados++;
      estadisticas[nombre].puntos++;

    });

    pred.local.forEach(nombre => {

      crearJugador(nombre);

      estadisticas[nombre].perdidos++;

    });

    pred.visitante.forEach(nombre => {

      crearJugador(nombre);

      estadisticas[nombre].perdidos++;

    });

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
    ${
        partido.resultado === "local"
        ? partido.local

        : partido.resultado === "visitante"
        ? partido.visitante

        : partido.resultado === "empate"
        ? "Empate"

        : "Próximamente"
    }
    </div>


  `;

  listaPartidos.appendChild(div);

});
