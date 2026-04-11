import { useRouter } from "expo-router";
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { FIREBASE_DB } from "../../services/firebase";

export interface Reporte {
  id: string;
  tipo: "Bache" | "Alcantarilla" | "Poste";
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
  require("../../assets/images/header-cbba-1.png"),
  require("../../assets/images/header-cbba-2.png"),
  require("../../assets/images/header-cbba-3.png"),
];
const { width: screenWidth } = Dimensions.get("window");

const REPORTES_POR_PAGINA = 10;

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();

  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const lastDocRef = useRef<any>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const carouselRef = useRef<FlatList | null>(null);

  useEffect(() => {
    if (!profile) return;

    setIsLoading(true);
    const reportesRef = collection(FIREBASE_DB, "reportes");
    const q = query(
      reportesRef,
      where("userId", "==", profile.uid),
      orderBy("createdAt", "desc"),
      limit(REPORTES_POR_PAGINA),
    );

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const reportesLocales: Reporte[] = [];
        querySnapshot.forEach((doc) => {
          reportesLocales.push({ id: doc.id, ...doc.data() } as Reporte);
        });

        if (querySnapshot.docs.length > 0) {
          lastDocRef.current =
            querySnapshot.docs[querySnapshot.docs.length - 1];
        } else {
          lastDocRef.current = null;
        }

        setHasMoreData(querySnapshot.docs.length === REPORTES_POR_PAGINA);
        setReportes(reportesLocales);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error al obtener reportes: ", error);
        setIsLoading(false);
      },
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, [profile]);

  const fetchMoreData = async () => {
    if (!hasMoreData || isFetchingMore || !lastDocRef.current || !profile)
      return;

    setIsFetchingMore(true);

    try {
      const reportesRef = collection(FIREBASE_DB, "reportes");
      const nextQuery = query(
        reportesRef,
        where("userId", "==", profile.uid),
        orderBy("createdAt", "desc"),
        startAfter(lastDocRef.current),
        limit(REPORTES_POR_PAGINA),
      );

      const documentSnapshots = await getDocs(nextQuery);

      if (documentSnapshots.empty) {
        setHasMoreData(false);
      } else {
        const moreReportesData: Reporte[] = [];
        documentSnapshots.forEach((doc) => {
          moreReportesData.push({ id: doc.id, ...doc.data() } as Reporte);
        });

        lastDocRef.current =
          documentSnapshots.docs[documentSnapshots.docs.length - 1];
        setHasMoreData(documentSnapshots.docs.length === REPORTES_POR_PAGINA);

        setReportes((prevReportes) => [...prevReportes, ...moreReportesData]);
      }
    } catch (error) {
      console.error("Error al cargar más reportes:", error);
    } finally {
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = (currentImageIndex + 1) % headerImages.length;
      carouselRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentImageIndex(nextIndex);
    }, 4000);
    return () => clearInterval(interval);
  }, [currentImageIndex]);

  const iniciarReporte = () => {
    router.push("/reporte1");
  };

  const verDetalle = (reporteId: string) => {
    router.push(`/${reporteId}`);
  };

  const renderHeaderCarousel = () => (
    <View style={styles.headerCarouselContainer}>
      <FlatList
        ref={carouselRef}
        data={headerImages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <ImageBackground source={item} style={styles.headerImageBackground}>
            <View style={styles.headerTextOverlay}>
              <Text style={styles.headerTitle}>
                Reporte de deficiencias en Cochabamba
              </Text>
              <Text style={styles.headerSubtitle}>
                Puedes reportar baches, alcantarillas y cortes de luz en postes
              </Text>
            </View>
          </ImageBackground>
        )}
        onMomentumScrollEnd={(event) => {
          const slideIndex = Math.round(
            event.nativeEvent.contentOffset.x / screenWidth,
          );
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
              index === currentImageIndex ? styles.paginationDotActive : {},
            ]}
          />
        ))}
      </View>
    </View>
  );

  const renderReporteItem = ({ item }: { item: Reporte }) => (
    <TouchableOpacity style={styles.card} onPress={() => verDetalle(item.id)}>
      <Image source={{ uri: item.imagenUrl }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.descripcion || `${item.tipo} sin descripción`}
        </Text>
        <View
          style={[
            styles.statusBadge,
            item.status === "En espera"
              ? styles.statusEspera
              : item.status === "Completado"
                ? styles.statusCompletado
                : styles.statusProceso,
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f4f4f8" />
      {renderHeaderCarousel()}

      <FlatList
        data={reportes}
        keyExtractor={(item) => item.id}
        renderItem={renderReporteItem}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        onEndReached={fetchMoreData}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={
          <>
            <Text style={styles.subHeader}>Tus reportes:</Text>
            {isLoading && (
              <ActivityIndicator size="large" style={{ marginTop: 20 }} />
            )}
          </>
        }
        ListEmptyComponent={
          !isLoading && reportes.length === 0 ? (
            <Text style={styles.noReportsText}>
              Aún no has enviado ningún reporte.
            </Text>
          ) : null
        }
        ListFooterComponent={
          isFetchingMore ? (
            <ActivityIndicator
              style={{ paddingVertical: 20 }}
              size="small"
              color="#007AFF"
            />
          ) : null
        }
      />

      <TouchableOpacity style={styles.reportButton} onPress={iniciarReporte}>
        <Text style={styles.reportButtonText}>Reportar una deficiencia</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerCarouselContainer: {
    height: 160,
    backgroundColor: "#2c2c2c",
  },
  headerImageBackground: {
    width: screenWidth,
    height: "100%",
    justifyContent: "flex-end",
  },
  headerTextOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    paddingVertical: 15,
    paddingHorizontal: 15,
    margin: 15,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  paginationContainer: {
    flexDirection: "row",
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFF",
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
    fontWeight: "bold",
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  noReportsText: {
    textAlign: "center",
    color: "gray",
    marginTop: 20,
  },
  card: {
    backgroundColor: "#f9f9f9",
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
    width: "100%",
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
    alignSelf: "flex-start",
  },
  statusEspera: {
    backgroundColor: "#D9534F",
  },
  statusProceso: {
    backgroundColor: "#F0AD4E",
  },
  statusCompletado: {
    backgroundColor: "#00e007ff",
  },
  statusText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  reportButton: {
    position: "absolute",
    bottom: 20,
    left: 15,
    right: 15,
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  reportButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
