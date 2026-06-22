import {auth, db, ref, set, get, remove, onValue}
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
let prediccionesFirebase = {};


let filtroPartidos = "";
const buscadorPartido =
document.getElementById(
  "buscarPartido"
);

buscadorPartido
.addEventListener("input", e => {

  filtroPartidos =
  e.target.value.toLowerCase();

  renderPartidos();

});

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

        <td
          class="nombre-click"
          onclick="abrirHistorial('${jugador.nombre}')"
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

});

/*
====================================
RENDER PARTIDOS
====================================
*/

const listaProximos =
document.getElementById(
  "listaProximos"
);

const listaFinalizados =
document.getElementById(
  "listaFinalizados"
);

function formatearFecha(fechaStr){

  if(!fechaStr){
    return "";
  }

  const fecha =
  new Date(fechaStr);

  return fecha.toLocaleDateString(
    "es-AR",
    {
      day:"numeric",
      month:"short"
    }
  );

}

function crearTarjetaPartido(partido){

  const div =
  document.createElement("div");

  const cantidadPredicciones =
    Object.keys(
      prediccionesFirebase[
        partido.id
      ] || {}
    ).length;

  div.classList.add("partido");

if(
  partido.resultado ===
  "proximamente"
){
  div.classList.add(
    "partido-proximo"
  );
}else{
  div.classList.add(
    "partido-finalizado"
  );
}

if(
  partido.resultado ===
  "proximamente"
){

  
  const proximos = partidos
  .filter(
    p => p.resultado === "proximamente"
  )
  .sort(
    (a,b) => a.id - b.id
  );

if(
  proximos.length &&
  proximos[0].id === partido.id
){
  div.classList.add(
    "partido-destacado"
  );
}
}

const esDestacado =
div.classList.contains(
  "partido-destacado"
);

  div.onclick = () =>
    abrirPartido(partido.id);

  div.innerHTML = `

  ${
    esDestacado
    ?
    `
      <div class="badge-nuevo">
        NUEVO
      </div>
    `
    :
    ""
  }

  ${
    partido.resultado ===
    "proximamente"
    ?
    `
      <div class="badge-abierto">
        🎯 ABIERTO
      </div>
    `
    :
    `
      <div class="badge-finalizado">
        ✓ FINALIZADO
      </div>
    `
  }

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

${
  partido.resultado !== "proximamente"
  ?
  `
  <div class="partido-fecha">

    📅 ${formatearFecha(partido.fecha)}

    ·

    🕒 ${partido.hora} hs

  </div>
  `
  :
  ""
}

<div class="resultado">

${
  partido.resultado !==
  "proximamente"
  ?
  `
  <div class="marcador">
    ${partido.golesLocal}
    -
    ${partido.golesVisitante}
  </div>
  `
  :
  `
  <div class="partido-info">

  <div>
    ${formatearFecha(partido.fecha)}
  </div>

  <div>
    ${partido.hora} hs
  </div>

</div>
  `
}

</div>

  <div class="contador-predicciones">

  👥 ${cantidadPredicciones}

  ${
    cantidadPredicciones === 1
    ? "predicción"
    : "predicciones"
  }

</div>

`;

  return div;
}


function renderPartidos(){

  const proximos =
partidos.filter(p => {

  const coincideBusqueda =

    p.local
      .toLowerCase()
      .includes(filtroPartidos)

    ||

    p.visitante
      .toLowerCase()
      .includes(filtroPartidos);

  return (
    p.resultado === "proximamente"
    &&
    coincideBusqueda
  );

});
  proximos.sort(
        (a,b) => a.id - b.id
      );

const finalizados =
partidos.filter(p => {

  const coincideBusqueda =

    p.local
      .toLowerCase()
      .includes(filtroPartidos)

    ||

    p.visitante
      .toLowerCase()
      .includes(filtroPartidos);

  return (
    p.resultado !== "proximamente"
    &&
    coincideBusqueda
  );

});

document.getElementById(
  "contadorProximos"
).textContent =
`(${proximos.length})`;

document.getElementById(
  "contadorFinalizados"
).textContent =
`(${finalizados.length})`;


  listaProximos.innerHTML = "";
  listaFinalizados.innerHTML = "";

 proximos.forEach(partido => {

  listaProximos.appendChild(
    crearTarjetaPartido(partido)
  );

});

finalizados.forEach(partido => {

  listaFinalizados.appendChild(
    crearTarjetaPartido(partido)
  );

});

}



/*
====================================
    BUSCADOR
====================================
*/

const buscadorParticipante =
document.getElementById(
  "buscarParticipante"
);

buscadorParticipante
.addEventListener("input", () => {

  const texto =
  buscadorParticipante.value
  .toLowerCase();

  const filas =
  document.querySelectorAll(
    "#tablaPosiciones tbody tr"
  );

  filas.forEach(fila => {

    const nombre =
    fila.children[1]
    .textContent
    .toLowerCase();

    fila.style.display =
    nombre.includes(texto)
    ? ""
    : "none";

  });

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

  const historial = [];

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

      historial.push({
        partido,
        apuesta,
        timestamp:
          apuesta.timestamp || 0
      });

    });

  });

  /*
  ====================================
  ORDENAR MÁS NUEVAS PRIMERO
  ====================================
  */

  historial.sort(
    (a,b) =>
      b.timestamp - a.timestamp
  );

  /*
  ====================================
  RENDER
  ====================================
  */

  historial.forEach(item => {

    const partido =
      item.partido;

    const apuesta =
      item.apuesta;

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

    const fechaPrediccion =
      item.timestamp
      ? new Date(item.timestamp)
        .toLocaleString("es-AR")
      : "Fecha desconocida";

    div.innerHTML = `

      <strong>
        ${partido.local}
        vs
        ${partido.visitante}
      </strong>

      <br><br>

      🕒 ${fechaPrediccion}

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
"proximamente"
&&
!partido.cerrado;

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

    

await renderRankingFirebase();

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

window.eliminarPrediccion = function(id){

  const confirmar = confirm(
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

    

await renderRankingFirebase();

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

async function iniciarBasuProde(){

  escucharPartidosFirebase();

  

  renderPartidos();

}

iniciarBasuProde();

function escucharPrediccionesFirebase(){

  onValue(
    ref(db,"basuprode/predicciones"),
    async snapshot => {

      if(snapshot.exists()){

        prediccionesFirebase =
        snapshot.val();

      }else{

        prediccionesFirebase = {};

      }

      await renderRankingFirebase();

      renderPartidos();

    }
  );

}

escucharPrediccionesFirebase();

function escucharPartidosFirebase(){

  onValue(
    ref(db, "basuprode/partidos"),
    snapshot => {

      if(!snapshot.exists()){

        partidos = [];

        renderPartidos();

        return;
      }

      partidos =
      Object.values(
        snapshot.val()
      );

      partidos.sort(
        (a,b) => b.id - a.id
      );

      renderPartidos();

    }
  );

}


/*
====================================
SCROLL TO TOP
====================================
*/

const btnTop =
document.getElementById("btnTop");

window.addEventListener(
  "scroll",
  () => {

    if(window.scrollY > 400){

      btnTop.classList.add(
        "visible"
      );

    }else{

      btnTop.classList.remove(
        "visible"
      );

    }

  }
);

btnTop.addEventListener(
  "click",
  () => {

    window.scrollTo({

      top:0,

      behavior:"smooth"

    });

  }
);