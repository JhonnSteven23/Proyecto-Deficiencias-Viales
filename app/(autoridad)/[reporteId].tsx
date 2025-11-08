import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { FIREBASE_DB } from '../../services/firebase';

export interface Reporte {
  id: string;
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

  const handleActualizar = async (nuevoStatus: string) => {
    if (!reporte) return;
    setIsLoading(true);
    const exito = await actualizarEstadoReporte(reporte.id, nuevoStatus);
    setIsLoading(false);

    if (exito) {
      Alert.alert("Éxito", `El reporte ha sido marcado como "${nuevoStatus}".`);
      router.back();
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

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Acciones</Text>
          {reporte.status === 'En espera' && (
            <View style={styles.buttonRow}>
              <Button 
                title="Rechazar" 
                onPress={() => handleActualizar('Rechazado')} 
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
            <Button 
              title="Marcar como Completado" 
              onPress={() => handleActualizar('Completado')}
              color="#007bff"
            />
          )}
          {reporte.status === 'Completado' && (
            <Text>Este reporte ya ha sido completado.</Text>
          )}
           {reporte.status === 'Rechazado' && (
            <Text>Este reporte fue rechazado.</Text>
          )}
        </View>
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
});