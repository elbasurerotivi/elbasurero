import { db, ref, get, set, remove, update, onValue}
from "../js/firebase-config.js";

const lista =
document.getElementById(
  "listaPartidos"
);

const btnCrear =
document.getElementById(
  "crearPartido"
);

async function obtenerNuevoId(){

  const snap =
  await get(
    ref(
      db,
      "basuprode/partidos"
    )
  );

  if(!snap.exists()){

    return 1;

  }

  const ids =
  Object.keys(
    snap.val()
  ).map(Number);

  return Math.max(...ids) + 1;

}

btnCrear.addEventListener(
  "click",
  async () => {

    const local =
    document.getElementById(
      "local"
    ).value.trim();

    const visitante =
    document.getElementById(
      "visitante"
    ).value.trim();

    const fecha =
    document.getElementById(
      "fecha"
    ).value;

    const hora =
    document.getElementById(
      "hora"
    ).value;

    if(
      !local ||
      !visitante ||
      !fecha ||
      !hora
    ){
      alert(
        "Completa todos los campos"
      );
      return;
    }

    const id =
    await obtenerNuevoId();

    await set(
      ref(
        db,
        `basuprode/partidos/${id}`
      ),
      {
        id,
        local,
        visitante,
        fecha,
        hora,
        golesLocal:null,
        golesVisitante:null,
        resultado:"proximamente",
        cerrado:false
      }
    );

    cargarPartidos();

  }
);

async function cerrarPartido(id){

  await update(
    ref(
      db,
      `basuprode/partidos/${id}`
    ),
    {
      cerrado:true
    }
  );

  cargarPartidos();

}

async function abrirPartido(id){

  await update(
    ref(
      db,
      `basuprode/partidos/${id}`
    ),
    {
      cerrado:false
    }
  );

  cargarPartidos();

}

async function guardarResultado(id){

  const golesLocal =
  Number(
    document.getElementById(
      `gl-${id}`
    ).value
  );

  const golesVisitante =
  Number(
    document.getElementById(
      `gv-${id}`
    ).value
  );

  if(
    isNaN(golesLocal) ||
    isNaN(golesVisitante)
  ){
    alert(
      "Completa ambos resultados"
    );
    return;
  }

  let resultado = "empate";

  if(
    golesLocal >
    golesVisitante
  ){
    resultado = "local";
  }

  if(
    golesVisitante >
    golesLocal
  ){
    resultado = "visitante";
  }

  await update(
    ref(
      db,
      `basuprode/partidos/${id}`
    ),
    {
      golesLocal,
      golesVisitante,
      resultado,
      cerrado:true
    }
  );

  alert(
    "Resultado guardado"
  );

  cargarPartidos();

}

window.guardarResultado =
guardarResultado;

async function borrarPartido(id){

  const ok =
  confirm(
    "Eliminar partido?"
  );

  if(!ok) return;

  await remove(
    ref(
      db,
      `basuprode/partidos/${id}`
    )
  );

  cargarPartidos();

}

window.cerrarPartido =
cerrarPartido;

window.abrirPartido =
abrirPartido;

window.borrarPartido =
borrarPartido;

async function cargarPartidos(){

  const snap =
  await get(
    ref(
      db,
      "basuprode/partidos"
    )
  );

  lista.innerHTML = "";

  if(!snap.exists()){
    return;
  }

  const partidos =
  Object.values(
    snap.val()
  );

  partidos.sort(
    (a,b) => b.id - a.id
  );

  partidos.forEach(
    partido => {

      const div =
      document.createElement(
        "div"
      );

      div.className =
      "partido";

      div.innerHTML = `

        <h3>
          ${partido.local}
          vs
          ${partido.visitante}
        </h3>

        <p>
          📅 ${partido.fecha || "-"}
          <br>
          🕒 ${partido.hora || "-"}
        </p>

        <p>
          Estado:
          ${
            partido.cerrado
            ? "🔒 Cerrado"
            : "🟢 Abierto"
          }
        </p>

        <div class="resultado-admin">

          <input
            type="number"
            min="0"
            id="gl-${partido.id}"
            placeholder="Local"
            value="${partido.golesLocal ?? ""}"
          >

          <input
            type="number"
            min="0"
            id="gv-${partido.id}"
            placeholder="Visitante"
            value="${partido.golesVisitante ?? ""}"
          >

          <select
            id="res-${partido.id}"
          >
            <option
              value="local"
              ${
                partido.resultado === "local"
                ? "selected"
                : ""
              }
            >
              Gana Local
            </option>

            <option
              value="empate"
              ${
                partido.resultado === "empate"
                ? "selected"
                : ""
              }
            >
              Empate
            </option>

            <option
              value="visitante"
              ${
                partido.resultado === "visitante"
                ? "selected"
                : ""
              }
            >
              Gana Visitante
            </option>
          </select>

          <button
            onclick="guardarResultado(${partido.id})"
          >
            💾 Guardar Resultado
          </button>

        </div>

        <div class="botones">

          <button
          onclick="cerrarPartido(${partido.id})">
            🔒 Cerrar
          </button>

          <button
          onclick="abrirPartido(${partido.id})">
            🔓 Abrir
          </button>

          <button
          onclick="borrarPartido(${partido.id})">
            🗑 Eliminar
          </button>

        </div>

      `;

      lista.appendChild(
        div
      );

    }
  );

}

onValue(
  ref(db,"basuprode/partidos"),
  () => {

    cargarPartidos();

  }
);