import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useReport } from '../../context/ReportContext';

export default function DetalleScreen() {
  const router = useRouter();
  const { reportData, setDescripcion, setImagenUri, limpiarReporte } = useReport();
  const [descripcionLocal, setDescripcionLocal] = useState('');
  const [imagenLocal, setImagenLocal] = useState<string | null>(null);

  const tomarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Se necesita permiso para usar la cámara.');
      return;
    }
    
    let result = await ImagePicker.launchCameraAsync({
      quality: 0.5,
    });

    if (!result.canceled) {
      setImagenLocal(result.assets[0].uri);
      setImagenUri(result.assets[0].uri); 
    }
  };

  const seleccionarDeGaleria = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Se necesita permiso para acceder a la galería.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });

    if (!result.canceled) {
      setImagenLocal(result.assets[0].uri);
      setImagenUri(result.assets[0].uri); 
    }
  };

  const handleEnviarReporte = () => {
    setDescripcion(descripcionLocal);
    console.log('Enviando reporte a Firebase:', reportData);
    alert('Reporte enviado con éxito');
    limpiarReporte();
    router.replace('/(tabs)'); 
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resumen del Reporte</Text>
        <Text>Tipo: {reportData.tipo || 'No seleccionado'}</Text>
        <Text>
          Ubicacion: {reportData.ubicacion 
            ? `${reportData.ubicacion.latitude.toFixed(5)}, ${reportData.ubicacion.longitude.toFixed(5)}`
            : 'No seleccionada'}
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Descripción</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Ejemplo: La deficiencia esta a mitad de la avenida"
          multiline
          maxLength={500}
          onChangeText={setDescripcionLocal} 
          value={descripcionLocal}
        />
        <Text style={styles.charCount}>{descripcionLocal.length}/500 caracteres</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Evidencia Fotográfica</Text>
        <View style={styles.buttonRow}>
          <Button title="Tomar Foto" onPress={tomarFoto} />
          <Button title="Seleccionar de galeria" onPress={seleccionarDeGaleria} />
        </View>
        
        {imagenLocal ? (
          <Image source={{ uri: imagenLocal }} style={styles.imagePreview} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text>No hay imágenes agregadas</Text>
          </View>
        )}
      </View>

      <Button title="Entregar reporte" onPress={handleEnviarReporte} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f0f0f0' },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  textInput: {
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    textAlignVertical: 'top',
  },
  charCount: { textAlign: 'right', color: 'gray', fontSize: 12, marginTop: 5 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
  imagePreview: { width: '100%', height: 200, borderRadius: 5, marginTop: 10 },
  imagePlaceholder: {
    height: 150,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 10,
  },
}); 