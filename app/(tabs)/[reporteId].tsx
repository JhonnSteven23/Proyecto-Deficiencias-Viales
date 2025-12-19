import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useAuth } from '../../context/AuthContext';
import { FIREBASE_DB } from '../../services/firebase';

// Definición de la interfaz basada en tus datos
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
  // Campos opcionales que dependen del estado
  razonRechazo?: string;
  imagenSolucionUrl?: string;
  // Campos de calificación
  calificacion?: number;
  comentarioUsuario?: string;
  calificadoAt?: any;
}

export default function ReporteUsuarioDetalle() {
  const { reporteId } = useLocalSearchParams();
  const router = useRouter();
  const { profile } = useAuth();
  
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para la calificación
  const [modalVisible, setModalVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // Cargar datos del reporte
  useEffect(() => {
    if (!reporteId) return;
    fetchReporte();
  }, [reporteId]);

  const fetchReporte = async () => {
    try {
      setLoading(true);
      const docRef = doc(FIREBASE_DB, "reportes", reporteId as string);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setReporte({ id: docSnap.id, ...data } as Reporte);
        
        // Si ya existe calificación, prellenar estado local
        if (data.calificacion) {
            setRating(data.calificacion);
            setComentario(data.comentarioUsuario || '');
        }
      } else {
        Alert.alert("Error", "El reporte no existe.");
        router.back();
      }
    } catch (error) {
      console.error("Error al obtener reporte:", error);
      Alert.alert("Error", "No se pudo cargar la información.");
    } finally {
      setLoading(false);
    }
  };

  // Función para enviar la calificación a Firebase
  const handleEnviarCalificacion = async () => {
    if (rating === 0) {
      Alert.alert("Atención", "Por favor selecciona al menos 1 estrella.");
      return;
    }

    setSubmittingRating(true);
    try {
      const reporteRef = doc(FIREBASE_DB, "reportes", reporteId as string);
      
      // Actualizamos el documento. Esto disparará tu Cloud Function "onDocumentUpdated"
      await updateDoc(reporteRef, {
        calificacion: rating,
        comentarioUsuario: comentario,
        calificadoAt: serverTimestamp()
      });

      // Actualizamos el estado local para reflejar cambios sin recargar
      setReporte(prev => prev ? {
        ...prev, 
        calificacion: rating, 
        comentarioUsuario: comentario 
      } : null);

      setModalVisible(false);
      Alert.alert("¡Gracias!", "Tu calificación ha sido enviada a la autoridad.");
    } catch (error) {
      console.error("Error al calificar:", error);
      Alert.alert("Error", "Hubo un problema al enviar tu calificación.");
    } finally {
      setSubmittingRating(false);
    }
  };

  // Renderizado condicional del badge de estado
  const renderStatusBadge = (status: string) => {
    let color = '#6c757d'; // Default gris (En espera)
    if (status === 'En progreso') color = '#ffc107'; // Amarillo
    if (status === 'Completado') color = '#28a745'; // Verde
    if (status === 'Rechazado') color = '#dc3545'; // Rojo

    return (
      <View style={[styles.statusBadge, { backgroundColor: color }]}>
        <Text style={styles.statusText}>{status}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!reporte) return null;

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f4f4f8" />
      <Stack.Screen options={{ 
        title: "Detalle del Reporte",
        headerBackTitle: "Mis Reportes"
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* IMAGEN DEL PROBLEMA */}
        <Image source={{ uri: reporte.imagenUrl }} style={styles.headerImage} />
        
        <View style={styles.body}>
            <View style={styles.headerRow}>
                <Text style={styles.tipoText}>{reporte.tipo}</Text>
                {renderStatusBadge(reporte.status)}
            </View>
            <Text style={styles.dateText}>
                Reportado el: {reporte.createdAt?.toDate().toLocaleDateString()}
            </Text>

            {/* SECCIÓN: DESCRIPCIÓN */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Descripción</Text>
                <Text style={styles.cardText}>{reporte.descripcion}</Text>
            </View>

            {/* SECCIÓN: UBICACIÓN */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Ubicación</Text>
                <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        initialRegion={{
                            latitude: reporte.ubicacion.latitude,
                            longitude: reporte.ubicacion.longitude,
                            latitudeDelta: 0.005,
                            longitudeDelta: 0.005,
                        }}
                        scrollEnabled={false}
                        zoomEnabled={false}
                    >
                        <Marker coordinate={reporte.ubicacion} />
                    </MapView>
                </View>
            </View>

            {/* SECCIÓN LÓGICA: RECHAZADO */}
            {reporte.status === 'Rechazado' && (
                <View style={[styles.card, styles.cardError]}>
                    <View style={styles.cardHeaderWithIcon}>
                        <Ionicons name="alert-circle" size={24} color="#dc3545" />
                        <Text style={[styles.cardTitle, { color: '#dc3545', marginLeft: 8 }]}>
                            Reporte Rechazado
                        </Text>
                    </View>
                    <Text style={styles.cardText}>
                        <Text style={{fontWeight:'bold'}}>Razón: </Text> 
                        {reporte.razonRechazo || "No se especificó una razón."}
                    </Text>
                </View>
            )}

            {/* SECCIÓN LÓGICA: COMPLETADO */}
            {reporte.status === 'Completado' && (
                <View style={styles.solutionSection}>
                    <View style={[styles.card, styles.cardSuccess]}>
                        <View style={styles.cardHeaderWithIcon}>
                            <Ionicons name="checkmark-circle" size={24} color="#28a745" />
                            <Text style={[styles.cardTitle, { color: '#28a745', marginLeft: 8 }]}>
                                ¡Trabajo Completado!
                            </Text>
                        </View>
                        
                        {reporte.imagenSolucionUrl ? (
                            <View>
                                <Text style={styles.evidenceLabel}>Evidencia de la solución:</Text>
                                <Image 
                                    source={{ uri: reporte.imagenSolucionUrl }} 
                                    style={styles.solutionImage} 
                                />
                            </View>
                        ) : (
                            <Text style={styles.cardText}>La autoridad marcó esto como completado pero no adjuntó imagen.</Text>
                        )}
                    </View>

                    {/* ZONA DE CALIFICACIÓN */}
                    <View style={styles.ratingContainer}>
                        {reporte.calificacion ? (
                            <View style={styles.ratedContainer}>
                                <Text style={styles.ratedTitle}>Tu Calificación:</Text>
                                <View style={styles.starsRow}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Ionicons 
                                            key={star} 
                                            name={star <= (reporte.calificacion || 0) ? "star" : "star-outline"} 
                                            size={24} 
                                            color="#FFD700" 
                                        />
                                    ))}
                                </View>
                                {reporte.comentarioUsuario ? (
                                    <Text style={styles.commentText}>"{reporte.comentarioUsuario}"</Text>
                                ) : null}
                            </View>
                        ) : (
                            <TouchableOpacity 
                                style={styles.rateButton} 
                                onPress={() => setModalVisible(true)}
                            >
                                <Ionicons name="star" size={20} color="#fff" style={{marginRight: 8}}/>
                                <Text style={styles.rateButtonText}>Calificar Servicio</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}
        </View>
      </ScrollView>

      {/* MODAL DE CALIFICACIÓN */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalView}>
                <Text style={styles.modalTitle}>Califica la atención</Text>
                <Text style={styles.modalSubtitle}>¿Qué tan satisfecho estás con la solución?</Text>

                <View style={styles.modalStarsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity key={star} onPress={() => setRating(star)}>
                            <Ionicons 
                                name={star <= rating ? "star" : "star-outline"} 
                                size={40} 
                                color="#FFD700" 
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                <TextInput 
                    style={styles.inputComment}
                    placeholder="Deja un comentario (opcional)"
                    multiline
                    value={comentario}
                    onChangeText={setComentario}
                    maxLength={150}
                />

                <View style={styles.modalButtons}>
                    <TouchableOpacity 
                        style={[styles.modalBtn, styles.modalBtnCancel]}
                        onPress={() => setModalVisible(false)}
                    >
                        <Text style={styles.modalBtnTextCancel}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.modalBtn, styles.modalBtnConfirm]}
                        onPress={handleEnviarCalificacion}
                        disabled={submittingRating}
                    >
                        {submittingRating ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.modalBtnTextConfirm}>Enviar</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f4f4f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerImage: {
    width: '100%',
    height: 250,
  },
  body: {
    padding: 20,
    marginTop: -20,
    backgroundColor: '#f4f4f8',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  tipoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize',
  },
  dateText: {
    color: '#888',
    fontSize: 14,
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  mapContainer: {
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 5,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  // Estilos específicos para rechazado/completado
  cardError: {
    borderLeftWidth: 5,
    borderLeftColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  cardSuccess: {
    borderLeftWidth: 5,
    borderLeftColor: '#28a745',
    backgroundColor: '#f0fff4',
  },
  cardHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  solutionSection: {
    marginTop: 5,
  },
  evidenceLabel: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  solutionImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  // Calificación
  ratingContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  rateButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 3,
  },
  rateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratedContainer: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#eee',
  },
  ratedTitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  commentText: {
    fontStyle: 'italic',
    color: '#555',
    marginTop: 5,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalView: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalStarsRow: {
    flexDirection: 'row',
    marginBottom: 25,
    gap: 8,
  },
  inputComment: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    height: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 15,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: '#f1f1f1',
  },
  modalBtnConfirm: {
    backgroundColor: '#007AFF',
  },
  modalBtnTextCancel: {
    color: '#333',
    fontWeight: '600',
  },
  modalBtnTextConfirm: {
    color: '#fff',
    fontWeight: '600',
  },
});