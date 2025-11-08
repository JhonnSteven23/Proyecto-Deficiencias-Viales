import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function InformeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Informes</Text>
      <Text>Esta pantalla mostrará las estadísticas (próximamente).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
});