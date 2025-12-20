import { AuthProvider, useAuth } from '@/context/AuthContext';
import * as Notifications from 'expo-notifications';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function RootLayoutNav() {
  const { profile, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

 const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === '(autoridad)' || segments[0] === '(admin)' || segments[0] === '(reporte)';
    if (profile && !inAuthGroup) {
      if (profile.role === 'admin') {
        router.replace('/(admin)');
      } else if (profile.role === 'autoridad') {
        router.replace('/(autoridad)');
      } else {
        router.replace('/(tabs)');
      }
    } else if (!profile && inAuthGroup) {
      router.replace('/');
    }
  }, [profile, isLoading, segments]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('alerta_vial', {
        name: 'Alertas Viales',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      const reporteId = data.reporteId;

      if (reporteId) {
        if (profile?.role === 'autoridad') {
             router.push(`/(autoridad)/${reporteId}`);
        } else {
             router.push(`/${reporteId}`);
        }
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log("Notificación recibida en primer plano:", notification);
    });

    return () => {
      notificationListener.current && notificationListener.current.remove();
      responseListener.current && responseListener.current.remove();
    };
  }, [profile]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
      <AuthProvider><RootLayoutNav /></AuthProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});