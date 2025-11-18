import { useAuth } from '@/context/AuthContext';
import { onSignOut } from '@/services/auth';
import { useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import React from 'react';
import { ActivityIndicator, Alert, Button, Image, StyleSheet, Text, View } from 'react-native';

export default function PerfilScreen() {
  const { profile, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await onSignOut();
      await Updates.reloadAsync();
      
    } catch (error) {
      console.error("Error al reiniciar:", error);
      Alert.alert("Error", "No se pudo reiniciar la aplicación.");
      router.replace('/'); 
    }
  };

  if (isLoading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  return (
    <View style={styles.container}>
      {profile?.photoURL && (
        <Image source={{ uri: profile.photoURL }} style={styles.image} />
      )}
      <Text style={styles.title}>{profile?.displayName}</Text>
      <Text style={styles.email}>{profile?.email}</Text>
      <Text style={styles.role}>Rol: {profile?.role}</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="Cerrar Sesión" onPress={handleLogout} color="#DB4437" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 10,
  },
  role: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 40,
    color: '#666',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 50,
  }
});