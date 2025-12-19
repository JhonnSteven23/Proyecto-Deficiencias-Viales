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
  tipoReporte?: string;
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
const getIconForReport = (tipoReporte?: string) => {
  if (tipoReporte && tipoReporte in iconsMap) {
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
    }, (error) => {
      console.error("Error en notificaciones autoridad:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const handlePressAviso = async (aviso: Notificacion) => {
    if (!aviso.leido) {
      setNotificaciones(prev => 
         prev.map(n => n.id === aviso.id ? {...n, leido: true} : n)
      );
      
      const notifDocRef = doc(FIREBASE_DB, "notificaciones", aviso.id);
      try {
        await updateDoc(notifDocRef, { leido: true });
      } catch (error) {
        console.error("Error al marcar leído:", error);
      }
    }

    if (aviso.reporteId) {
        router.push(`/(autoridad)/${aviso.reporteId}`);
    }
  };

  if (isLoading) {
    return (
        <View style={styles.centered}>
            <ActivityIndicator size="large" color="#007AFF" />
        </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notificaciones}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.card, !item.leido && styles.cardUnread]} 
            onPress={() => handlePressAviso(item)}
            activeOpacity={0.7}
          >
            {!item.leido && <View style={styles.unreadDot} />}

            <Image source={getIconForReport(item.tipoReporte)} style={styles.icon} />
            
            <View style={styles.textContainer}>
              <Text style={[styles.title, !item.leido && styles.titleUnread]} numberOfLines={1}>
                {item.titulo}
              </Text>
              <Text style={styles.body} numberOfLines={2}>
                  {item.cuerpo}
              </Text>
              <Text style={styles.date}>
                {item.createdAt?.toDate 
                    ? item.createdAt.toDate().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' }) 
                    : 'Reciente'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No tienes notificaciones pendientes.</Text>
            </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 16, color: '#888' },
  
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 6,
    marginHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardUnread: {
    backgroundColor: '#fff', 
    borderColor: '#007AFF', 
  },
  unreadDot: {
    position: 'absolute',
    left: 8,
    top: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 15,
    backgroundColor: '#f0f0f0',
  },
  textContainer: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 2 },
  titleUnread: { fontWeight: '800', color: '#000' },
  body: { fontSize: 13, color: '#666', lineHeight: 18 },
  date: { fontSize: 11, color: '#999', marginTop: 6, textAlign: 'right' },
});