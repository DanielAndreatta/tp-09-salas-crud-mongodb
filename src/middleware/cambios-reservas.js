
function validarReemplazoReserva(req, res, next) {
    const datos = req.body;
    const permitidos = ["estudiante", "email", "sala", "fecha", "turno", "personas", "estado"];
    const estadosPermitidos = ["pendiente", "confirmada"];

    // Rechazamos campos extra (ej: _id o $set)
    for (const campo of Object.keys(datos)) {
        if (!permitidos.includes(campo)) {
            return res.status(400).json({ error: `El campo ${campo} no se puede modificar.` });
        }
    }

    if (!estadosPermitidos.includes(datos.estado)) {
        return res.status(400).json({ error: "El estado debe ser 'pendiente' o 'confirmada'." });
    }

    // req.reservaValidada ya viene cargado con los 6 campos del middleware anterior
    req.cambiosValidos = {
        ...req.reservaValidada,
        estado: datos.estado
    };
    next();
}

function validarActualizacionReserva(req, res, next) {
    const datos = req.body;

    // Rechazamos cuerpo vacío, null o arreglos
    if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
        return res.status(400).json({ error: "Enviá un objeto JSON." });
    }

    const estadosPermitidos = ["pendiente", "confirmada"];
    
    // Rechazamos cualquier campo que no sea 'personas' o 'estado'
    for (const campo of Object.keys(datos)) {
        if (campo !== "personas" && campo !== "estado") {
            return res.status(400).json({ error: "Solo se puede cambiar 'personas' o 'estado'." });
        }
    }

    if (datos.personas === undefined && datos.estado === undefined) {
        return res.status(400).json({ error: "Enviá 'personas' o 'estado'." });
    }

    const cambios = {};

    if (datos.personas !== undefined) {
        const p = datos.personas;
        // Admitimos número o texto numérico no vacío
        const personasParseado = (typeof p === "number" || (typeof p === "string" && p.trim() !== "")) 
            ? Number(p) 
            : NaN;

        if (!Number.isFinite(personasParseado) || !Number.isInteger(personasParseado) || personasParseado < 1 || personasParseado > 6) {
            return res.status(400).json({ error: "Personas debe ser un entero entre 1 y 6." });
        }
        cambios.personas = personasParseado;
    }

    if (datos.estado !== undefined) {
        if (!estadosPermitidos.includes(datos.estado)) {
            return res.status(400).json({ error: "El estado debe ser 'pendiente' o 'confirmada'." });
        }
        cambios.estado = datos.estado;
    }

    req.cambiosValidos = cambios;
    next();
}

module.exports = { validarReemplazoReserva, validarActualizacionReserva };