import { FIREBASE_DB } from '@/services/firebase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function AdminEditUserScreen() {
  const { userId } = useLocalSearchParams();
  const router = useRouter(); 
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState('');
  const [especialidad, setEspecialidad] = useState('');

  useEffect(() => {
    if (!userId) return;
    const fetchUser = async () => {
      const docRef = doc(FIREBASE_DB, "users", userId as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        setRole(data.role);
        setEspecialidad(data.especialidad || '');
      } else {
        Alert.alert("Error", "No se encontró el usuario.");
        router.back();
      }
      setIsLoading(false);
    };
    fetchUser();
  }, [userId]);

  const handleSaveChanges = async () => {
    if (!userId) return;
    setIsLoading(true);
    
    const newRole = role.trim().toLowerCase();
    let newEspecialidad = especialidad.trim().toLowerCase() || null;
    
    if (!['usuario', 'autoridad', 'admin'].includes(newRole)) {
      Alert.alert("Error", "Rol inválido. Debe ser 'usuario', 'autoridad' o 'admin'.");
      setIsLoading(false);
      return;
    }
    
    if (newRole !== 'autoridad') {
      newEspecialidad = null; 
    }

    try {
      const docRef = doc(FIREBASE_DB, "users", userId as string);
      await updateDoc(docRef, {
        role: newRole,
        especialidad: newEspecialidad,
      });
      setIsLoading(false);
      Alert.alert("Éxito", "Usuario actualizado.");
      router.back(); 
    } catch (error) {
      console.error("Error al actualizar usuario: ", error);
      Alert.alert("Error", "No se pudo actualizar el usuario.");
      setIsLoading(false);
    }
  };


  if (isLoading || !profile) {
    return <ActivityIndicator style={styles.centered} size="large" />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.name}>{profile.displayName}</Text>
      <Text style={styles.email}>{profile.email}</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>Rol (usuario, autoridad, admin)</Text>
        <TextInput
          style={styles.input}
          value={role}
          onChangeText={setRole}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Especialidad (bache, poste, etc.)</Text>
        <TextInput
          style={styles.input}
          value={especialidad}
          onChangeText={setEspecialidad}
          placeholder="Dejar vacío si no es autoridad"
          autoCapitalize="none"
        />
      </View>

      <Button title={isLoading ? "Guardando..." : "Guardar Cambios"} onPress={handleSaveChanges} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, padding: 15, backgroundColor: '#f0f0f0' },
  name: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  email: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  label: { fontSize: 14, color: '#555', marginBottom: 5 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    padding: 5,
    fontSize: 16,
  },
});