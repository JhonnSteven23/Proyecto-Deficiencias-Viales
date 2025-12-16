import { useRouter } from 'expo-router';
import { collection, doc, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { FIREBASE_DB } from '../../services/firebase';

export interface Notificacion {
  id: string;
  userId: string;
  reporteId: string;
  tipo: string;
  tipoReporte: 'Bache' | 'Alcantarilla' | 'Poste' | string; 
  titulo: string;
  cuerpo: string;
  leido: boolean;
  createdAt: any;
}

const iconsMap = {
  'Bache': require('../../assets/images/ReporteBache.png'),
  'Alcantarilla': require('../../assets/images/ReporteAlcantarilla.png'),
  'Poste': require('../../assets/images/ReportePoste.png'),
  'default': require('../../assets/images/icon.png'), 
};

type ReporteTipo = keyof typeof iconsMap;

const getIconForReport = (tipoReporte: string) => {
  if (tipoReporte in iconsMap) {
    return iconsMap[tipoReporte as ReporteTipo];
  }
  return iconsMap['default'];
};


export default function AvisosScreen() {
  
  const router = useRouter();
  const { profile } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    setIsLoading(true);

    const q = query(
      collection(FIREBASE_DB, "notificaciones"),
      where("userId", "==", profile.uid),
      orderBy("createdAt", "desc") 
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notis: Notificacion[] = [];
      querySnapshot.forEach((doc) => {
        notis.push({ id: doc.id, ...doc.data() } as Notificacion);
      });
      setNotificaciones(notis);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const handlePressAviso = async (aviso: Notificacion) => {
    if (!aviso.leido) {
      const notifDocRef = doc(FIREBASE_DB, "notificaciones", aviso.id);
      try {
        await updateDoc(notifDocRef, { leido: true });
      } catch (error) {
        console.error("Error al marcar como leído: ", error);
      }
    }
    router.push(`/(autoridad)/${aviso.reporteId}`);
  };

  if (isLoading) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notificaciones}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.card, !item.leido && styles.cardUnread]} 
            onPress={() => handlePressAviso(item)}
          >
            <Image source={getIconForReport(item.tipoReporte)} style={styles.icon} />
            <View style={styles.textContainer}>
              <Text style={[styles.title, !item.leido && styles.titleUnread]}>
                {item.titulo}
              </Text>
              <Text style={styles.body}>{item.cuerpo}</Text>
            </View>
            <Text style={styles.date}>
              {item.createdAt?.toDate().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No tienes avisos.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: 'gray',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 4,
    marginHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 1,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardUnread: {
    backgroundColor: '#e6f2ff', 
    borderColor: '#007AFF',
  },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: '#e9e9e9',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  titleUnread: {
    fontWeight: '900', 
  },
  body: {
    fontSize: 14,
    color: 'gray',
  },
  date: {
    fontSize: 12,
    color: 'gray',
    marginLeft: 10,
  },
});