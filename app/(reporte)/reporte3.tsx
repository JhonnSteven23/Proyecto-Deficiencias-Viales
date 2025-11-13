import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
      const imageUrl = await uploadImageAsync(reportData.imagenUri, storagePath);
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
        <StatusBar barStyle="dark-content" backgroundColor="#f4f4f8" />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Enviando reporte...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f4f4f8" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen del Reporte</Text>
          <Text style={styles.infoText}>
            <Text style={styles.infoLabel}>Tipo: </Text>
            {reportData.tipo || 'No seleccionado'}
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.infoLabel}>Ubicacion: </Text>
            {reportData.ubicacion 
              ? `${reportData.ubicacion.latitude.toFixed(5)}, ${reportData.ubicacion.longitude.toFixed(5)}`
              : 'No seleccionada'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Descripción</Text>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Ejemplo: La deficiencia esta a mitad de la avenida"
              placeholderTextColor="#999"
              multiline
              maxLength={500}
              onChangeText={setDescripcionLocal} 
              value={descripcionLocal}
            />
            <Text style={styles.charCount}>{descripcionLocal.length}/500 caracteres</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Evidencia Fotográfica</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.actionButton} onPress={tomarFoto}>
              <Ionicons name="camera-outline" size={20} color="#007AFF" />
              <Text style={styles.actionButtonText}>Tomar Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={seleccionarDeGaleria}>
              <Ionicons name="image-outline" size={20} color="#007AFF" />
              <Text style={styles.actionButtonText}>Seleccionar</Text>
            </TouchableOpacity>
          </View>
          
          {imagenLocal ? (
            <Image source={{ uri: imagenLocal }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image" size={50} color="#888" />
              <Text style={styles.imagePlaceholderText}>No hay imágenes agregadas</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.submitButtonContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleEnviarReporte}>
          <Text style={styles.submitButtonText}>Entregar reporte</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f4f4f8',
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight : 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 20, 
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3, 
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  infoText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 5,
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#000',
  },
  textInputContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    minHeight: 120,
  },
  textInput: {
    height: 100,
    padding: 0, 
    textAlignVertical: 'top',
    color: '#000',
    fontSize: 15,
  },
  charCount: {
    textAlign: 'right',
    color: 'gray',
    fontSize: 12,
    marginTop: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e6f2ff',
    borderColor: '#007AFF',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 5, 
  },
  actionButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 10,
  },
  imagePlaceholder: {
    height: 150,
    backgroundColor: '#e9e9e9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 10,
  },
  imagePlaceholderText: {
    color: '#888', 
    marginTop: 8,
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f8',
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight : 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },

  submitButtonContainer: {
    padding: 15,
    backgroundColor: '#f4f4f8', 
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});