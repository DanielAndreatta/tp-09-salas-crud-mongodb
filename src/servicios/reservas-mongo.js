const mongoose = require("mongoose");
const Reserva = require("../modelos/reserva");

function representarReserva(documento) {
  return {
    id: documento._id.toString(),
    estudiante: documento.estudiante,
    email: documento.email,
    sala: documento.sala,
    fecha: documento.fecha,
    turno: documento.turno,
    personas: documento.personas,
    estado: documento.estado,
  };
}

// Validación del ObjectID
function comprobarId(id) {
    if (!mongoose.isObjectIdOrHexString(id)) {
        const error = new Error("Identificador inválido");
        error.codigo = "ID_INVALIDO";
        throw error;
    }
}

function crearServicioReservasMongo() {
  // --- Funciones previas (Listar, Contar, Obtener, Crear) ---
  async function listar(sala) {
    const filtro = {};
    if (sala !== undefined) {
      if (typeof sala !== "string" || !sala.trim()) {
        const error = new Error("Filtro de sala inválido");
        error.codigo = "FILTRO_INVALIDO";
        throw error;
      }
      filtro.sala = sala.trim();
    }
    const documentos = await Reserva.find(filtro).lean();
    return documentos.map(representarReserva);
  }

  async function contar() {
    return await Reserva.countDocuments();
  }

  async function obtenerPorId(id) {
    comprobarId(id);
    const documento = await Reserva.findById(id).lean();
    return documento ? representarReserva(documento) : null;
  }

  async function crear(datos) {
    // Mongoose se encarga de aplicar el default "pendiente" al estado
    const documento = await Reserva.create({
      estudiante: datos.estudiante,
      email: datos.email,
      sala: datos.sala,
      fecha: datos.fecha,
      turno: datos.turno,
      personas: datos.personas,
    });
    return representarReserva(documento);
  }

  // NUEVAS FUNCIONES TP09

  async function reemplazar(id, datos) {
    comprobarId(id);

    // PUT exige los 7 campos editables.
    const reemplazo = {
      estudiante: datos.estudiante,
      email: datos.email,
      sala: datos.sala,
      fecha: datos.fecha,
      turno: datos.turno,
      personas: datos.personas,
      estado: datos.estado,
    };

    const documento = await Reserva.findOneAndReplace({ _id: id }, reemplazo, {
      runValidators: true,
      returnDocument: "after",
      upsert: false,
    });
    return documento ? representarReserva(documento) : null;
  }

  async function actualizar(id, datos) {
    comprobarId(id);

    const cambios = {};
    // PATCH admite cambiar solo "personas" o "estado" en este TP
    for (const campo of ["personas", "estado"]) {
      if (Object.hasOwn(datos, campo)) {
        cambios[campo] = datos[campo];
      }
    }

    if (Object.keys(cambios).length === 0) {
      const error = new Error("Actualización vacía");
      error.codigo = "ENTRADA_INVALIDA";
      throw error;
    }

    const documento = await Reserva.findOneAndUpdate(
      { _id: id },
      { $set: cambios },
      { runValidators: true, returnDocument: "after", upsert: false },
    );
    return documento ? representarReserva(documento) : null;
  }

  async function eliminar(id) {
    comprobarId(id);
    const resultado = await Reserva.deleteOne({ _id: id });
    return resultado.deletedCount === 1; // true si borró algo, false si no
  }

  return {
    listar,
    contar,
    obtenerPorId,
    crear,
    reemplazar,
    actualizar,
    eliminar,
  };
}

module.exports = { crearServicioReservasMongo };
