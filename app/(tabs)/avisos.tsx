import { useAuth } from '@/context/AuthContext';
import { FIREBASE_DB } from '@/services/firebase';
import { useRouter } from 'expo-router';
import { collection, doc, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'; // <--- Importar Image

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

export default function AvisosScreenUsuario() {
  const router = useRouter();
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
      console.error("Error al obtener notificaciones del usuario: ", error);
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
        Alert.alert("Error", "No se pudo marcar el aviso como leído.");
      }
    }
    
    if (aviso.reporteId) {
        router.push(`/${aviso.reporteId}`); 
    }
  };


  if (isLoading) {
    return <ActivityIndicator style={styles.centered} size="large" />;
  }

  const renderItem = ({ item }: { item: Notificacion }) => (
    <TouchableOpacity 
      style={[styles.card, !item.leido && styles.cardUnread]}
      onPress={() => handlePressAviso(item)} 
    >
      <Image 
        source={getIconForReport(item.tipoReporte)} 
        style={styles.icon} 
      />
      
      {!item.leido && <View style={styles.unreadDot} />}
      
      <View style={styles.textContent}>
        <Text style={[styles.title, !item.leido && styles.titleUnread]}>{item.titulo}</Text>
        <Text style={styles.body}>{item.cuerpo}</Text>
        <Text style={styles.date}>
          {item.createdAt?.toDate().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={notificaciones}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={(
            <View style={styles.centered}>
                <Text style={styles.emptyText}>No tienes avisos.</Text>
            </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#f4f4f8' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray' },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginVertical: 4,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    position: 'relative',
    flexDirection: 'row', 
    alignItems: 'center',
  },
  cardUnread: {
    backgroundColor: '#fffbe6', 
    borderColor: '#ffc107', 
    borderWidth: 1,
  },
  icon: { 
    width: 30,
    height: 30,
    marginRight: 10,
    borderRadius: 5,
  },
  textContent: { 
    flex: 1,
    paddingLeft: 5, 
  },
  title: { fontSize: 16, fontWeight: 'bold' },
  titleUnread: {
    fontWeight: '700', 
  },
  body: { fontSize: 14, color: '#333', marginTop: 5 },
  date: { fontSize: 12, color: 'gray', marginTop: 10, textAlign: 'right' },
  unreadDot: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5, 
    backgroundColor: '#007AFF', 
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
});