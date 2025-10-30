import { useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { FIREBASE_DB } from '../../services/firebase';

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
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth(); 

  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    setIsLoading(true);
    const reportesRef = collection(FIREBASE_DB, "reportes");
    const q = query(
      reportesRef,
      where("userId", "==", profile.uid), 
      orderBy("createdAt", "desc")       
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const reportesLocales: Reporte[] = [];
      querySnapshot.forEach((doc) => {
        reportesLocales.push({ id: doc.id, ...doc.data() } as Reporte);
      });
      setReportes(reportesLocales); 
      setIsLoading(false);
    }, (error) => {
      console.error("Error al obtener reportes: ", error);
      setIsLoading(false);
    });
    return () => unsubscribe();

  }, [profile]);

  const iniciarReporte = () => {
    router.push('/(reporte)/reporte1'); 
  };
  
  const verDetalle = (reporteId: string) => {
    router.push(`/${reporteId}`);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Reporte de deficiencias en Cochabamba</Text>
      
      <Button title="Reportar una deficiencia" onPress={iniciarReporte} />

      <Text style={styles.subHeader}>Tus reportes:</Text>

      {isLoading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}

      {!isLoading && reportes.length === 0 && (
        <Text style={styles.noReportsText}>Aún no has enviado ningún reporte.</Text>
      )}
      {reportes.map((reporte) => (
        <TouchableOpacity 
          key={reporte.id} 
          style={styles.card} 
          onPress={() => verDetalle(reporte.id)} 
        >
          <Image source={{ uri: reporte.imagenUrl }} style={styles.cardImage} />
          <View style={styles.cardContent}>
            <Text style={styles.cardDescription} numberOfLines={2}>
              {reporte.descripcion || `${reporte.tipo} sin descripción`}
            </Text>
            <View style={[
              styles.statusBadge, 
              reporte.status === 'En espera' ? styles.statusEspera : styles.statusProceso
            ]}>
              <Text style={styles.statusText}>{reporte.status}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    padding: 15,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 15,
    marginTop: 20,
    marginBottom: 10,
  },
  noReportsText: {
    textAlign: 'center',
    color: 'gray',
    marginTop: 20,
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginHorizontal: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  cardContent: {
    padding: 10,
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 10,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusEspera: {
    backgroundColor: 'red',
  },
  statusProceso: {
    backgroundColor: 'orange', // O 'yellow' como en tu maqueta
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  // ... (tus otros estilos)
});