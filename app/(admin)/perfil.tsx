import { useAuth } from '@/context/AuthContext';
import { onSignOut } from '@/services/auth';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Button, Image, StyleSheet, Text, View } from 'react-native';

export default function AdminPerfilScreen() {
    
  const { profile, isLoading } = useAuth();
  const router = useRouter(); 
  const handleLogout = () => {
    router.replace('/'); 
    onSignOut();
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
      {profile?.photoURL && (
        <Image source={{ uri: profile.photoURL }} style={styles.image} />
      )}
      <Text style={styles.title}>{profile?.displayName}</Text>
      <Text style={styles.email}>{profile?.email}</Text>
      <Text style={styles.role}>Rol: {profile?.role}</Text>
      
      <Button title="Cerrar Sesión" onPress={handleLogout} color="red" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
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
  },
});