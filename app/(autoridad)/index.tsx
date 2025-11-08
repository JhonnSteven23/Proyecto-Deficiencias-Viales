import { useAuth } from '@/context/AuthContext';
import { FIREBASE_DB } from '@/services/firebase';
import { collection, doc, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SceneMap, TabBar, TabView } from 'react-native-tab-view';
 
import { useRouter } from 'expo-router';
interface Reporte {
  id: string;
  tipo: string;
  descripcion: string;
  imagenUrl: string;
  status: string; 
  userDisplayName: string;
  createdAt: any; 
}

const actualizarEstadoReporte = async (id: string, nuevoStatus: string) => {
  try {
    const reporteDocRef = doc(FIREBASE_DB, "reportes", id);
    await updateDoc(reporteDocRef, {
      status: nuevoStatus,
    });
  } catch (error) {
    console.error("Error al actualizar estado: ", error);
    alert("Error al actualizar el reporte.");
  }
};

const ReportListScene = ({ status }: { status: "En espera" | "En progreso" | "Completado" | "Rechazado" }) => {
  const { profile } = useAuth();
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!profile || profile.role !== 'autoridad' || !profile.especialidad) {
      setIsLoading(false);
      return;
    }

    const reportesRef = collection(FIREBASE_DB, "reportes");
    const q = query(
      reportesRef,
      where("tipo", "==", profile.especialidad),
      where("status", "==", status), 
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const reportesData: Reporte[] = [];
      querySnapshot.forEach((doc) => {
        reportesData.push({ id: doc.id, ...doc.data() } as Reporte);
      });
      setReportes(reportesData);
      setIsLoading(false);
    }, (error) => {
      console.error(`Error al obtener reportes [${status}]: `, error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [profile, status]);

  if (isLoading) {
    return <ActivityIndicator style={styles.centered} size="large" />;
  }

  if (reportes.length === 0) {
    return (
      <View style={styles.centered}>
        <Text>No hay reportes "{status}".</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Reporte }) => (
        <TouchableOpacity 
      onPress={() => router.push(`/(autoridad)/${item.id}`)}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Tipo: {item.tipo}</Text>
        <Text>De: {item.userDisplayName}</Text>
        <Image source={{ uri: item.imagenUrl }} style={styles.image} />
        <Text style={styles.description} numberOfLines={2}>{item.descripcion}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={reportes}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
    />
  );
};

const renderScene = SceneMap({
  espera: () => <ReportListScene status="En espera" />,
  progreso: () => <ReportListScene status="En progreso" />,
  entregados: () => <ReportListScene status="Completado" />,
});

export default function AutoridadHomeScreen() {
  const layout = useWindowDimensions();
  const { profile } = useAuth();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'espera', title: 'En Espera' },
    { key: 'progreso', title: 'En Progreso' },
    { key: 'entregados', title: 'Entregados' },
  ]);

  if (!profile) {
    return <ActivityIndicator style={styles.centered} size="large" />;
  }
  if (profile.role !== 'autoridad') {
     return (
      <View style={styles.centered}>
        <Text>Acceso denegado.</Text>
      </View>
    );
  }

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width }}
      renderTabBar={props => (
        <TabBar
          {...props}
          style={{ backgroundColor: '#f0f0f0' }}
          labelStyle={{ color: '#333', fontSize: 12 }}
          indicatorStyle={{ backgroundColor: '#007bff' }}
          scrollEnabled={true}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 10, backgroundColor: '#f0f0f0' },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  description: { fontSize: 14, color: '#333', marginVertical: 10 },
  image: { width: '100%', height: 200, borderRadius: 5, marginTop: 10 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 15 },
});