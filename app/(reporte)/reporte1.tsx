import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useReport } from '../../context/ReportContext';

type TipoReporte = 'Bache' | 'Alcantarilla' | 'Poste';

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
      alert('Por favor, selecciona un tipo de deficiencia.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona el tipo de deficiencia</Text>
      <TouchableOpacity
        style={[styles.option, selected === 'Bache' && styles.selected]}
        onPress={() => handleSelect('Bache')}
      >
        <Image source={require('../../assets/images/bache.png')} style={styles.icon} /> 
        <Text>Bache</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.option, selected === 'Alcantarilla' && styles.selected]}
        onPress={() => handleSelect('Alcantarilla')}
      >
        <Image source={require('../../assets/images/alcantarilla.png')} style={styles.icon} />
        <Text>Alcantarilla tapada</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.option, selected === 'Poste' && styles.selected]}
        onPress={() => handleSelect('Poste')}
      >
        <Image source={require('../../assets/images/poste.png')} style={styles.icon} />
        <Text>Poste dañado</Text>
      </TouchableOpacity>

      <Button title="Continuar" onPress={handleContinue} disabled={!selected} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: 'white' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 10,
  },
  selected: {
    borderColor: 'blue',
    borderWidth: 2,
    backgroundColor: '#f0f5ff',
  },
  icon: {
    width: 40,
    height: 40,
    marginRight: 15,
  },
});