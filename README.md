# Trabajo Práctico 09 - Actualización y eliminación de reservas de salas

## 1. Punto de partida y proyecto
Este proyecto (copia denominada `tp-09-salas-crud-mongodb`) es la continuación directa del TP08. Su objetivo principal es completar el ciclo CRUD (Crear, Leer, Actualizar, Borrar) en nuestra API RESTful, incorporando operaciones de actualización completa (`PUT`), actualización parcial (`PATCH`) y eliminación física (`DELETE`) sobre los documentos almacenados en MongoDB Atlas. Todo esto conviviendo con el sitio web HTML previamente construido.

## 2. Entorno y Versiones
- **Node.js**: >= 22.13.0
- **Base de Datos**: MongoDB Atlas, clúster gratuito Free (M0). Colección: `reservas`. Base: `reservas_salas_u9`.
- **Dependencias principales**: Express 5.1.0, Mongoose 9.10.3.

## 3. Preparación, Instalación y Ejecución
1. **Instalación:** Ejecutar `npm install`.
2. **Entorno Atlas y DNS:** Se configuró un clúster Free (M0) con usuario de base de datos e IP local permitida. Para sortear posibles bloqueos del ISP, el archivo `src/config/base-datos.js` impone el uso de resolutores DNS públicos (`8.8.8.8`, `1.1.1.1`).
3. **Variables de Entorno:** Se provee un archivo `.env.example`. Debe copiarse como `.env` e inyectar las credenciales reales (`MONGODB_URI`).
4. **Comando de Inicio:**
   ```bash
   node --env-file=.env src/index.js
   ```

## 4. Estructura por Capas (Arquitectura)
- **`src/index.js` & `src/app.js`**: El arranque espera a MongoDB antes de escuchar el puerto. `app.js` monta los middlewares, el router API y el router HTML.
- **`src/rutas/reservas-api.js`**: Define los endpoints de la API y orquesta los middlewares de validación específicos para cada método (`POST`, `PUT`, `PATCH`, `DELETE`).
- **`src/middleware/`**: `reservas.js` valida la creación y `PUT`. `cambios-reservas.js` valida las reglas específicas del `PATCH`. `errores.js` atrapa rechazos y caídas asíncronas.
- **`src/controladores/reservas.js`**: Actúa como intermediario, traduciendo peticiones HTTP a llamadas del servicio, e interpretando los retornos (ej: devolviendo `204` para borrados exitosos o `404` para nulos).
- **`src/servicios/reservas-mongo.js`**: Única fuente de verdad. Ejecuta operaciones Mongoose (`findOneAndReplace`, `findOneAndUpdate`, `deleteOne`).
- **`src/modelos/reserva.js`**: Esquema de Mongoose que dicta la forma y reglas a nivel de base de datos.

## 5. Campos, Reglas y Eliminación
- **Campos base**: `estudiante` (String, trim), `email` (String, match /@/), `sala` (enum), `fecha` (String, trim), `turno` (enum), `personas` (Number, 1-6).
- **Campo `estado`**: Se agrega con valor `enum: ["pendiente", "confirmada"]`. El cliente no lo asigna en el POST inicial (MongoDB aplica `default: "pendiente"`).
- **`PUT` (Reemplazo total)**: Exige el envío de los 7 campos mencionados.
- **`PATCH` (Actualización parcial)**: Solo admite cambiar `personas` (validando tipos numéricos seguros) y/o `estado`. Se conservan intactos los demás campos.
- **Diferencia conceptual (Estado vs DELETE)**: Cambiar el estado a "confirmada" (vía PUT/PATCH) es una actualización lógica del negocio que mantiene el documento vivo. Por otro lado, la operación `DELETE` ejecuta una **eliminación física**, removiendo el documento de la colección permanentemente de modo que un `GET` posterior devolverá `404`.

## 6. Contrato HTTP de la API (Endpoints)
| Método | Endpoint | Resultado |
| :--- | :--- | :--- |
| `GET` | `/api/reservas` | 200 OK y arreglo de reservas. |
| `POST` | `/api/reservas` | 201 Created, recurso guardado y cabecera `Location`. Default: `pendiente`. |
| `GET` | `/api/reservas/:id` | 200 OK y recurso (o 404 si no existe). |
| `PUT` | `/api/reservas/:id` | 200 OK. Reemplazo completo (exige los 7 campos editables). |
| `PATCH` | `/api/reservas/:id` | 200 OK. Cambia solo `personas` y/o `estado`. |
| `DELETE`| `/api/reservas/:id` | 204 No Content. Sin cuerpo si el documento fue eliminado. |

