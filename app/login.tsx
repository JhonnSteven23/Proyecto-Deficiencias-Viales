// Ejemplo: app/login.tsx
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Button, StyleSheet, View } from 'react-native';
import { onGoogleButtonPress } from '../services/auth'; // Importamos nuestra función

export default function LoginScreen() {
  const router = useRouter();

  const handleLogin = async () => {
    const user = await onGoogleButtonPress();
    if (user) {
      // ¡Éxito! Navegamos al home
      // Asumiendo que tu layout de tabs está en (tabs)
      router.replace('/(tabs)'); 
    } else {
      // Falló
      Alert.alert("Error", "No se pudo iniciar sesión con Google.");
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title="Iniciar sesión con Google"
        onPress={handleLogin}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});