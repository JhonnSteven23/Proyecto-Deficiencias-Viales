import { setGlobalOptions } from "firebase-functions/v2";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";

import {
  logicCalificacionRecibida,
  logicCambioEstado,
  logicNuevoReporte
} from "./notificaciones";

setGlobalOptions({ region: "southamerica-east1" });

export const notificarAutoridadNuevoReporte = onDocumentCreated("reportes/{reporteId}", async (event) => {
    if (!event.data) return;
    await logicNuevoReporte(event);
});

export const notificarUsuarioCambioEstado = onDocumentUpdated("reportes/{reporteId}", async (event) => {
    if (!event.data) return;
    await logicCambioEstado(event);
});

export const notificarCalificacionAutoridad = onDocumentUpdated("reportes/{reporteId}", async (event) => {
    if (!event.data) return;
    await logicCalificacionRecibida(event);
});