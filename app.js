let experiencias = [];
let reservas = [];
let textoBusqueda = "";
let categoriaActual = "todas";
let ordenActual = "normal";
let precioMaximo = null;

const catalogo = document.querySelector("#catalogo");
const buscador = document.querySelector("#buscador");
const filtroCategoria = document.querySelector("#filtroCategoria");
const ordenPrecio = document.querySelector("#ordenPrecio");
const inputPrecioMaximo = document.querySelector("#precioMaximo");
const listaReservas = document.querySelector("#listaReservas");
const total = document.querySelector("#total");
const totalPersonas = document.querySelector("#totalPersonas");
const estado = document.querySelector("#estado");
const mensaje = document.querySelector("#mensaje");
const botonVaciar = document.querySelector("#vaciar");

async function cargarExperiencias() {
  try {
    estado.textContent = "Cargando experiencias...";
    const respuesta = await fetch("./data/experiencias.json");
    if (!respuesta.ok) {
      throw new Error("No fue posible cargar las experiencias");
    }
    experiencias = await respuesta.json();
    estado.textContent = `${experiencias.length} experiencias disponibles`;
    actualizarCatalogo();
  } catch (error) {
    estado.textContent = "Error al cargar la información";
    console.error(error);
  }
}

function mostrarMensaje(texto) {
  mensaje.textContent = texto;
}

function obtenerResultados() {
  let resultados = [...experiencias];

  if (categoriaActual !== "todas") {
    resultados = resultados.filter(e => e.categoria === categoriaActual);
  }

  if (textoBusqueda !== "") {
    resultados = resultados.filter(e =>
      e.nombre.toLowerCase().includes(textoBusqueda)
    );
  }

  if (precioMaximo !== null) {
    resultados = resultados.filter(e => e.precio <= precioMaximo);
  }

  if (ordenActual === "ascendente") {
    resultados.sort((a, b) => a.precio - b.precio);
  }
  if (ordenActual === "descendente") {
    resultados.sort((a, b) => b.precio - a.precio);
  }

  return resultados;
}

function actualizarCatalogo() {
  const resultados = obtenerResultados();

  if (resultados.length === 0) {
    catalogo.innerHTML = `<p class="sin-resultados">No se encontraron experiencias</p>`;
    estado.textContent = "0 resultados";
    return;
  }

  catalogo.innerHTML = resultados.map(e => `
    <article class="tarjeta">
      <div class="imagen">${e.icono}</div>
      <div class="informacion">
        <span class="categoria">${e.categoria}</span>
        <h3>${e.nombre}</h3>
        <p>Cupo disponible: ${e.cupo}</p>
        <p class="precio">$${e.precio} MXN</p>
        <label>Personas:
          <input type="number" id="cantidad-${e.id}" min="1" max="${e.cupo}" value="1">
        </label>
        <button class="btn-reservar" data-id="${e.id}">Agregar</button>
      </div>
    </article>`).join("");

  estado.textContent = `${resultados.length} resultados`;
  agregarEventosReservar();
}

function agregarEventosReservar() {
  document.querySelectorAll(".btn-reservar").forEach(boton => {
    boton.addEventListener("click", () => {
      agregarReserva(Number(boton.dataset.id));
    });
  });
}

function agregarReserva(id) {
  const experiencia = experiencias.find(e => e.id === id);
  const cantidad = Number(document.querySelector(`#cantidad-${id}`).value);

  if (cantidad < 1 || cantidad > experiencia.cupo) {
    mostrarMensaje(`La cantidad debe estar entre 1 y ${experiencia.cupo}.`);
    return;
  }

  const existente = reservas.find(r => r.experienciaId === id);
  const cantidadActual = existente ? existente.cantidad : 0;

  if (cantidadActual + cantidad > experiencia.cupo) {
    mostrarMensaje("La cantidad supera el cupo disponible.");
    return;
  }

  if (existente) {
    existente.cantidad = existente.cantidad + cantidad;
    existente.subtotal = existente.cantidad * existente.precio;
  } else {
    reservas.push({
      experienciaId: id,
      nombre: experiencia.nombre,
      precio: experiencia.precio,
      cantidad: cantidad,
      subtotal: experiencia.precio * cantidad
    });
  }

  mostrarMensaje("Experiencia agregada a tu reservación.");
  mostrarReservas();
}

