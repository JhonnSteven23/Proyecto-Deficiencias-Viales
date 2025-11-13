import { useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, ImageBackground, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

const headerImages = [
  require('../../assets/images/header-cbba-1.png'),
  require('../../assets/images/header-cbba-2.png'),
  require('../../assets/images/header-cbba-3.png'),
];
const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth(); 

  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList | null>(null);

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

  useEffect(() => {
    const interval = setInterval(() => {
        let nextIndex = (currentImageIndex + 1) % headerImages.length;
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        setCurrentImageIndex(nextIndex);
    }, 4000); 
    return () => clearInterval(interval); 
  }, [currentImageIndex]); 


  const iniciarReporte = () => {
    router.push('/(reporte)/reporte1'); 
  };
  
  const verDetalle = (reporteId: string) => {
    router.push(`/${reporteId}`);
  };

  const renderHeaderCarousel = () => (
    <View style={styles.headerCarouselContainer}>
      <FlatList
        ref={flatListRef}
        data={headerImages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <ImageBackground source={item} style={styles.headerImageBackground}>
            <View style={styles.headerTextOverlay}>
              <Text style={styles.headerTitle}>Reporte de deficiencias en Cochabamba</Text>
              <Text style={styles.headerSubtitle}>Puedes reportar baches, alcantarillas y cortes de luz en postes</Text>
            </View>
          </ImageBackground>
        )}
        onMomentumScrollEnd={(event) => {
            const slideIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
            if (slideIndex !== currentImageIndex) {
                setCurrentImageIndex(slideIndex);
            }
        }}
      />
      <View style={styles.paginationContainer}>
        {headerImages.map((_, index) => (
          <View 
            key={index} 
            style={[
              styles.paginationDot, 
              index === currentImageIndex ? styles.paginationDotActive : {}
            ]} 
          />
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f4f4f8" />  
      {renderHeaderCarousel()}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
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
                reporte.status === 'En espera' ? styles.statusEspera : 
                (reporte.status === 'Completado' ? styles.statusCompletado : styles.statusProceso)
              ]}>
                <Text style={styles.statusText}>{reporte.status}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.reportButton} onPress={iniciarReporte}>
        <Text style={styles.reportButtonText}>Reportar una deficiencia</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', 
  },
  headerCarouselContainer: {
    height: 160, 
    backgroundColor: '#2c2c2c', 
  },
  headerImageBackground: {
    width: screenWidth, 
    height: '100%',
    justifyContent: 'flex-end', 
  },
  headerTextOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingVertical: 15,
    paddingHorizontal: 15,
    margin: 15,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  paginationContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    opacity: 0.5,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    opacity: 1,
  },

  scrollContainer: {
    paddingTop: 10,
    paddingBottom: 100, 
  },
  subHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 15,
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
    padding: 12,
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 10,
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 15, 
    alignSelf: 'flex-start',
  },
  statusEspera: {
    backgroundColor: '#D9534F', 
  },
  statusProceso: {
    backgroundColor: '#F0AD4E', 
  },
  statusCompletado: { 
    backgroundColor: '#00e007ff', 
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },

  reportButton: {
    position: 'absolute',
    bottom: 20, 
    left: 15,
    right: 15,
    backgroundColor: '#007AFF', 
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});