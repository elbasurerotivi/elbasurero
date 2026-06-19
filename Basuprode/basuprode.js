import {auth, db, ref, set, get, remove}
from "../js/firebase-config.js";

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

let partidos = []

/*const partidos = [
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
    resultado: "empate"
  },
  {
    id: 4,
    local: "Canadá",
    visitante: "Catar",
    golesLocal: 3,
    golesVisitante: 0,
    resultado: "local"
  },
  {
    id: 5,
    local: "Inglaterra",
    visitante: "Croacia",
    golesLocal: 4,
    golesVisitante: 2,
    resultado: "local"
  },
    {
    id: 6,
    local: "México",
    visitante: "Corea del Sur",
    golesLocal: 1,
    golesVisitante: 0,
    resultado: "local"
  },
  
  {
    id: 7,
    local: "Estados Unidos",
    visitante: "Australia",
    golesLocal: null,
    golesVisitante: null,
    resultado: "proximamente"
  },

  {
    id: 8,
    local: "Escocia",
    visitante: "Marruecos",
    golesLocal: null,
    golesVisitante: null,
    resultado: "proximamente"
  },

  {
    id: 9,
    local: "Brasil",
    visitante: "Haití",
    golesLocal: null,
    golesVisitante: null,
    resultado: "proximamente"
  },
  
  
];*/

/*
====================================
PREDICCIONES
====================================
*/

/*const predicciones = [
    {
    partidoId: 9,

    local: [
        ],

    visitante: [
        ],

    empate: [
        ]
  },
  {
    partidoId: 8,

    local: [
        ],

    visitante: [
        ],

    empate: [
        ]
  },
  {
    partidoId: 7,

    local: [
        ],

    visitante: [
        ],

    empate: [
        ]
  },

  {
    partidoId: 6,

    local: [
    "Charsvolta",
    "Gustavo",
    "Rafa",
    "Gonza",
    "Patito",
    "Cintia",
    "Darío",
    "Favio",
    "Diego Jacquier",
    "Juan Pablo Saenz",
    "Blanqui",
    "Dave",
    "Cundo"
    ],

    visitante: [
    "Javier Martín Sanchez",
    "Javier",
    "Lucía Suarez",
    "5ombr4",
    "Franco",
    "Javier Acosta",
    "Juancho",
    "Agus"
    ],

    empate: [
      "Naty Alvarez",
      "Andrea",
      "EL MESSIAS",
      "Karlanga",
      "Pepe",
      "Charly!",
      "soledad",
      "Adriana Larosa"
    
    ]
  },

  {
    partidoId: 5,

    local: [
      "Davincho",
      "Patito",
      "Cundo",
      "M",
    ],

    visitante: [
      "5ombr4",
      "Agostina",
      "Favio",
      "Pepe",
    ],

    empate: [
      "Rafa",
      "Emma"
    
    ]
  },

  {
    partidoId: 4,

    local: [
    "Charsvolta",
    "Diego Jacquier",
    "Dalkiano",
    "Andrea",
    "Darío",
    "Patito",
    "Karlanga",
    "Favio",
    "Pepe",
    "Charly!",
    "Cintia",
    "Agus",
    
    ],

    visitante: [
    
    ],

    empate: [
    "Blanqui",
    "5ombr4"
    ]
  },

  {
    partidoId: 3,

    local: [
      "Cintia",
      "Dave",
      "Diego",
      "Ezequiel Camacho",
      "Luciano",
      "Favio",
      "Darío",
      "Caesar M Rangel",
      "johanmastropiero",
    ],

    visitante: [
      "Rafa",
      "Gonza",
      "Jorge",
      "Patito",
      "Diego Jacquier",
      "Charsvolta"
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
      "Darío",
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
      "Lucía Suarez",
      "Angie",
      "Charsvolta",
      "Andrea",
      "Gustavo",
      "Mai",
      "La Corrupción Mata",
      "A",
      "Karlanga",
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
      "Charly!",
    ]
  }

];*/

let prediccionesFirebase = {};

