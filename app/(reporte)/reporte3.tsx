import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import uuid from 'react-native-uuid';
import { useAuth } from '../../context/AuthContext';
import { useReport } from '../../context/ReportContext';
import { FIREBASE_DB, FIREBASE_STORAGE } from '../../services/firebase';

export default function DetalleScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { reportData, setDescripcion, setImagenUri, limpiarReporte } = useReport();
  const [descripcionLocal, setDescripcionLocal] = useState('');
  const [imagenLocal, setImagenLocal] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const tomarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Se necesita permiso para usar la cámara.');
      return;
    }
    
    let result = await ImagePicker.launchCameraAsync({
      quality: 0.5,
    });

    if (!result.canceled) {
      setImagenLocal(result.assets[0].uri);
      setImagenUri(result.assets[0].uri); 
    }
  };

  const seleccionarDeGaleria = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Se necesita permiso para acceder a la galería.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });

    if (!result.canceled) {
      setImagenLocal(result.assets[0].uri);
      setImagenUri(result.assets[0].uri); 
    }
  };

const uploadImageAsync = async (uri: string, path: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(FIREBASE_STORAGE, path);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error subiendo imagen: ", error);
      throw new Error("Error al subir la imagen.");
    }
  };

  const handleEnviarReporte = async () => {
    if (!profile) {
      Alert.alert("Error", "No estás autenticado. Por favor, reinicia la app.");
      return;
    }
    if (!reportData.imagenUri) {
      Alert.alert("Error", "Debes adjuntar una evidencia fotográfica.");
      return;
    }
    if (descripcionLocal.trim().length < 10) {
      Alert.alert("Error", "La descripción debe tener al menos 10 caracteres.");
      return;
    }
    setIsUploading(true); 
    try {
      setDescripcion(descripcionLocal);
      const reportUUID = uuid.v4() as string;
      const fileExtension = reportData.imagenUri.split('.').pop();
      const storagePath = `reportes/${profile.uid}/${reportUUID}.${fileExtension}`;
      console.log("Subiendo imagen a: ", storagePath);
      const imageUrl = await uploadImageAsync(reportData.imagenUri, storagePath);
      console.log("Imagen subida. URL: ", imageUrl);
      const reporteDocument = {
        tipo: reportData.tipo,
        ubicacion: {
          latitude: reportData.ubicacion?.latitude,
          longitude: reportData.ubicacion?.longitude,
        },
        descripcion: descripcionLocal,
        imagenUrl: imageUrl, 
        storagePath: storagePath, 
        userId: profile.uid,
        userDisplayName: profile.displayName || "Anónimo",
        userPhotoURL: profile.photoURL || null,
        status: "En espera", 
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(FIREBASE_DB, "reportes"), reporteDocument);
      console.log("Reporte guardado en Firestore con ID: ", docRef.id);

      Alert.alert("Éxito", "Tu reporte ha sido enviado correctamente.");
      limpiarReporte();
      router.replace('/(tabs)'); 

    } catch (error) {
      console.error("Error al enviar reporte: ", error);
      Alert.alert("Error", "Hubo un problema al enviar tu reporte. Intenta de nuevo.");
    } finally {
      setIsUploading(false); 
    }
  };

  if (isUploading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Enviando reporte...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resumen del Reporte</Text>
        <Text>Tipo: {reportData.tipo || 'No seleccionado'}</Text>
        <Text>
          Ubicacion: {reportData.ubicacion 
            ? `${reportData.ubicacion.latitude.toFixed(5)}, ${reportData.ubicacion.longitude.toFixed(5)}`
            : 'No seleccionada'}
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Descripción</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Ejemplo: La deficiencia esta a mitad de la avenida"
          multiline
          maxLength={500}
          onChangeText={setDescripcionLocal} 
          value={descripcionLocal}
        />
        <Text style={styles.charCount}>{descripcionLocal.length}/500 caracteres</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Evidencia Fotográfica</Text>
        <View style={styles.buttonRow}>
          <Button title="Tomar Foto" onPress={tomarFoto} />
          <Button title="Seleccionar de galeria" onPress={seleccionarDeGaleria} />
        </View>
        
        {imagenLocal ? (
          <Image source={{ uri: imagenLocal }} style={styles.imagePreview} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text>No hay imágenes agregadas</Text>
          </View>
        )}
      </View>

      <Button title="Entregar reporte" onPress={handleEnviarReporte} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f0f0f0' },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  textInput: {
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    textAlignVertical: 'top',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  charCount: { textAlign: 'right', color: 'gray', fontSize: 12, marginTop: 5 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
  imagePreview: { width: '100%', height: 200, borderRadius: 5, marginTop: 10 },
  imagePlaceholder: {
    height: 150,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 10,
  },
}); 