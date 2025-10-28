import { onGoogleButtonPress, onSignOut } from '@/services/auth';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const handleLogin = async () => {
    const profile = await onGoogleButtonPress(); 
    
    if (profile) {
      console.log('Sesión iniciada con:', profile.email);
      console.log('Rol del usuario:', profile.role);

      if (profile.role === 'admin') {
        router.replace('/(admin)');
      } else if (profile.role === 'autoridad') {
        router.replace('/(autoridad)');
      } else {
        router.replace('/(tabs)'); 
      }

    } else {
      Alert.alert("Error", "No se pudo iniciar sesión.");
    }
  };

  const handleLogout = async () => {
    await onSignOut();
    console.log('Sesión cerrada correctamente');
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido</Text>
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.buttonText}>Iniciar sesión con Google</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  loginButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#DB4437',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});