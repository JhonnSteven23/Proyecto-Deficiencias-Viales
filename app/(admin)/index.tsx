import { Link } from 'expo-router';
import React from 'react';
import { Button, StyleSheet, Text, View, } from 'react-native';

export default function AdminHomeScreen() {
  return (
    <View style={styles.container}>
      <Link href="/login" asChild>
        <Button title="Ir al Login" />
      </Link>
      <Text style={styles.title}>Panel de Admin</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold' },
});