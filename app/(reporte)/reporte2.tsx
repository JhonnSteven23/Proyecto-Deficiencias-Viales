import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { useReport } from '../../context/ReportContext';

export default function MapaScreen() {
  const router = useRouter();
  const { setUbicacion } = useReport(); 
  const [mapRegion, setMapRegion] = useState<Region | undefined>(undefined);
  const [markerCoord, setMarkerCoord] = useState<Location.LocationObjectCoords | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Se necesita permiso de ubicación para reportar.');
        setIsLoading(false);
        return;
      }
      try {
        let location = await Location.getCurrentPositionAsync({});
        const coords = location.coords;
        setMapRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
        setMarkerCoord(coords);
      } catch (e) {
        Alert.alert('Error', 'No se pudo obtener la ubicación.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleMapPress = (event: any) => {
    setMarkerCoord(event.nativeEvent.coordinate);
  };
  const handleContinue = () => {
    if (markerCoord) {
      setUbicacion(markerCoord); 
      router.push('/(reporte)/reporte3'); 
    } else {
      Alert.alert('Error', 'Por favor, marca una ubicación en el mapa.');
    }
  };
  if (isLoading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }
  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={mapRegion} onPress={handleMapPress} showsUserLocation>
        {markerCoord && (
          <Marker coordinate={markerCoord} draggable onDragEnd={(e) => setMarkerCoord(e.nativeEvent.coordinate)}/>
        )}
      </MapView>
      <View style={styles.buttonContainer}>
        <Button title="Siguiente" onPress={handleContinue} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
});