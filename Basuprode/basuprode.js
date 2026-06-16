const flags = {

  "Argentina":"ar",
  "Brasil":"br",
  "Francia":"fr",
  "España":"es",
  "Portugal":"pt",
  "Alemania":"de",
  "México":"mx",
  "Uruguay":"uy",
  "Inglaterra":"gb",
  "Estados Unidos":"us",
  "Canadá":"ca",
  "Japón":"jp",
  "Corea del Sur":"kr",
  "Australia":"au",
  "Marruecos":"ma",
  "Arabia Saudita":"sa",
  "Croacia":"hr",
  "Colombia":"co",
  "Bélgica":"be",
  "Países Bajos":"nl",
  "Suiza":"ch",
  "Austria":"at",
  "Suecia":"se",
  "Noruega":"no",
  "Paraguay":"py",
  "Ecuador":"ec",
  "Ghana":"gh",
  "Panamá":"pa",
  "Senegal":"sn",
  "Egipto":"eg",
  "Irán":"ir",
  "Catar":"qa",
  "Sudáfrica":"za",
  "Túnez":"tn",
  "Argelia":"dz",
  "Irak":"iq",
  "Jordania":"jo",
  "Nueva Zelanda":"nz",
  "Uzbekistán":"uz",
  "Turquía":"tr",
  "Escocia":"gb-sct",
  "Chequia":"cz",
  "Bosnia y Herzegovina":"ba",
  "Costa de Marfil":"ci",
  "Cabo Verde":"cv",
  "Curazao":"cw",
  "Haití":"ht",
  "República Democrática del Congo":"cd"

};

function getFlag(nombrePais){

  const codigo = flags[nombrePais];

  if(!codigo){
    return "";
  }

  return `
    <img
      class="flag"
      src="Imagenes/flags/${codigo}.svg"
      alt="${nombrePais}"
    >
  `;
}

const partidos = [
  {
    id: 1,
    local: "México",
    visitante: "Sudáfrica",
    golesLocal: 2,
    golesVisitante: 0,
    resultado: "local"
  },
  {
    id: 2,
    local: "Corea del Sur",
    visitante: "Chequia",
    golesLocal: 2,
    golesVisitante: 1,
    resultado: "local"
  },
  {
    id: 3,
    local: "Irán",
    visitante: "Nueva Zelanda",
    golesLocal: 0,
    golesVisitante: 0,
    resultado: "Empate"
  },
  {
    id: 4,
    local: "Francia",
    visitante: "Senegal",
    golesLocal: 0,
    golesVisitante: 0,
    resultado: "Mañana"
  },
  {
    id: 5,
    local: "Irak",
    visitante: "Noruega",
    golesLocal: 0,
    golesVisitante: 0,
    resultado: "Mañana"
  },
  {
    id: 6,
    local: "Argentina",
    visitante: "Argelia",
    golesLocal: 0,
    golesVisitante: 0,
    resultado: "Mañana"
  },
  
  
];

/*
====================================
PREDICCIONES
====================================
*/

const predicciones = [

  {
    partidoId: 3,

    local: [
      "Charvolta",
      "Cintia",
      "Dave",
      "Diego",
      "Ezequiel Camacho",
      "Luciano",
      "Favio",
      "Dario",
      "Caesar M. Rangel",
      "johanmastropiero",
    ],

    visitante: [
      "Rafa",
      "Gonza",
      "Jorge",
      "Patito",
      "Diego Jacquier",
    ],

    empate: [
      "Charly!",
      "dannabless"
    ]
  },

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
      "Lucia Suárez",
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
  div.onclick = () => abrirPartido(partido.id);
  div.innerHTML = `

    <div class="equipos">

  <div class="equipo">
    ${getFlag(partido.local)}
    <span>${partido.local}</span>
  </div>

  <span class="vs">
    vs
  </span>

  <div class="equipo">
    ${getFlag(partido.visitante)}
    <span>${partido.visitante}</span>
  </div>

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


/*
====================================
MODAL PARTIDO
====================================
*/

const modalPartido =
document.getElementById("modalPartido");

const contenidoPartido =
document.getElementById("contenidoPartido");

const cerrarModalPartido =
document.getElementById("cerrarModalPartido");

/*
====================================
ABRIR PARTIDO
====================================
*/

function abrirPartido(id){

  const partido =
  partidos.find(p => p.id === id);

  if(!partido) return;

  const pred =
  predicciones.find(
    p => p.partidoId === id
  );

  let ganador = "Próximamente";

  if(partido.resultado === "local"){
    ganador = partido.local;
  }

  if(partido.resultado === "visitante"){
    ganador = partido.visitante;
  }

  if(partido.resultado === "empate"){
    ganador = "Empate";
  }

  /*
  ================================
  ACIERTOS / FALLOS
  ================================
  */

  const aciertos = [];
  const fallos = [];

  if(pred){

    ["local","visitante","empate"]
    .forEach(tipo => {

      pred[tipo].forEach(nombre => {

        let texto = "";

        if(tipo === "local"){
          texto = partido.local;
        }

        if(tipo === "visitante"){
          texto = partido.visitante;
        }

        if(tipo === "empate"){
          texto = "Empate";
        }

        const html = `
          <div class="pred-item">
            <strong>${nombre}</strong>
            <br>
            Predicción:
            ${texto}
          </div>
        `;

        if(tipo === partido.resultado){

          aciertos.push(html);

        }else{

          fallos.push(html);
        }

      });

    });

  }


  /*
  ================================
  RENDER
  ================================
  */

  contenidoPartido.innerHTML = `

    <div class="partido-header">

      <div class="partido-equipos">

        <div class="partido-equipo">

          <img
            src="Imagenes/flags/${flags[partido.local]}.svg"
          >

          <span>
            ${partido.local}
          </span>

        </div>

        <div class="partido-vs">
          VS
        </div>

        <div class="partido-equipo">

          <img
            src="Imagenes/flags/${flags[partido.visitante]}.svg"
          >

          <span>
            ${partido.visitante}
          </span>

        </div>

      </div>

      <div class="resultado-oficial">
        ${partido.local}
        ${partido.golesLocal ?? "-"}
        -
        ${partido.golesVisitante ?? "-"}
        ${partido.visitante}
      </div>
<div class="ganador-oficial">
  Ganador:
  ${ganador}
</div>
    </div>

    <div class="predicciones-grid">

      <div class="pred-columna aciertos">

        <h3>
          ✅ Aciertos
        </h3>

        ${
          aciertos.length
          ? aciertos.join("")
          : "<p>Sin aciertos</p>"
        }

      </div>

      <div class="pred-columna fallos">

        <h3>
          ❌ Fallos
        </h3>

        ${
          fallos.length
          ? fallos.join("")
          : "<p>Sin fallos</p>"
        }

      </div>

    </div>

  `;

  modalPartido.classList.add(
    "activo"
  );

}


/*
====================================
CERRAR MODAL
====================================
*/

cerrarModalPartido.addEventListener(
  "click",
  () => {

    modalPartido.classList.remove(
      "activo"
    );
  }
);


/*
====================================
CLICK FUERA
====================================
*/

modalPartido.addEventListener(
  "click",
  e => {

    if(e.target === modalPartido){

      modalPartido.classList.remove(
        "activo"
      );
    }
  }
);
