import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function App() {
  const handlePress = () => {
    alert('¡Hola desde React Native!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Avisos</Text>
      <Button title="Presióname" onPress={handlePress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,              // Ocupa toda la pantalla
    justifyContent: 'center', // Centra verticalmente
    alignItems: 'center',     // Centra horizontalmente
    backgroundColor: '#f2f2f2',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
});
