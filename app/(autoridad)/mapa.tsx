import { useAuth } from '@/context/AuthContext';
import { FIREBASE_DB } from '@/services/firebase';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

const IconoBache = require('../../assets/images/ReporteBache.png');
const IconoAlcantarilla = require('../../assets/images/ReporteAlcantarilla.png');
const IconoPoste = require('../../assets/images/ReportePoste.png');
const IconoDefault = require('../../assets/images/icon.png');
interface Reporte {
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

export default function MapaAutoridadScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [currentLocation, setCurrentLocation] = useState<Region | null>(null);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isLoadingReports, setIsLoadingReports] = useState(true);

  const mapRef = useRef<MapView>(null); 

  const getReportIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) { 
      case 'bache':
        return IconoBache;
      case 'alcantarilla':
        return IconoAlcantarilla;
      case 'poste':
        return IconoPoste;
      default:
        return IconoDefault; 
    }
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso de ubicación denegado', 'No podemos mostrar tu ubicación actual sin permiso.');
        setIsLoadingLocation(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const region: Region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      setCurrentLocation(region);
      setIsLoadingLocation(false);
      
      mapRef.current?.animateToRegion(region, 1000);

    })();
  }, []);

  useEffect(() => {
    if (!profile || profile.role !== 'autoridad' || !profile.especialidad) {
      setIsLoadingReports(false);
      return;
    }

    const reportesRef = collection(FIREBASE_DB, "reportes");
    const q = query(
      reportesRef,
      where("tipo", "==", profile.especialidad), 
      where("status", "in", ["En espera", "En progreso"]) 
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedReportes: Reporte[] = [];
      querySnapshot.forEach((doc) => {
        fetchedReportes.push({ id: doc.id, ...doc.data() } as Reporte);
      });
      setReportes(fetchedReportes);
      setIsLoadingReports(false);
    }, (error) => {
      console.error("Error al obtener reportes para el mapa: ", error);
      Alert.alert("Error", "No se pudieron cargar los reportes del mapa.");
      setIsLoadingReports(false);
    });

    return () => unsubscribe(); 
  }, [profile]);


  if (isLoadingLocation || isLoadingReports) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Cargando mapa y reportes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef} 
        style={styles.map}
        initialRegion={currentLocation || { 
          latitude: -17.7833, 
          longitude: -63.1822,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true} 
        showsMyLocationButton={true} 
      >
        {reportes.map((reporte) => (
          <Marker
          key={reporte.id}
          coordinate={reporte.ubicacion}
          onPress={() => router.push(`/(autoridad)/${reporte.id}`)}
        >
          <Image 
            source={getReportIcon(reporte.tipo)}
            style={styles.markerImage}
          />
        </Marker>
          
        ))}
      </MapView>
      {reportes.length === 0 && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>No hay reportes de {profile?.especialidad} pendientes.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  overlayText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },

  markerImage: {
    width: 40,  
    height: 40,
    resizeMode: 'contain', 
  }
});