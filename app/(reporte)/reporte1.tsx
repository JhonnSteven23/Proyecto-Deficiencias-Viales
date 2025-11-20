import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useReport } from '../../context/ReportContext';

type TipoReporte = 'Bache' | 'Alcantarilla' | 'Poste';

const opcionesReporte = [
  {
    id: 'Bache' as TipoReporte,
    title: 'Bache',
    subtitle: 'Hoyos o daños en el pavimento',
    icon: require('../../assets/images/ReporteBache.png'),
  },
  {
    id: 'Alcantarilla' as TipoReporte,
    title: 'Alcantarilla tapada',
    subtitle: 'Tapas rotas, hundidas o revalsadas',
    icon: require('../../assets/images/ReporteAlcantarilla.png'),
  },
  {
    id: 'Poste' as TipoReporte,
    title: 'Poste dañado',
    subtitle: 'Postes de luz caídos o dañados',
    icon: require('../../assets/images/ReportePoste.png'),
  },
];

export default function TipoReporteScreen() {
  const router = useRouter();
  const { setTipo } = useReport(); 
  const [selected, setSelected] = useState<TipoReporte | null>(null);

  const handleSelect = (tipo: TipoReporte) => {
    setSelected(tipo);
  };

  const handleContinue = () => {
    if (selected) {
      setTipo(selected);
      router.push('/(reporte)/reporte2'); 
    } else {
      Alert.alert('Por favor, selecciona un tipo de deficiencia.');
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f4f4f8" />  
      <Text style={styles.subtitle}>
        Selecciona el tipo de deficiencia que encontraste
      </Text>

      <View style={styles.optionsContainer}>
        {opcionesReporte.map((opcion) => (
          <TouchableOpacity
            key={opcion.id}
            style={styles.card}
            onPress={() => handleSelect(opcion.id)}
          >
            <View style={styles.iconContainer}>
              <Image source={opcion.icon} style={styles.icon} resizeMode="contain" />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>{opcion.title}</Text>
              <Text style={styles.cardSubtitle}>{opcion.subtitle}</Text>
            </View>

            <View style={styles.radioOuter}>
              {selected === opcion.id && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, !selected && styles.buttonDisabled]} 
          onPress={handleContinue} 
          disabled={!selected}
        >
          <Text style={styles.buttonText}>Continuar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f4f4f8', 
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 20, 
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  optionsContainer: {
    flex: 1, 
  },
  card: {
    backgroundColor: '#ffffff', 
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12, 
    marginBottom: 15,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 8, 
    borderWidth: 3,
    borderColor: '#000000', 
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  icon: {
    width: 40,
    height: 40,
  },
  textContainer: {
    flex: 1, 
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#000',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#B0B0B0', 
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF', 
  },
  
  buttonContainer: {
    paddingBottom: 20, 
    paddingTop: 10,
    backgroundColor: '#f4f4f8' 
  },
  button: {
    backgroundColor: '#007AFF', 
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#a9a9a9', 
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});