import { useAuth } from '@/context/AuthContext';
import { FIREBASE_DB } from '@/services/firebase';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

const IconoBacheRojo = require('../../assets/images/Bache_Rojo.png');
const IconoAlcantarillaRojo = require('../../assets/images/Alcantarilla_Rojo.png');
const IconoPosteRojo = require('../../assets/images/Poste_Rojo.png');

const IconoBacheAmarillo = require('../../assets/images/Bache_Amarillo.png');
const IconoAlcantarillaAmarillo = require('../../assets/images/Alcantarilla_Amarillo.png');
const IconoPosteAmarillo = require('../../assets/images/Poste_Amarillo.png');

const IconoBacheVerde = require('../../assets/images/Bache_Verde.png'); 
const IconoAlcantarillaVerde = require('../../assets/images/Alcantarilla_Verde.png');
const IconoPosteVerde = require('../../assets/images/Poste_Verde.png');

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
  const mapRef = useRef<MapView>(null);

  const [currentLocation, setCurrentLocation] = useState<Region | null>(null);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [showResolved, setShowResolved] = useState(false);

  const getReportIcon = (tipo: string, status: string) => {
    const tipoNorm = tipo.toLowerCase();
    const statusNorm = status.toLowerCase(); 

    if (statusNorm === 'en espera') {
      switch (tipoNorm) {
        case 'bache': return IconoBacheRojo;
        case 'alcantarilla': return IconoAlcantarillaRojo;
        case 'poste': return IconoPosteRojo;
        default: return IconoDefault;
      }
    } 
    else if (statusNorm === 'en progreso') {
      switch (tipoNorm) {
        case 'bache': return IconoBacheAmarillo;
        case 'alcantarilla': return IconoAlcantarillaAmarillo;
        case 'poste': return IconoPosteAmarillo;
        default: return IconoDefault;
      }
    }
    else if (statusNorm === 'completado') {
      switch (tipoNorm) {
        case 'bache': return IconoBacheVerde;
        case 'alcantarilla': return IconoAlcantarillaVerde;
        case 'poste': return IconoPosteVerde;
        default: return IconoDefault;
      }
    }
    
    return IconoDefault;
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'No podemos mostrar tu ubicación.');
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

    const estadosAFiltrar = showResolved 
      ? ["En espera", "En progreso", "Completado"] 
      : ["En espera", "En progreso"]; 

    const reportesRef = collection(FIREBASE_DB, "reportes");
    const q = query(
      reportesRef,
      where("tipo", "==", profile.especialidad), 
      where("status", "in", estadosAFiltrar) 
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedReportes: Reporte[] = [];
      querySnapshot.forEach((doc) => {
        fetchedReportes.push({ id: doc.id, ...doc.data() } as Reporte);
      });
      setReportes(fetchedReportes);
      setIsLoadingReports(false);
    }, (error) => {
      console.error("Error reportes mapa: ", error);
      setIsLoadingReports(false);
    });

    return () => unsubscribe(); 
  }, [profile, showResolved]); 

  if (isLoadingLocation) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2f6feb" />
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
              source={getReportIcon(reporte.tipo, reporte.status)}
              style={styles.markerImage}
            />
          </Marker>
        ))}
      </MapView>

      <View style={styles.filterButtonContainer}>
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            showResolved ? styles.filterButtonActive : styles.filterButtonInactive
          ]}
          onPress={() => setShowResolved(!showResolved)}
        >
          <Text style={[
            styles.filterButtonText, 
            showResolved ? styles.textActive : styles.textInactive
          ]}>
            {showResolved ? "Ocultar Resueltos" : "Mostrar Resueltos"}
          </Text>
        </TouchableOpacity>
      </View>

      {reportes.length === 0 && !isLoadingReports && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>
            No hay reportes {showResolved ? "en ninguna categoría" : "pendientes"}.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  markerImage: {
    width: 45,
    height: 45,
    resizeMode: 'contain', 
  },

  filterButtonContainer: {
    position: 'absolute',
    top: 50, 
    right: 20,
    zIndex: 10,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    borderWidth: 1,
    elevation: 5, 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  filterButtonInactive: {
    backgroundColor: 'white',
    borderColor: '#ccc',
  },
  filterButtonActive: {
    backgroundColor: '#28a745', 
    borderColor: '#28a745',
  },
  filterButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  textInactive: {
    color: '#333',
  },
  textActive: {
    color: 'white',
  },

  overlay: {
    position: 'absolute', bottom: 30, left: 20, right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 10, padding: 12,
    alignItems: 'center',
  },
  overlayText: { color: 'white', fontSize: 14 },
});