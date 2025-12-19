import { logger } from "firebase-functions";
import { FirestoreEvent } from "firebase-functions/v2/firestore";

let db: any;
let expo: any;
let admin: any;

function initializeServices() {
  if (!admin) {
    admin = require("firebase-admin");
    if (admin.apps.length === 0) {
      admin.initializeApp();
    }
    db = admin.firestore();
  }
  
  if (!expo) {
    const { Expo } = require("expo-server-sdk"); 
    expo = new Expo();
  }
  
  return { db, expo, admin };
}

export async function logicNuevoReporte(event: FirestoreEvent<any>) {
    const { db, expo, admin } = initializeServices();

    const reporteData = event.data.data();
    const reporteId = event.params.reporteId; 

    if (!reporteData) return;
    
    const tipoReporte = reporteData.tipo;
    if (!tipoReporte) return;

    logger.info(`Nuevo reporte: ${reporteId}. Tipo: ${tipoReporte}`);

    const autoridadesRef = db.collection("users");
    const q = autoridadesRef
        .where("role", "==", "autoridad")
        .where("especialidad", "==", tipoReporte);
    
    const querySnapshot = await q.get();
    if (querySnapshot.empty) {
        logger.warn(`No hay autoridades para: ${tipoReporte}`);
        return;
    }

    const tokens: string[] = [];
    const notificacionPromises: Promise<any>[] = []; 
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    querySnapshot.forEach((doc: any) => { 
        const userData = doc.data();
        const notificacionData = {
            userId: doc.id, 
            reporteId: reporteId,
            tipo: "NuevoReporte",
            titulo: "Nuevo Reporte Asignado",
            cuerpo: `Se ha registrado un nuevo reporte de: ${tipoReporte}`,
            tipoReporte: tipoReporte,
            leido: false,
            createdAt: timestamp,
        };
        notificacionPromises.push(db.collection("notificaciones").add(notificacionData));

        if (userData.pushToken) {
            tokens.push(userData.pushToken);
        }
    });

    if (tokens.length > 0) {
        const { Expo } = require("expo-server-sdk"); 
        const messages = [];
        for (const pushToken of tokens) {
            if (!Expo.isExpoPushToken(pushToken)) continue;
            
            messages.push({
                to: pushToken,
                sound: "default",
                title: "Nuevo Reporte Asignado",
                body: `Se ha registrado un nuevo reporte de: ${tipoReporte}`,
                data: { reporteId: reporteId }, 
            });
        }
        
        if (messages.length > 0) {
            try {
                await Promise.all([
                    expo.sendPushNotificationsAsync(messages),
                    ...notificacionPromises 
                ]);
            } catch (error) {
                logger.error("Error enviando notificaciones nuevo reporte:", error);
            }
        }
    }
}

export async function logicCambioEstado(event: FirestoreEvent<any>) {
    const { db, expo, admin } = initializeServices();

    const dataAntes = event.data.before.data();
    const dataDespues = event.data.after.data();
    const reporteId = event.params.reporteId; 

    if (dataAntes.status === dataDespues.status) return;

    const nuevoStatus = dataDespues.status;
    const userId = dataDespues.userId;

    if (!userId) return;

    const userDocRef = db.collection("users").doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) return;

    const pushToken = userDoc.data()?.pushToken;
    const { Expo } = require("expo-server-sdk"); 

    const titulo = "Actualización de tu Reporte";
    let cuerpo = `Tu reporte de ${dataDespues.tipo} ha cambiado a: ${nuevoStatus}`;

    if (nuevoStatus === "Rechazado" && dataDespues.razonRechazo) {
        cuerpo = `Tu reporte fue rechazado. Razón: ${dataDespues.razonRechazo}`;
    }

    const notificacionData = {
        userId: userId, 
        reporteId: reporteId,
        tipo: "CambioEstado",
        titulo: titulo,
        cuerpo: cuerpo,
        tipoReporte: dataDespues.tipo,
        leido: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        razonRechazo: dataDespues.razonRechazo || null,
    };

    const dbPromise = db.collection("notificaciones").add(notificacionData);
    const promises = [dbPromise];

    if (pushToken && Expo.isExpoPushToken(pushToken)) {
        const message = {
            to: pushToken,
            sound: "default",
            title: titulo, 
            body: cuerpo, 
            data: { reporteId: reporteId },
        };
        promises.push(expo.sendPushNotificationsAsync([message]));
    }

    try {
        await Promise.all(promises);
    } catch (error) {
        logger.error(`Error notificando cambio estado a ${userId}:`, error);
    }
}

export async function logicCalificacionRecibida(event: FirestoreEvent<any>) {
    const { db, expo, admin } = initializeServices();

    const dataAntes = event.data.before.data();
    const dataDespues = event.data.after.data();
    const reporteId = event.params.reporteId;

    if (!dataDespues.calificacion || dataAntes.calificacion === dataDespues.calificacion) {
        return; 
    }

    const autoridadId = dataDespues.autoridadId;
    const estrellas = dataDespues.calificacion;
    const comentario = dataDespues.comentarioUsuario || "Sin comentario";

    if (!autoridadId) {
        logger.warn(`Reporte ${reporteId} calificado sin autoridadId asignado.`);
        return;
    }

    const autoridadDocRef = db.collection("users").doc(autoridadId);
    const autoridadDoc = await autoridadDocRef.get();

    if (!autoridadDoc.exists) return;

    const pushToken = autoridadDoc.data()?.pushToken;
    const { Expo } = require("expo-server-sdk");

    const notificacionData = {
        userId: autoridadId,
        reporteId: reporteId,
        tipo: "CalificacionRecibida",
        titulo: "¡Te han calificado!",
        cuerpo: `Has recibido ${estrellas} estrellas ★. Comentario: ${comentario}`,
        leido: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const promises = [
        db.collection("notificaciones").add(notificacionData)
    ];

    if (pushToken && Expo.isExpoPushToken(pushToken)) {
        const message = {
            to: pushToken,
            sound: "default",
            title: "¡Nuevo Feedback Recibido!",
            body: `Un ciudadano calificó tu trabajo con ${estrellas} estrellas.`,
            data: { reporteId: reporteId },
        };
        promises.push(expo.sendPushNotificationsAsync([message]));
    }

    try {
        await Promise.all(promises);
        logger.info(`Notificación de calificación enviada a autoridad ${autoridadId}`);
    } catch (error) {
        logger.error("Error enviando notificación de calificación:", error);
    }
}