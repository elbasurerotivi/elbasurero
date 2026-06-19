import {
  db,
  ref,
  get,
  set,
  remove,
  update
}
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

    if(
      !local ||
      !visitante
    ){
      alert(
        "Completa ambos equipos"
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

  partidos.forEach(
    partido => {

      const div =
      document.createElement(
        "div"
      );

      div.className =
      "partido";

      div.innerHTML = `

        <strong>

          ${partido.local}

          vs

          ${partido.visitante}

        </strong>

        <br>

        Estado:

        ${
          partido.cerrado
          ? "🔒 Cerrado"
          : "🟢 Abierto"
        }

        <div class="botones">

          <button
          onclick="
          cerrarPartido(
          ${partido.id}
          )">
          Cerrar
          </button>

          <button
          onclick="
          abrirPartido(
          ${partido.id}
          )">
          Abrir
          </button>

          <button
          onclick="
          borrarPartido(
          ${partido.id}
          )">
          Eliminar
          </button>

        </div>

      `;

      lista.appendChild(
        div
      );

    }
  );

}

cargarPartidos();