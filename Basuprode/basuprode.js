
const partidos = [
  {
    id: 1,
    local: "México 2",
    visitante: "Sudáfrica 0",
    resultado: "local"
  },
  {
    id: 2,
    local: "Corea del Sur",
    visitante: "Chequia",
    resultado: "Entretiempo"
  },
  {
    id: 3,
    local: "Canadá",
    visitante: "Bosnia y Herzegovina",
    resultado: "12/06"
  },
  {
    id: 4,
    local: "Estados Unidos",
    visitante: "Paraguay",
    resultado: "12/06"
  },
  {
    id: 5,
    local: "Catar",
    visitante: "Suiza",
    resultado: "13/06"
  },
  {
    id: 6,
    local: "Brasil",
    visitante: "Marruecos",
    resultado: "13/06"
  },
  
  
];

/*
====================================
PREDICCIONES
====================================
*/

const predicciones = [

  {
    partidoId: 2,

    local: [
      "Charsvolta",
      "Maiira",
      "Javier Acosta",
      "Andrea",
      "Rafa",
      "Davincho",
      "Favio",
      "Dario",
      "Soledad",
      "Ivan Gonzalez",
      "A",
      "Ezequiel Camacho",
      "Blanqui",
      "Franco",
      "Nelson Gonzalez"
    ],

    visitante: [
      "Lautaro Gomez",
      "Javier Martín Sánchez",
      "Juancho"
    ],

    empate: [
      "Pantera",
      "Angie",
      "Diego",
      "Patito",
      "Pepe",
      "Lucía Suarez",
      "Ivan"
    ]
  },

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
    ${
    index === 0
    ? "🥇1"
    : index === 1
    ? "🥈2"
    : index === 2
    ? "🥉3"
    : index + 1
    }
    </td>

    <td
    class="nombre-click"
    onclick="abrirHistorial('${jugador.nombre}')"
    >
    ${jugador.nombre}
    </td>


    <td>
      ${jugador.ganados}
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


/*
====================================
MODAL HISTORIAL
====================================
*/

const modal =
document.getElementById("modalHistorial");

const modalTitulo =
document.getElementById("modalTitulo");

const modalBody =
document.getElementById("modalBody");

const cerrarModal =
document.getElementById("cerrarModal");


/*
====================================
ABRIR HISTORIAL
====================================
*/

function abrirHistorial(nombre){

  modal.classList.add("activo");

  modalTitulo.innerText =
  `Historial de ${nombre}`;

  modalBody.innerHTML = "";

  predicciones.forEach(pred => {

    const partido = partidos.find(
      p => p.id === pred.partidoId
    );

    if(!partido) return;

    let prediccionJugador = null;

    if(
      pred.local.includes(nombre)
    ){
      prediccionJugador = "local";
    }

    if(
      pred.visitante.includes(nombre)
    ){
      prediccionJugador = "visitante";
    }

    if(
      pred.empate.includes(nombre)
    ){
      prediccionJugador = "empate";
    }


    if(!prediccionJugador) return;


    const acerto =
    prediccionJugador === partido.resultado;


    const div =
    document.createElement("div");

    div.classList.add(
      "historial-item"
    );

    div.classList.add(
      acerto
      ? "historial-acierto"
      : "historial-error"
    );


    let textoPrediccion = "";

    if(prediccionJugador === "local"){
      textoPrediccion =
      partido.local;
    }

    if(prediccionJugador === "visitante"){
      textoPrediccion =
      partido.visitante;
    }

    if(prediccionJugador === "empate"){
      textoPrediccion =
      "Empate";
    }


    let textoResultado = "";

    if(partido.resultado === "local"){
      textoResultado =
      partido.local;
    }

    if(partido.resultado === "visitante"){
      textoResultado =
      partido.visitante;
    }

    if(partido.resultado === "empate"){
      textoResultado =
      "Empate";
    }

    if(partido.resultado === "proximamente"){
      textoResultado =
      "Próximamente";
    }


    div.innerHTML = `
    
      <strong>
        ${partido.local}
        vs
        ${partido.visitante}
      </strong>

      <br><br>

      Predicción:
      <strong>
        ${textoPrediccion}
      </strong>

      <br>

      Resultado:
      <strong>
        ${textoResultado}
      </strong>

      <br><br>

      ${
        acerto
        ? "✅ Acierto"
        : "❌ Falló"
      }

    `;

    modalBody.appendChild(div);

  });

}


/*
====================================
CERRAR MODAL
====================================
*/

cerrarModal.addEventListener(
  "click",
  () => {

    modal.classList.remove(
      "activo"
    );

  }
);


/*
====================================
CLICK FUERA
====================================
*/

modal.addEventListener(
  "click",
  e => {

    if(e.target === modal){

      modal.classList.remove(
        "activo"
      );

    }

  }
);
