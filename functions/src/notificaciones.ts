import { logger } from "firebase-functions";
import { setGlobalOptions } from "firebase-functions/v2";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";

let db: any;
let expo: any;
let admin: any;

function initializeApp() {
  if (!admin) {
    logger.info("Realizando Lazy Import de 'firebase-admin'...");
    admin = require("firebase-admin");
    admin.initializeApp();
    db = admin.firestore();
  }
  
  if (!expo) {
    logger.info("Realizando Lazy Import de 'expo-server-sdk'...");
    const { Expo } = require("expo-server-sdk"); 
    expo = new Expo();
  }
}

setGlobalOptions({ region: "southamerica-east1" });

export const notificarAutoridadNuevoReporte = onDocumentCreated("reportes/{reporteId}", async (event) => {
    initializeApp();
    if (!event.data) {
        logger.error("No hay datos en el evento.");
        return;
    }
    const reporteData = event.data.data();
    const reporteId = event.params.reporteId; 

    if (!reporteData) {
        logger.error("No hay datos en el reporte.");
        return;
    }
    const tipoReporte = reporteData.tipo;
    if (!tipoReporte) {
        logger.error("El reporte no tiene 'tipo'.");
        return;
    }
    logger.info(`Nuevo reporte creado: ${reporteId}. Tipo: ${tipoReporte}`);
    const autoridadesRef = db.collection("users");
    const q = autoridadesRef
        .where("role", "==", "autoridad")
        .where("especialidad", "==", tipoReporte);
    
    const querySnapshot = await q.get();
    if (querySnapshot.empty) {
      logger.warn(`No se encontraron autoridades para el tipo: ${tipoReporte}`);
      return;
    }
    const tokens: string[] = [];

    const notificacionPromises: Promise<any>[] = []; 
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    querySnapshot.forEach((doc: any) => { 
      const userData = doc.data();
      if (userData.pushToken) {
        tokens.push(userData.pushToken);

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
      }
    });


    if (tokens.length === 0) {
      logger.warn("Las autoridades encontradas no tienen pushTokens.");
      return;
    }
    const { Expo } = require("expo-server-sdk"); 

    const messages = [];
    for (const pushToken of tokens) {
      if (!Expo.isExpoPushToken(pushToken)) { 
        logger.error(`Token inválido: ${pushToken}`);
        continue;
      }
      messages.push({
        to: pushToken,
        sound: "default",
        title: "Nuevo Reporte Asignado",
        body: `Se ha registrado un nuevo reporte de: ${tipoReporte}`,
        data: { reporteId: reporteId },
        android: {
            channelId: "alerta_vial", 
            priority: "high",
            vibrate: [0, 250, 250, 250],
        }
      });
    }
    if (messages.length > 0) {
      logger.info(`Enviando ${messages.length} notificaciones...`);
      try {
        await Promise.all([
          expo.sendPushNotificationsAsync(messages),
          ...notificacionPromises 
        ]);
        logger.info(`Notificaciones push enviadas y guardadas en DB.`);
      } catch (error) {
        logger.error("Error al enviar notificaciones:", error);
      }
    }
});

export const notificarUsuarioCambioEstado = onDocumentUpdated("reportes/{reporteId}", async (event) => {
    initializeApp();
    
    if (!event.data) {
        logger.error("No hay datos en el evento onUpdate.");
        return;
    }
    
    const dataAntes = event.data.before.data();
    const dataDespues = event.data.after.data();
    const reporteId = event.params.reporteId; 

    if (dataAntes.status === dataDespues.status) {
        logger.info("El estado no cambió, no se notifica.");
        return;
    }

    const nuevoStatus = dataDespues.status;
    const userId = dataDespues.userId;
    if (!userId) {
      logger.error("El reporte no tiene userId.");
      return;
    }
    logger.info(`Reporte ${reporteId} cambió a: ${nuevoStatus}. Notificando a: ${userId}`);
    
    const userDocRef = db.collection("users").doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      logger.error(`No se encontró el usuario: ${userId}`);
      return;
    }
    const pushToken = userDoc.data()?.pushToken;
    const { Expo } = require("expo-server-sdk"); 

    if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
      logger.warn(`Usuario ${userId} no tiene un pushToken válido.`);
      return;
    }

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

    const message = {
      to: pushToken,
      sound: "default",
      title: titulo, 
      body: cuerpo, 
      data: { reporteId: reporteId },
      android: {
          channelId: "alerta_vial", 
          priority: "high",
          vibrate: [0, 250, 250, 250],
      }
    };

    try {
      await Promise.all([
        expo.sendPushNotificationsAsync([message]),
        db.collection("notificaciones").add(notificacionData) 
      ]);
      logger.info(`Notificación de estado enviada a ${userId} y guardada en DB.`);
    } catch (error) {
      logger.error(`Error al enviar/guardar notificación a ${userId}:`, error);
    }
});

export const notificarAutoridadCalificacion = onDocumentUpdated("reportes/{reporteId}", async (event) => {
    initializeApp();

    if (!event.data) {
        logger.error("No hay datos en el evento de calificación.");
        return;
    }

    const dataAntes = event.data.before.data();
    const dataDespues = event.data.after.data();
    const reporteId = event.params.reporteId;

    const calificacionAntes = dataAntes.feedback?.rating;
    const calificacionDespues = dataDespues.feedback?.rating;

    if (!calificacionDespues || calificacionAntes === calificacionDespues) {
        return;
    }
    const autoridadId = dataDespues.autoridadId;
    if (!autoridadId) {
        logger.warn(`El reporte ${reporteId} fue calificado pero no tiene autoridadId.`);
        return;
    }

    logger.info(`Nueva calificación (${calificacionDespues} estrellas) para reporte ${reporteId}. Notificando a autoridad: ${autoridadId}`);

    const autoridadDocRef = db.collection("users").doc(autoridadId);
    const autoridadDoc = await autoridadDocRef.get();

    if (!autoridadDoc.exists) {
        logger.error(`No se encontró el usuario autoridad: ${autoridadId}`);
        return;
    }

    const pushToken = autoridadDoc.data()?.pushToken;
    const { Expo } = require("expo-server-sdk"); 

    const titulo = "¡Recibiste una calificación!";
    const cuerpo = `Un usuario te ha calificado con ${calificacionDespues} estrellas en el reporte de ${dataDespues.tipo}.`;
    
    const comentarioUsuario = dataDespues.feedback?.comentario || "";

    const notificacionData = {
        userId: autoridadId,
        reporteId: reporteId,
        tipo: "CalificacionRecibida",
        titulo: titulo,
        cuerpo: cuerpo,
        calificacion: calificacionDespues,
        comentario: comentarioUsuario,
        leido: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const promises = [];

    promises.push(db.collection("notificaciones").add(notificacionData));
    if (pushToken && Expo.isExpoPushToken(pushToken)) {
        const message = {
            to: pushToken,
            sound: "default",
            title: titulo,
            body: cuerpo,
            data: { reporteId: reporteId, screen: "detalle" },
            android: {
                channelId: "alerta_vial",
                priority: "high",
                vibrate: [0, 250, 250, 250],
            }
        };
        promises.push(expo.sendPushNotificationsAsync([message]));
    } else {
        logger.warn(`Autoridad ${autoridadId} no tiene pushToken válido.`);
    }

    try {
        await Promise.all(promises);
        logger.info("Notificación de calificación procesada con éxito.");
    } catch (error) {
        logger.error("Error al procesar notificación de calificación:", error);
    }
});