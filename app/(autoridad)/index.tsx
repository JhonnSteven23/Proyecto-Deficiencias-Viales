import { useAuth } from '@/context/AuthContext';
import { FIREBASE_DB } from '@/services/firebase';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SceneMap, TabView } from 'react-native-tab-view';
interface Reporte {
  id: string;
  tipo: string;
  descripcion: string;
  imagenUrl: string;
  status: string;
  userDisplayName: string;
  createdAt: any;
}

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
    return <ActivityIndicator style={styles.centered} size="large" color="#2f6feb" />;
  }

  if (reportes.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: '#888' }}>No hay reportes "{status}".</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Reporte }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push(`/(autoridad)/${item.id}`)}
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardType}>Tipo: {item.tipo}</Text>
          <Text style={styles.cardUser}>De: {item.userDisplayName}</Text>
        </View>
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
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
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

  if (!profile) return <ActivityIndicator style={styles.centered} size="large" />;
  
  if (profile.role !== 'autoridad') {
    return (
      <View style={styles.centered}>
        <Text>Acceso denegado.</Text>
      </View>
    );
  }
  
  const renderTabBar = (props: any) => {
    return (
      <View style={styles.tabBarContainer}>
        {props.navigationState.routes.map((route: any, i: number) => {
          const isActive = index === i;
          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.tabItem,
                isActive ? styles.tabItemActive : styles.tabItemInactive
              ]}
              onPress={() => setIndex(i)}
            >
              <Text style={[
                styles.tabText,
                isActive ? styles.tabTextActive : styles.tabTextInactive
              ]}>
                {route.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f4f4f8" /> 
      <View style={styles.headerContainer}>
      </View>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={renderTabBar}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  tabBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 10,
},
  tabItem: {
    flex: 1,             
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
},
  tabItemActive: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
  },
  tabItemInactive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#333',
  },
  tabTextInactive: {
    color: '#fff',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  cardUser: {
    fontSize: 14,
    color: '#444',
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 12, 
    marginVertical: 5,
    backgroundColor: '#eee', 
  },
  description: {
    fontSize: 13,
    color: '#333',
    marginTop: 8,
    fontWeight: '500',
  },
});