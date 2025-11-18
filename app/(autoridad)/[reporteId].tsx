import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { arrayUnion, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import uuid from "react-native-uuid";
import { useAuth } from '../../context/AuthContext';
import { FIREBASE_DB, FIREBASE_STORAGE } from '../../services/firebase';

export interface Reporte {
  id: string;
  userId: string;
  tipo: string;
  descripcion: string;
  imagenUrl: string;
  status: string;
  createdAt: any; 
  ubicacion: {
    latitude: number;
    longitude: number;
  };
}

const actualizarEstadoReporte = async (id: string, nuevoStatus: string) => {
  try {
    const reporteDocRef = doc(FIREBASE_DB, "reportes", id);
    await updateDoc(reporteDocRef, {
      status: nuevoStatus,
    });
    return true; 
  } catch (error) {
    console.error("Error al actualizar estado: ", error);
    Alert.alert("Error", "Hubo un problema al actualizar el reporte.");
    return false;
  }
};


export default function AutoridadReporteDetalle() {
  const { reporteId } = useLocalSearchParams();
  const router = useRouter(); 

  const { profile } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [razonRechazo, setRazonRechazo] = useState('');

  const [imagenSolucion, setImagenSolucion] = useState<string | null>(null);

  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!reporteId) return;
    const fetchReporte = async () => {
      setIsLoading(true);
      const docRef = doc(FIREBASE_DB, "reportes", reporteId as string);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setReporte({ id: docSnap.id, ...docSnap.data() } as Reporte);
      } else {
        console.log("No se encontró el reporte.");
      }
      setIsLoading(false);
    };
    fetchReporte();
  }, [reporteId]);

  const handleActualizar = async (nuevoStatus: string, extraData: any = {}) => {
    if (!reporte || !profile) return; 
    setIsLoading(true);

    const nuevaEntradaLog = {
        status: nuevoStatus, 
        timestamp: new Date(),
        userId: profile.uid,
    };

    let updateData: any = {
      status: nuevoStatus,
      activityLog: arrayUnion(nuevaEntradaLog),
      ...extraData,
    };

    if (nuevoStatus === 'En progreso') {
      updateData.acceptedAt = serverTimestamp();
    } else if (nuevoStatus === 'Completado') {
      updateData.completedAt = serverTimestamp();
    }
    
    const reporteDocRef = doc(FIREBASE_DB, "reportes", reporte.id);
    try {
      await updateDoc(reporteDocRef, updateData);
      
      setIsLoading(false);
      Alert.alert("Éxito", `El reporte ha sido marcado como "${nuevoStatus}".`);
      router.back(); 

    } catch (error) {
      setIsLoading(false);
      console.error("Error al actualizar estado: ", error);
      Alert.alert("Error", "Hubo un problema al actualizar el reporte.");
    }
  };


  const handleCompletarReporte = async () => {
    if (profile) {
      console.log("====================================");
      console.log("UID DE AUTORIDAD LOGUEADO:", profile.uid);
      console.log("====================================");
    } else {
      console.log("PERFIL DE AUTORIDAD NO ENCONTRADO");
    }
      if (!imagenSolucion || !reporte) {
        Alert.alert("Error", "Debes adjuntar una foto de la solución.");
        return;
      }
      setIsLoading(true);

      try {
        const reportUUID = uuid.v4() as string;
        const fileExtension = imagenSolucion.split('.').pop();
        const storagePath = `soluciones/${reporte.id}/solucion_${reportUUID}.${fileExtension}`;

        const imageUrl = await uploadImageAsync(imagenSolucion, storagePath);

        await handleActualizar('Completado', {
          imagenSolucionUrl: imageUrl,
          storagePathSolucion: storagePath
        });

      } catch (error) {
        console.error("Error al completar reporte: ", error);
        Alert.alert("Error", "Hubo un problema al subir la foto.");
        setIsLoading(false);
      }
  };

  const tomarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita permiso para usar la cámara.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      quality: 0.5,
    });

    if (!result.canceled) {
      setImagenSolucion(result.assets[0].uri);
    }
  };

  const seleccionarDeGaleria = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita permiso para acceder a la galería.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });

    if (!result.canceled) {
      setImagenSolucion(result.assets[0].uri);
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

  if (isLoading) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  if (!reporte) {
    return (
      <View style={styles.centered}>
        <Text>No se pudo cargar el reporte.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: `Reporte: ${reporte.tipo}` }} />
      <Image source={{ uri: reporte.imagenUrl }} style={styles.image} />

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen del Reporte</Text>
          <Text style={styles.cardRow}><Text style={styles.label}>Tipo: </Text>{reporte.tipo}</Text>
          <Text style={styles.cardRow}><Text style={styles.label}>Estado: </Text>{reporte.status}</Text>
          <Text style={styles.cardRow}><Text style={styles.label}>Fecha: </Text>{reporte.createdAt?.toDate().toLocaleDateString()}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Descripción</Text>
          <Text>{reporte.descripcion}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ubicación</Text>
          <MapView
                style={styles.map}
                region={{ 
                    latitude: reporte.ubicacion.latitude,
                    longitude: reporte.ubicacion.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }}
                scrollEnabled={false} 
                >
                <Marker coordinate={reporte.ubicacion} />
                </MapView>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Acciones</Text>
          {reporte.status === 'En espera' && (
            <View style={styles.buttonRow}>
              <Button 
                title="Rechazar" 
                onPress={() => setModalVisible(true)} 
                color="#dc3545"
              />
              <Button 
                title="Aceptar" 
                onPress={() => handleActualizar('En progreso')} 
                color="#28a745"
              />
            </View>
          )}

          {reporte.status === 'En progreso' && (
              <View>
                <Text style={styles.label}>Evidencia de Solución (Requerido)</Text>

                <View style={styles.buttonRow}>
                  <Button title="Tomar Foto" onPress={tomarFoto} />
                  <Button title="Galería" onPress={seleccionarDeGaleria} />
                </View>

                {imagenSolucion ? (
                  <Image source={{ uri: imagenSolucion }} style={styles.imagePreview} /> 
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text>Sube una foto del trabajo completado</Text>
                  </View>
                )}

                <Button 
                  title="Marcar como Completado" 
                  onPress={handleCompletarReporte}
                  color="#007bff"
                  disabled={!imagenSolucion || isLoading}
                />
              </View>
            )}
           {reporte.status === 'Rechazado' && (
            <Text>Este reporte fue rechazado.</Text>
          )}
        </View>
      </View>
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Razón del Rechazo</Text>
              <Text style={styles.modalSubtitle}>Por favor, explica por qué se rechaza este reporte.</Text>
              <Button title="Foto incorrecta" onPress={() => setRazonRechazo('Foto incorrecta')} />
              <Button title="Ubicación errónea" onPress={() => setRazonRechazo('Ubicación errónea')} />

              <TextInput
                style={styles.modalTextInput}
                placeholder="Otra razón (ej. duplicado, fuera de área...)"
                value={razonRechazo}
                onChangeText={setRazonRechazo}
                multiline
              />
              <View style={styles.modalButtonRow}>
                <Button 
                    title="Cancelar" 
                    onPress={() => {
                      setModalVisible(false);
                      setRazonRechazo('');
                    }} 
                    color="#888"
                  />
                <Button 
                  title="Confirmar Rechazo" 
                  onPress={() => {
                    if (razonRechazo.trim().length < 5) {
                      Alert.alert("Error", "La razón debe tener al menos 5 caracteres.");
                      return;
                    }
                    handleActualizar('Rechazado', { razonRechazo: razonRechazo });
                    setModalVisible(false);
                    setRazonRechazo('');
                  }} 
                  color="#dc3545"
                />
              </View>
            </View>
          </View>
        </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 15,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardRow: {
    fontSize: 16,
    marginBottom: 5,
  },
  label: {
    fontWeight: 'bold',
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  buttonRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginTop: 15 
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)', 
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  modalView: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    color: '#222',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalTextInput: {
    height: 100,
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 14,
    marginTop: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
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
});