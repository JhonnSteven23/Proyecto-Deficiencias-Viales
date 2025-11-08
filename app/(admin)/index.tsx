import { FIREBASE_DB } from '@/services/firebase';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
interface UserProfile {
  id: string; 
  displayName: string;
  email: string;
  role: 'usuario' | 'autoridad' | 'admin';
  especialidad?: string | null;
}

export default function AdminIndexScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const usersRef = collection(FIREBASE_DB, "users");
    const q = query(usersRef, orderBy("displayName", "asc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedUsers: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        fetchedUsers.push({ id: doc.id, ...doc.data() } as UserProfile);
      });
      setUsers(fetchedUsers);
      setIsLoading(false);
    }, (error) => {
      console.error("Error al obtener usuarios (Admin): ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return <ActivityIndicator style={styles.centered} size="large" />;
  }

  const renderItem = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/(admin)/${item.id}`)}
    >
      <View>
        <Text style={styles.cardName}>{item.displayName}</Text>
        <Text style={styles.cardEmail}>{item.email}</Text>
      </View>
      <View style={styles.cardRoleContainer}>
        <Text style={styles.cardRole}>{item.role.toUpperCase()}</Text>
        {item.especialidad && (
          <Text style={styles.cardEspecialidad}>{item.especialidad}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={users}
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
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  cardName: { fontSize: 16, fontWeight: 'bold' },
  cardEmail: { fontSize: 14, color: '#666' },
  cardRoleContainer: { alignItems: 'flex-end' },
  cardRole: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: '#007AFF', 
    backgroundColor: '#e0e0e0', 
    paddingHorizontal: 5, 
    borderRadius: 3,
    overflow: 'hidden',
  },
  cardEspecialidad: { 
    fontSize: 12, 
    color: '#333',
    fontStyle: 'italic',
    marginTop: 2,
  },
});