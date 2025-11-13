import { useAuth } from '@/context/AuthContext';
import { onSignOut } from '@/services/auth';
import { FIREBASE_DB } from '@/services/firebase';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
interface ProfileStats {
  asignados: number;
  completados: number;
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    Alert.alert('Error', 'No se pudo obtener el token para notificaciones push.');
    return null;
  }
  
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({
      projectId: '366f2cee-7348-4e8a-9077-400b3d35e7d6', 
    });
    token = data;
    console.log("Nuevo Push Token:", token);
  } catch (e) {
    console.error(e);
    Alert.alert('Error', 'No se pudo generar el token.');
  }

  return token;
}


export default function PerfilScreen() {
  const { profile, isLoading: authLoading } = useAuth();
  const router = useRouter(); 
  
  const [stats, setStats] = useState<ProfileStats>({ asignados: 0, completados: 0 });
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [notificacionesEnabled, setNotificacionesEnabled] = useState(true);
  const [ubicacionEnabled, setUbicacionEnabled] = useState(true);
  const [isToggleLoading, setIsToggleLoading] = useState(true); 

  useEffect(() => {
    if (!profile || !profile.especialidad) {
      setIsStatsLoading(false);
      return;
    }
    const reportesRef = collection(FIREBASE_DB, "reportes");
    const q = query(reportesRef, where("tipo", "==", profile.especialidad));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let completados = 0;
      querySnapshot.forEach((doc) => {
        if (doc.data().status === 'Completado') completados++;
      });
      setStats({ asignados: querySnapshot.size, completados });
      setIsStatsLoading(false);
    });
    return () => unsubscribe();
  }, [profile]);
  useEffect(() => {
    if (profile) {
      setNotificacionesEnabled(profile.pushToken != null);
      (async () => {
        const { status } = await Location.getForegroundPermissionsAsync();
        setUbicacionEnabled(status === 'granted');
        setIsToggleLoading(false);
      })();
    }
  }, [profile]);

  const handleNotificationToggle = async (newValue: boolean) => {
    if (!profile) return;
    setNotificacionesEnabled(newValue);
    
    try {
      const userDocRef = doc(FIREBASE_DB, "users", profile.uid);

      if (newValue === true) {
        setIsToggleLoading(true);
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await updateDoc(userDocRef, { pushToken: token });
          Alert.alert("Activado", "Las notificaciones se han activado para este dispositivo.");
        } else {
          setNotificacionesEnabled(false); 
        }
        setIsToggleLoading(false);
      } else {
        await updateDoc(userDocRef, { pushToken: null });
        Alert.alert("Desactivado", "Ya no recibirás notificaciones push.");
      }
    } catch (error) {
      console.error("Error al actualizar pushToken:", error);
      setNotificacionesEnabled(!newValue); 
      Alert.alert("Error", "No se pudo actualizar la configuración.");
    }
  };

  const handleLocationToggle = () => {
    Alert.alert(
      "Ajustes de Ubicación",
      "Para cambiar los permisos de ubicación, debes ir a los ajustes de la aplicación.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Abrir Ajustes", onPress: () => Linking.openSettings() } 
      ]
    );
  };

  const handleLogout = () => {
    router.replace('/'); 
    onSignOut();
  };

  if (authLoading || isStatsLoading || isToggleLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Image 
          source={{ uri: profile?.photoURL || 'https://via.placeholder.com/100' }} 
          style={styles.profileImage} 
        />
        <Text style={styles.profileName}>{profile?.displayName}</Text>
        <Text style={styles.profileEmail}>{profile?.email}</Text>
        <Text style={styles.profileRole}>(Rol: {profile?.role})</Text>
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.asignados}</Text>
            <Text style={styles.statLabel}>Reportes Asignados</Text>
          </View>
          <View style={styles.statSeparator} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.completados}</Text>
            <Text style={styles.statLabel}>Reportes Completados</Text>
          </View>
        </View>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>CONFIGURACIÓN</Text>
          <View style={styles.row}>
            <Ionicons name="notifications-outline" size={22} color="#555" />
            <Text style={styles.rowLabel}>Notificaciones</Text>
            <Switch
              trackColor={{ false: "#767577", true: "#007AFF" }}
              thumbColor={notificacionesEnabled ? "#f4f3f4" : "#f4f3f4"}
              onValueChange={handleNotificationToggle}
              value={notificacionesEnabled}
            />
          </View>
          <TouchableOpacity style={styles.row} onPress={handleLocationToggle}>
            <Ionicons name="location-outline" size={22} color="#555" />
            <Text style={styles.rowLabel}>Permitir acceso a ubicacion</Text>
            <Switch
              trackColor={{ false: "#767577", true: "#007AFF" }}
              thumbColor={ubicacionEnabled ? "#f4f3f4" : "#f4f3f4"}
              onValueChange={handleLocationToggle} 
              value={ubicacionEnabled}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.sectionCard}>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#dc3545" />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
        
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    backgroundColor: '#007AFF',
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: 'white',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  profileEmail: {
    fontSize: 16,
    color: 'white',
    opacity: 0.8,
  },
  profileRole: {
    fontSize: 14,
    color: 'white',
    opacity: 0.6,
    fontStyle: 'italic',
    marginTop: 2,
  },
  contentContainer: {
    padding: 20,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statSeparator: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc3545',
    marginLeft: 10,
  },
});