async function generarRankingFirebase(){

  const estadisticas = {};

  function crearJugador(nombre){

    if(!estadisticas[nombre]){

      estadisticas[nombre] = {
        nombre,
        puntos: 0,
        participaciones: 0,
        ganados: 0,
        empatados: 0,
        perdidos: 0
      };

    }

  }

  partidos.forEach(partido => {

    const apuestasPartido =
    prediccionesFirebase[partido.id];

    if(!apuestasPartido){
      return;
    }

    Object.values(apuestasPartido)
    .forEach(apuesta => {

      const nombre =
      apuesta.nombre;

      crearJugador(nombre);

      estadisticas[nombre]
      .participaciones++;

      if(
        partido.resultado ===
        "proximamente"
      ){
        return;
      }

      if(
        apuesta.resultado ===
        partido.resultado
      ){

        estadisticas[nombre]
        .ganados++;

        estadisticas[nombre]
        .puntos++;

        if(
          partido.resultado ===
          "empate"
        ){

          estadisticas[nombre]
          .empatados++;

        }

      }else{

        estadisticas[nombre]
        .perdidos++;

      }

    });

  });

  return Object.values(
    estadisticas
  ).sort((a,b) => {

    if(
      b.puntos !== a.puntos
    ){
      return b.puntos - a.puntos;
    }

    return b.participaciones -
    a.participaciones;

  });

}

