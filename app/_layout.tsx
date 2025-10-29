import { AuthProvider, useAuth } from '@/context/AuthContext'; // Ajusta la ruta
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

function RootLayoutNav() {
  const { profile, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments(); 

  useEffect(() => {
    if (isLoading) return; 
    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === '(autoridad)' || segments[0] === '(admin)';

    if (!profile) {
      if (inAuthGroup) {
        router.replace('/login');
      }
    } else {

      if (segments[0] === 'login') {
        if (profile.role === 'admin') {
          router.replace('/(admin)');
        } else if (profile.role === 'autoridad') {
          router.replace('/(autoridad)');
        } else {
          router.replace('/(tabs)');
        }
      }
    }
  }, [profile, isLoading, segments]);
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}