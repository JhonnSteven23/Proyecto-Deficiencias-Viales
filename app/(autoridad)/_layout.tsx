import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { doc, updateDoc } from 'firebase/firestore';
import { FIREBASE_DB } from '@/services/firebase'; 
import { useAuth } from '@/context/AuthContext'; 

async function registerForPushNotificationsAsync(userId: string) {
  let token;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('No se pudo obtener el token para notificaciones push.');
    return;
  }
  
  token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log("Token de Push de Autoridad:", token);

  if (userId && token) {
    const userDocRef = doc(FIREBASE_DB, "users", userId);
    try {
      await updateDoc(userDocRef, {
        pushToken: token 
      });
      console.log("Push token guardado en Firestore.");
    } catch (e) {
      console.error("Error guardando push token: ", e);
    }
  }
  return token;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function AutoridadTabsLayout() {
  const router = useRouter();
  const { user } = useAuth(); 

  useEffect(() => {
    if (user) {
      registerForPushNotificationsAsync(user.uid);
    }

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log("Notificación recibida:", notification);
    });
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("Usuario (autoridad) tocó la notificación:", response);
      const data = response.notification.request.content.data;
      if (data && data.reporteId) {
        router.push(`/gestion/${data.reporteId}`);
      }
    });
    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, [user]); 
-
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'green',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Informes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reportes" 
        options={{
          title: 'Reportes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mapa" 
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil" 
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}