async function renderRankingFirebase(){

  const ranking =
  await generarRankingFirebase();

  const tbody =
  document.querySelector(
    "#tablaPosiciones tbody"
  );

  tbody.innerHTML = "";

  ranking.forEach(
    (jugador,index) => {

      const tr =
      document.createElement("tr");

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

        <td>
          ${jugador.nombre}
        </td>

        <td>
          ${jugador.puntos}
        </td>

        <td>
          ${jugador.participaciones}
        </td>

        <td>
          ${jugador.ganados}
        </td>

        <td>
          ${jugador.perdidos}
        </td>

      `;

      tbody.appendChild(tr);

    }
  );

}


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
      puntos:0,
      participaciones:0,
      ganados:0,
      empatados:0,
      perdidos:0,
    };
  }
}


/*predicciones.forEach(pred => {

  const partido = partidos.find(
    p => p.id === pred.partidoId
  );

  if(!partido) return;

  /*
  ====================================
  CONTAR PARTICIPACIONES
  ====================================
  */
/*
  [
    ...pred.local,
    ...pred.visitante,
    ...pred.empate
  ].forEach(nombre => {

    crearJugador(nombre);

    estadisticas[nombre].participaciones++;

  });*/

  /*
  ====================================
  SI EL PARTIDO NO TIENE RESULTADO
  ====================================
  */
/*
  if(partido.resultado === "proximamente"){
    return;
  }*/

  /*
  ================================
  GANÓ LOCAL
  ================================
  */
/*
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
/*
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
/*
  if(partido.resultado === "empate"){

    pred.empate.forEach(nombre => {
    crearJugador(nombre);
    estadisticas[nombre].ganados++;
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

  if(b.participaciones !== a.participaciones){
    return b.participaciones - a.participaciones;
  }

  return a.nombre.localeCompare(
    b.nombre,
    "es",
    { sensitivity: "base" }
  );

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
     onclick="abrirHistorialFirebase('${jugador.nombre}')"
    
    >
    ${jugador.nombre}
    </td>

    <td>
      ${jugador.puntos}
    </td>

    <td>
      ${jugador.participaciones}
    </td>

    <td>
      ${jugador.ganados}
    </td>

    <td>
      ${jugador.perdidos}
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

  console.log(
    "ABRIENDO HISTORIAL DE:",
    nombre
  );


  modal.classList.add("activo");

  modalTitulo.innerText =
  `Historial de ${nombre}`;

  modalBody.innerHTML = "";

  Object.entries(prediccionesFirebase)
  .forEach(([partidoId, apuestas]) => {

    const partido = partidos.find(
      p => p.id == partidoId
    );

    if(!partido) return;

    Object.values(apuestas)
    .forEach(apuesta => {

      if(apuesta.nombre !== nombre){
        return;
      }

      const prediccionJugador =
      apuesta.resultado;

      const acerto =
      prediccionJugador ===
      partido.resultado;

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

  });

}

window.abrirHistorial = abrirHistorial; 
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
  
  const esProximo =
  partido.resultado ===
  "proximamente";

  /*const pred =
  predicciones.find(
    p => p.partidoId === id
  );*/

  const pred = null;

  const predFirebase =
  prediccionesFirebase[id] || {};

  const user = auth.currentUser;

  const apuestaUsuario =
  user
  ? predFirebase[user.uid]
  : null;


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

  /*if(pred){

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

  }*/

  Object.values(predFirebase)
.forEach(apuesta => {

  let texto = "";

  if(apuesta.resultado === "local"){
    texto = partido.local;
  }

  if(apuesta.resultado === "visitante"){
    texto = partido.visitante;
  }

  if(apuesta.resultado === "empate"){
    texto = "Empate";
  }

  const html = `
    <div class="pred-item">
      <strong>${apuesta.nombre}</strong>
      <br>
      Predicción:
      ${texto}
    </div>
  `;

  if(
  partido.resultado ===
  "proximamente"
){

  aciertos.push(html);

}else if(
  apuesta.resultado ===
  partido.resultado
){

  aciertos.push(html);

}else{

  fallos.push(html);

}

});


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
${
esProximo
?
`
<div class="zona-apuesta">

  ${
    apuestaUsuario
    ?
    `
      <h3>
        ✅ Ya hiciste tu predicción
      </h3>

      <p>
        Elegiste:
        <strong>
          ${
            apuestaUsuario.resultado === "local"
            ? partido.local
            : apuestaUsuario.resultado === "visitante"
            ? partido.visitante
            : "Empate"
          }
        </strong>
      </p>

      <button
        onclick="eliminarPrediccion(${id})"
      >
        Eliminar predicción
      </button>
    `
    :
    `
      <h3>
        🎯 Hacer predicción
      </h3>

      <div class="opciones-apuesta">

        <button
          onclick="apostar(${id},'local')"
        >
          ${partido.local}
        </button>

        <button
          onclick="apostar(${id},'empate')"
        >
          Empate
        </button>

        <button
          onclick="apostar(${id},'visitante')"
        >
          ${partido.visitante}
        </button>

      </div>
    `
  }

</div>
`
:
""
}

    </div>

    ${
!esProximo
?
`
<div class="predicciones-grid">

  <div class="pred-columna aciertos">

    <h3>
      ✅ Aciertos (${aciertos.length})
    </h3>

    ${
      aciertos.length
      ? aciertos.join("")
      : "<p>Sin aciertos</p>"
    }

  </div>

  <div class="pred-columna fallos">

    <h3>
      ❌ Fallos (${fallos.length})
    </h3>

    ${
      fallos.length
      ? fallos.join("")
      : "<p>Sin fallos</p>"
    }

  </div>

</div>
`
:
`
<div class="predicciones-full">

  <div class="predicciones-unicas">

    <h3>
      👥 Predicciones (${aciertos.length})
    </h3>

    ${
      aciertos.length
      ? aciertos.join("")
      : "<p>Aún no hay predicciones</p>"
    }

  </div>

</div>
`
}

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

/*
====================================
GUARDAR PREDICCIÓN
====================================
*/

async function guardarPrediccion(
  partidoId,
  resultado
){

  const user = auth.currentUser;

  if(!user){

    alert(
      "Debes iniciar sesión para participar."
    );

    return;
  }

  try{

    const predRef = ref(
      db,
      `basuprode/predicciones/${partidoId}/${user.uid}`
    );

    await set(predRef, {

      uid: user.uid,

      nombre:
        user.displayName ||
        user.email.split("@")[0],

      resultado,

      timestamp: Date.now()

    });

    await cargarPrediccionesFirebase();
    generarRanking();

    abrirPartido(partidoId);

    alert(
      "✅ Predicción guardada"
    );

  }catch(error){

    console.error(error);

    alert(
      "Error al guardar la predicción"
    );

  }

}
/*
====================================
APOSTAR
====================================
*/

window.apostar = function(
  id,
  resultado
){

  guardarPrediccion(
    id,
    resultado
  );

};

window.eliminarPrediccion =
function(id){

  const confirmar =
  confirm(
    "¿Deseas eliminar tu predicción?"
  );

  if(!confirmar){
    return;
  }

  eliminarPrediccion(id);

};

async function eliminarPrediccion(
  partidoId
){

  const user = auth.currentUser;

  if(!user) return;

  try{

    await remove(
      ref(
        db,
        `basuprode/predicciones/${partidoId}/${user.uid}`
      )
    );

    await cargarPrediccionesFirebase();
    generarRanking();

    abrirPartido(partidoId);

    alert(
      "🗑️ Predicción eliminada"
    );

  }catch(error){

    console.error(error);

    alert(
      "Error al eliminar la predicción"
    );

  }

}

async function cargarPrediccionesFirebase() {

  try {

    const snapshot = await get(
      ref(
        db,
        "basuprode/predicciones"
      )
    );

    if(snapshot.exists()){

      prediccionesFirebase =
      snapshot.val();

      await renderRankingFirebase();

    }else{

      prediccionesFirebase = {};

    }

  } catch(error){

    console.error(
      "Error cargando predicciones:",
      error
    );

  }

}

cargarPrediccionesFirebase();
window.abrirHistorialFirebase =
async function(nombre){

  console.log(
    "Abriendo historial de:",
    nombre
  );

};
async function cargarPartidosFirebase(){

  const snap = await get(
    ref(db,"basuprode/partidos")
  );

  if(!snap.exists()){

    partidos = [];
    return;

  }

  partidos = Object.values(
    snap.val()
  );

}