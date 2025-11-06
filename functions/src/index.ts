import { Expo } from "expo-server-sdk";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

admin.initializeApp();
const db = admin.firestore();
const expo = new Expo(); 

const timeZone = "America/La_Paz";

export const notificarAutoridad = functions
  .region("us-central1")
  .runWith({ memory: "128MB", timeoutSeconds: 60 })
  .firestore.document("reportes/{reporteId}")
  .onCreate(async (snapshot, context) => {

    const reporte = snapshot.data();
    if (!reporte) {
      console.log("No hay datos en el reporte.");
      return;
    }

    const tipoReporte = reporte.tipo; 
    const descripcion = reporte.descripcion;
    const usersRef = db.collection("users");
    const q = usersRef
      .where("role", "==", "autoridad")
      .where("especialidad", "==", tipoReporte);
    
    const autoridadesSnap = await q.get();

    if (autoridadesSnap.empty) {
      console.log("No hay autoridades para notificar sobre:", tipoReporte);
      return;
    }

    const tokens: string[] = [];
    autoridadesSnap.forEach(doc => {
      const pushToken = doc.data().pushToken;
      if (pushToken && Expo.isExpoPushToken(pushToken)) {
        tokens.push(pushToken);
      }
    });

    if (tokens.length === 0) {
      console.log("Autoridades encontradas, pero no tienen push tokens.");
      return;
    }

    const messages = tokens.map(token => ({
      to: token,
      sound: "default" as const, 
      title: "Nuevo Reporte de Deficiencia",
      body: `¡Nuevo reporte de "${tipoReporte}"! - ${descripcion.substring(0, 50)}...`,
      data: { 
        reporteId: snapshot.id 
      },
    }));

    try {
      const tickets = await expo.sendPushNotificationsAsync(messages);
      console.log("Notificaciones enviadas:", tickets);
    } catch (error) {
      console.error("Error al enviar notificaciones:", error);
    }
  });