import { useAuth } from '@/context/AuthContext';
import { onGoogleButtonPress } from '@/services/auth';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { profile, isLoading } = useAuth(); 

  useEffect(() => {
    if (!isLoading && profile) {
      if (profile.role === 'admin') {
        router.replace('/(admin)');
      } else if (profile.role === 'autoridad') {
        router.replace('/(autoridad)');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [profile, isLoading]); 

  const handleLogin = async () => {
    const newProfile = await onGoogleButtonPress(); 
    if (!newProfile) {
      Alert.alert("Error", "No se pudo iniciar sesión. Intenta de nuevo.");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido a Deficiencias Viales</Text>
      <Image
        source={require('@/assets/images/LogoApp.png')} 
        style={styles.logo}
      />
      <Text style={styles.subtitle}>Regístrate o Inicia Sesión</Text>
      <TouchableOpacity style={styles.googleButton} onPress={handleLogin}>
        <Text style={styles.buttonText}>Google</Text>
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
    textAlign: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
  },
  googleButton: {
    backgroundColor: '#DB4437',
    paddingVertical: 12,
    paddingHorizontal: 60,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});