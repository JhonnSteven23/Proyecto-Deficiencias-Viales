import { useAuth } from '@/context/AuthContext';
import { FIREBASE_DB } from '@/services/firebase';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

// Interfaz para el documento de notificación
interface Notificacion {
  id: string;
  titulo: string;
  cuerpo: string;
  leido: boolean;
  createdAt: any; // Timestamp
}

export default function AvisosScreen() {
  const { profile } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setIsLoading(false);
      return;
    }

    const notificacionesRef = collection(FIREBASE_DB, "notificaciones");
    const q = query(
      notificacionesRef,
      // Filtra solo las notificaciones PARA ESTA autoridad
      where("userId", "==", profile.uid), 
      // Muestra las más nuevas primero
      orderBy("createdAt", "desc") 
    );

    // Escucha en tiempo real
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notis: Notificacion[] = [];
      querySnapshot.forEach((doc) => {
        notis.push({ id: doc.id, ...doc.data() } as Notificacion);
      });
      setNotificaciones(notis);
      setIsLoading(false);
    }, (error) => {
      console.error("Error al obtener notificaciones: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe(); // Limpia el listener
  }, [profile]);

  if (isLoading) {
    return <ActivityIndicator style={styles.centered} size="large" />;
  }

  if (notificaciones.length === 0) {
    return (
      <View style={styles.centered}>
        <Text>No tienes avisos nuevos.</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Notificacion }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.titulo}</Text>
      <Text style={styles.body}>{item.cuerpo}</Text>
      <Text style={styles.date}>
        {/* Muestra la fecha (simple) */}
        {item.createdAt?.toDate().toLocaleDateString()}
      </Text>
      {!item.leido && <View style={styles.unreadDot} />}
    </View>
  );

  return (
    <FlatList
      data={notificaciones}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      style={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    position: 'relative',
  },
  title: { fontSize: 16, fontWeight: 'bold' },
  body: { fontSize: 14, color: '#333', marginTop: 5 },
  date: { fontSize: 12, color: 'gray', marginTop: 10, textAlign: 'right' },
  unreadDot: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007bff',
  },
});