*(Nota: Cualquier ID con formato inválido devuelve 400. Errores inesperados devuelven 500 JSON sin revelar la traza).*

## 7. Instrucciones para Postman
1. **Crear Reserva:** `POST /api/reservas`. Enviar JSON con 6 campos base. Recibir `201` y copiar el `_id`.
   ```json
   {
       "estudiante": "Ana Ejemplo", "email": "ana@example.com", "sala": "Sala Norte",
       "fecha": "2026-10-28", "turno": "Mañana", "personas": 2
   }
   ```
2. **Reemplazar (PUT):** `PUT /api/reservas/:id`. Enviar JSON con los 6 campos + `"estado": "confirmada"`.
3. **Modificar Parcialmente (PATCH):** `PATCH /api/reservas/:id`. Enviar JSON con `{"personas": 3}` o `{"estado": "pendiente"}`.
4. **Eliminar (DELETE):** `DELETE /api/reservas/:id`. Sin body. Devolverá `204`. Un GET posterior a ese ID dará `404`.

## 8. Evidencia de Persistencia y Reinicio
Para demostrar la persistencia física de las actualizaciones:
1. Se actualizó la reserva de "Ana Ejemplo" mediante un `PATCH` estableciendo `personas: 4`.
2. Se guardó el ID y se comprobó con `GET` individual que el cambio aplicó.
3. Se eliminó una reserva diferente usando `DELETE` (verificado 204).
4. **Reinicio:** Se detuvo el servidor (Ctrl+C) y se volvió a lanzar con el comando de entorno.
5. **Comprobación:** Se hizo `GET` a la reserva de Ana: mantuvo `personas: 4`. Se hizo `GET` a la reserva borrada: continuó dando `404`.
6. **Sitio HTML:** Se visitó `/reservas` en el navegador y los cambios se vieron reflejados en la grilla sin problemas, validando la continuidad de la web en memoria sobre Atlas.

## 9. Matriz Mínima de Pruebas y Resultados observados
*(Las operaciones se ejecutaron sobre un listado estabilizado)*

| Caso | Evidencia Esperada | N Inicial | N Final | Resultado Observado |
| :--- | :--- | :--- | :--- | :--- |
| **POST válido** | 201, Location, estado pdte. | 4 | 5 | 201 Created. Mongoose asignó `estado: "pendiente"` y un `_id`. |
| **PUT completo** | 200, mismo ID, 7 campos | 5 | 5 | 200 OK. Actualizó todos los campos y estado a "confirmada". |
| **PUT incompleto** | 400 y recurso intacto | 5 | 5 | 400 Bad Request. Validador base rechazó por campo faltante. |
| **PATCH personas o estado** | 200, omitidos conservados | 5 | 5 | 200 OK. Solo cambió el campo enviado; el resto no se alteró. |
| **PATCH vacío, _id o $set** | 400 sin modificación | 5 | 5 | 400 Bad Request. Filtro estricto rechazó campos no permitidos. |
| **personas 0, 7, 2.5, true, [], {}**| 400 sin modificación | 5 | 5 | 400 Bad Request. Validaciones combinadas de rango y tipo fallaron. |
| **estado o enum inválido** | 400 sin modificación | 5 | 5 | 400 Bad Request. Validador restringió valores. |
| **ID mal formado** | 400 | 5 | 5 | 400 Bad Request. Error "ID_INVALIDO" manejado en middleware. |
| **ID válido ausente PUT/PATCH** | 404 sin creación | 5 | 5 | 404 Not Found. Evitado mediante opción `upsert: false`. |
| **JSON mal formado o vacío**| 400 JSON | 5 | 5 | 400 Bad Request. `express.json()` falló el parseo. |
| **DELETE existente** | 204; una reserva menos | 5 | 4 | 204 No Content. La colección devolvió un count restando la unidad. |
| **Repetir DELETE / GET post**| 404 | 4 | 4 | 404 Not Found. El servicio devolvió false (deletedCount 0) / null. |
| **Reinicio (Actualizar/Eliminar)**| Cambios persistidos | 4 | 4 | Las lecturas POST reinicio mantienen los cambios de la BD intactos. |
| **Sitio, formulario, /estado** | Contratos conservados | 4 | 4 | Rutas operan normal. `/estado` indica Total de Reservas: 4. |
| **Fallo inesperado (Simulado)** | 500 sin secretos | N/A | N/A | Simulación de caída forzada arrojó 500 JSON genérico sin stack. |

## 10. Calidad de Código y Seguridad
- `.gitignore` intercepta dependencias y secretos locales.
- Prettier y ESLint analizaron toda la base de código (`src/` y `scripts/`) sin reportar errores, garantizando consistencia semántica en CommonJS.