function cambiarCantidad(id, cambio) {
  const reserva = reservas.find(r => r.experienciaId === id);
  const experiencia = experiencias.find(e => e.id === id);
  const nuevaCantidad = reserva.cantidad + cambio;

  if (nuevaCantidad < 1) {
    mostrarMensaje("La cantidad mínima es 1. Usa Eliminar para quitar la experiencia.");
    return;
  }

  if (nuevaCantidad > experiencia.cupo) {
    mostrarMensaje("No hay más cupo disponible para esta experiencia.");
    return;
  }

  reserva.cantidad = nuevaCantidad;
  reserva.subtotal = nuevaCantidad * reserva.precio;
  mostrarMensaje("");
  mostrarReservas();
}

function mostrarReservas() {
  if (reservas.length === 0) {
    listaReservas.innerHTML = "<p>No hay experiencias seleccionadas.</p>";
    total.textContent = "$0 MXN";
    totalPersonas.textContent = "0";
    return;
  }

  listaReservas.innerHTML = reservas.map(r => `
    <article class="item-reserva">
      <div>
        <strong>${r.nombre}</strong>
        <p>$${r.precio} MXN por persona</p>
        <div class="cantidad">
          <button class="btn-menos" data-id="${r.experienciaId}" aria-label="Quitar una persona de ${r.nombre}">-</button>
          <span>${r.cantidad}</span>
          <button class="btn-mas" data-id="${r.experienciaId}" aria-label="Agregar una persona a ${r.nombre}">+</button>
        </div>
        <button class="btn-eliminar" data-id="${r.experienciaId}">Eliminar</button>
      </div>
      <strong>$${r.subtotal} MXN</strong>
    </article>`).join("");

  const totalPagar = reservas.reduce((suma, r) => suma + r.subtotal, 0);
  const personas = reservas.reduce((suma, r) => suma + r.cantidad, 0);

  total.textContent = `$${totalPagar} MXN`;
  totalPersonas.textContent = personas;

  agregarEventosReservacion();
}

function agregarEventosReservacion() {
  document.querySelectorAll(".btn-mas").forEach(boton => {
    boton.addEventListener("click", () => {
      cambiarCantidad(Number(boton.dataset.id), 1);
    });
  });

  document.querySelectorAll(".btn-menos").forEach(boton => {
    boton.addEventListener("click", () => {
      cambiarCantidad(Number(boton.dataset.id), -1);
    });
  });

  document.querySelectorAll(".btn-eliminar").forEach(boton => {
    boton.addEventListener("click", () => {
      eliminarReserva(Number(boton.dataset.id));
    });
  });
}

function eliminarReserva(id) {
  reservas = reservas.filter(r => r.experienciaId !== id);
  mostrarMensaje("Experiencia eliminada de tu reservación.");
  mostrarReservas();
}

function vaciarReservacion() {
  if (reservas.length === 0) {
    mostrarMensaje("Tu reservación ya está vacía.");
    return;
  }

  const confirmar = confirm("¿Seguro que quieres vaciar tu reservación?");
  if (confirmar) {
    reservas = [];
    mostrarMensaje("Reservación vaciada.");
    mostrarReservas();
  }
}

buscador.addEventListener("input", () => {
  textoBusqueda = buscador.value.trim().toLowerCase();
  actualizarCatalogo();
});

filtroCategoria.addEventListener("change", () => {
  categoriaActual = filtroCategoria.value;
  actualizarCatalogo();
});

ordenPrecio.addEventListener("change", () => {
  ordenActual = ordenPrecio.value;
  actualizarCatalogo();
});

inputPrecioMaximo.addEventListener("input", () => {
  if (inputPrecioMaximo.value === "") {
    precioMaximo = null;
  } else {
    precioMaximo = Number(inputPrecioMaximo.value);
  }
  actualizarCatalogo();
});

botonVaciar.addEventListener("click", vaciarReservacion);

cargarExperiencias();