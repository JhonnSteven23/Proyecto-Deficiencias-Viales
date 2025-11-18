import { Stack, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Rating } from 'react-native-ratings';
import { FIREBASE_DB } from '../services/firebase';

export interface Reporte {
  id: string; 
  tipo: 'Bache' | 'Alcantarilla' | 'Poste';
  descripcion: string;
  imagenUrl: string; 
  status: string;
  createdAt: any; 
  ubicacion: {
    latitude: number;
    longitude: number;
  };

  reporteroInfo: {
    nombre: string;
    email: string;
    photoURL?: string;
  };
  activityLog: {
    status: string;
    timestamp: any;
    userId: string;
  }[];
  
  razonRechazo?: string;
  imagenSolucionUrl?: string; 
  
  feedback?: {
    rating: number;
    comentario: string;
    createdAt: any;
  }
}

export default function ReporteDetalleScreen() {
  const { reporteId } = useLocalSearchParams();

  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [comentarioFeedback, setComentarioFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);


  const fetchReporte = async () => {
    if (!reporteId) return;
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

  useEffect(() => {
    fetchReporte();
  }, [reporteId]);

  const handleEnviarCalificacion = async () => {
    if (rating === 0) {
      Alert.alert("Error", "Por favor, selecciona una calificación (mínimo 1 estrella).");
      return;
    }
    if (!reporte) return;

    setIsSubmitting(true);
    const reporteDocRef = doc(FIREBASE_DB, "reportes", reporte.id);
    try {
      await updateDoc(reporteDocRef, {
        feedback: {
          rating: rating,
          comentario: comentarioFeedback.trim(),
          createdAt: serverTimestamp(),
        }
      });
      Alert.alert("¡Gracias!", "Tu calificación ha sido enviada.");
      await fetchReporte();
    } catch (error) {
      console.error("Error al enviar calificación: ", error);
      Alert.alert("Error", "No se pudo enviar tu calificación.");
    } finally {
      setIsSubmitting(false);
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

  const getStatusColor = () => {
    switch (reporte.status) {
      case 'En espera': return '#D9534F';
      case 'En progreso': return '#F0AD4E';
      case 'Completado': return '#5CB85C';
      case 'Rechazado': return '#777'; 
      default: return '#777';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: "Detalle del Reporte" }} />

      <Image source={{ uri: reporte.imagenUrl }} style={styles.image} />
      
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen del Reporte</Text>
          <Text style={styles.cardRow}><Text style={styles.label}>Tipo: </Text>{reporte.tipo}</Text>
          <Text style={styles.cardRow}>
            <Text style={styles.label}>Estado: </Text>
            <Text style={{ color: getStatusColor(), fontWeight: 'bold' }}>
              {reporte.status}
            </Text>
          </Text>
          <Text style={styles.cardRow}><Text style={styles.label}>Fecha: </Text>{reporte.createdAt?.toDate().toLocaleDateString()}</Text>
        </View>

        {(reporte.status === 'Rechazado' || reporte.status === 'Completado') && (
          <View style={[styles.card, reporte.status === 'Rechazado' ? styles.cardRechazado : styles.cardCompletado]}>
            <Text style={styles.cardTitle}>Respuesta de la Autoridad</Text>
            
            {reporte.status === 'Rechazado' && reporte.razonRechazo && (
              <>
                <Text style={styles.label}>Razón del Rechazo:</Text>
                <Text>{reporte.razonRechazo}</Text>
              </>
            )}

            {reporte.status === 'Completado' && (
              <>
                <Text style={styles.label}>Evidencia de Solución:</Text>
                {reporte.imagenSolucionUrl ? (
                  <Image source={{ uri: reporte.imagenSolucionUrl }} style={styles.solucionImage} />
                ) : (
                  <Text>El trabajo fue marcado como completado.</Text>
                )}
              </>
            )}
          </View>
        )}
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Descripción</Text>
          <Text>{reporte.descripcion}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ubicación</Text>
          <MapView
            style={styles.map}
            initialRegion={{
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

        {reporte.reporteroInfo && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reportero</Text>
            <Text style={styles.cardRow}>
              <Text style={styles.label}>Nombre: </Text>
              {reporte.reporteroInfo.nombre}
            </Text>
            <Text style={styles.cardRow}>
              <Text style={styles.label}>Contacto: </Text>
              {reporte.reporteroInfo.email}
            </Text>
          </View>
        )}

        {reporte.activityLog && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Registro de actividad</Text>
            {reporte.activityLog
              .sort((a, b) => a.timestamp?.seconds - b.timestamp?.seconds)
              .map((log, index) => (
                <View key={index} style={styles.logEntry}>
                  <View>
                    <Text style={styles.logStatus}>{log.status}</Text>
                    <Text style={styles.logTimestamp}>
                      {log.timestamp?.toDate().toLocaleDateString()} - {log.timestamp?.toDate().toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              ))}
          </View>
        )}

        {reporte.status === 'Completado' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Calificación del Trabajo</Text>
            
            {reporte.feedback ? (
              <View>
                <Text style={styles.label}>Tu Calificación:</Text>
                <Rating
                  imageSize={20}
                  readonly
                  startingValue={reporte.feedback.rating}
                  style={{ paddingVertical: 10, alignSelf: 'flex-start' }}
                />
                {reporte.feedback.comentario && (
                  <>
                    <Text style={styles.label}>Tu Comentario:</Text>
                    <Text>{reporte.feedback.comentario}</Text>
                  </>
                )}
              </View>
            ) : (
              <View>
                <Text style={styles.cardRow}>¿Qué tan satisfecho estás con la solución?</Text>
                <Rating
                  imageSize={30}
                  showRating
                  onFinishRating={(value) => setRating(value)}
                  style={{ paddingVertical: 10 }}
                />
                <TextInput
                  style={styles.feedbackInput}
                  placeholder="Añade un comentario (opcional)"
                  value={comentarioFeedback}
                  onChangeText={setComentarioFeedback}
                  multiline
                  maxLength={300}
                />
                <Button 
                  title={isSubmitting ? "Enviando..." : "Enviar Calificación"}
                  onPress={handleEnviarCalificacion} 
                  disabled={isSubmitting}
                />
              </View>
            )}
          </View>
        )}

      </View>
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
  solucionImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    marginTop: 10,
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
  cardRechazado: {
    backgroundColor: '#fff0f0',
    borderColor: '#D9534F',
    borderWidth: 1,
  },
  cardCompletado: {
    backgroundColor: '#f0fff0',
    borderColor: '#5CB85C',
    borderWidth: 1,
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
  feedbackInput: {
    height: 100,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
    textAlignVertical: 'top',
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  logEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  logTimestamp: {
    fontSize: 12,
    color: 'gray',
  },
});