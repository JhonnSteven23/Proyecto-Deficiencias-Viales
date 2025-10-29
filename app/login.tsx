import { onGoogleButtonPress } from '@/services/auth';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const handleLogin = async () => {
    const profile = await onGoogleButtonPress(); 
    
    if (!profile) {
      Alert.alert("Error", "No se pudo iniciar sesión.");
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido</Text>
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.buttonText}>Iniciar sesión con Google</Text>
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