
const partidos = [

  {
    id: 1,
    Local: "México",
    Visitante: "Sudáfrica",
    resultado: "Local"
  },

  {
    id: 2,
    Local: "Korea del Sur",
    Visitante: "Chequia",
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

    Local: [
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

    Visitante: [
      "Lautaro Gomez",
      "Adriana Larosa",
      "Agostina",
      "Juancho",
      "Blanqui"
    ],

    Empate: [
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


  /*
  ================================
  RESULTADO Local
  ================================
  */

  if(partido.resultado === partido.Local){
    pred.Local.forEach(nombre => {
      crearJugador(nombre);
      estadisticas[nombre].ganados++;
      estadisticas[nombre].puntos++;
    });


    pred.Visitante.forEach(nombre => {
      crearJugador(nombre);
      estadisticas[nombre].perdidos++;
    });


    pred.Empate.forEach(nombre => {
      crearJugador(nombre);
      estadisticas[nombre].perdidos++;
    });
  }


  /*
  ================================
  RESULTADO Visitante
  ================================
  */

  if(partido.resultado === partido.Visitante){
    pred.Visitante.forEach(nombre => {
      crearJugador(nombre);
      estadisticas[nombre].ganados++;
      estadisticas[nombre].puntos++;
    });


    pred.Local.forEach(nombre => {
      crearJugador(nombre);
      estadisticas[nombre].perdidos++;
    });


    pred.Empate.forEach(nombre => {
      crearJugador(nombre);
      estadisticas[nombre].perdidos++;
    });
  }


  /*
  ================================
  RESULTADO Empate
  ================================
  */

  if(
    partido.resultado.toLowerCase()
    ===
    "Empate"
  ){
    pred.Empate.forEach(nombre => {
      crearJugador(nombre);
      estadisticas[nombre].empatados++;
      estadisticas[nombre].puntos++;
    });


    pred.Local.forEach(nombre => {
      crearJugador(nombre);
      estadisticas[nombre].perdidos++;
    });


    pred.Visitante.forEach(nombre => {
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
      ${partido.Local}
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
