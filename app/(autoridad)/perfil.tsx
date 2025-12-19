import { useAuth } from '@/context/AuthContext';
import { onSignOut } from '@/services/auth';
import { FIREBASE_DB } from '@/services/firebase';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import { collection, doc, getDoc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
interface ProfileStats {
  asignados: number;
  completados: number;
}
interface AppConfig {
  contactoEmail: string;
  contactoTelefono: string;
  version: string;
  acercaDe: string;
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
    return null;
  }
  
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({
      projectId: '366f2cee-7348-4e8a-9077-400b3d35e7d6', 
    });
    token = data;
  } catch (e) {
    console.error(e);
  }

  return token;
}

export default function PerfilScreen() {

  const { profile, isLoading: authLoading } = useAuth();
  const router = useRouter(); 

  const [stats, setStats] = useState<ProfileStats>({ asignados: 0, completados: 0 });
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isToggleLoading, setIsToggleLoading] = useState(false);

  const [notificacionesEnabled, setNotificacionesEnabled] = useState(true);
  const [ubicacionEnabled, setUbicacionEnabled] = useState(true);

  const [modalSoporteVisible, setModalSoporteVisible] = useState(false);
  const [modalAcercaVisible, setModalAcercaVisible] = useState(false);

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
    const fetchConfig = async () => {
      try {
        const docRef = doc(FIREBASE_DB, "config", "app_info");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAppConfig(docSnap.data() as AppConfig);
        } else {
          setAppConfig({
            contactoEmail: "soporte@app.com",
            contactoTelefono: "70000000",
            version: "1.0.0",
            acercaDe: "Información no disponible."
          });
        }
      } catch (error) {
        console.error("Error fetching config:", error);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (profile) {
      setNotificacionesEnabled(profile.pushToken != null);
      (async () => {
        const { status } = await Location.getForegroundPermissionsAsync();
        setUbicacionEnabled(status === 'granted');
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
          Alert.alert("Activado", "Notificaciones activadas.");
        } else {
          setNotificacionesEnabled(false); 
          Alert.alert("Permiso requerido", "Ve a ajustes y activa las notificaciones para esta app.");
        }
        setIsToggleLoading(false);
      } else {
        await updateDoc(userDocRef, { pushToken: null });
      }
    } catch (error) {
      console.error("Error toggle notif:", error);
      setNotificacionesEnabled(!newValue); 
    }
  };

  const handlePermissionsLink = () => {
    Alert.alert(
      "Gestionar Permisos",
      "Para cambiar permisos (Ubicación, Cámara, etc.) debes ir a los ajustes del sistema Android.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Abrir Ajustes", onPress: () => Linking.openSettings() } 
      ]
    );
  };

  const handleLogout = async () => {
    try {
      await onSignOut();
      await Updates.reloadAsync();
    } catch (error) {
      router.replace('/'); 
    }
  };

  if (authLoading || isStatsLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }
w
  return (
    <View style={styles.mainContainer}>

    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.headerContainer}>
        <Image 
          source={{ uri: profile?.photoURL || 'https://via.placeholder.com/100' }} 
          style={styles.profileImage} 
        />
        <Text style={styles.profileName}>{profile?.displayName || "Usuario"}</Text>
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
          <Text style={styles.sectionTitle}>Configuracion</Text>
          <View style={styles.row}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowLabel}>Notificaciones</Text>
              <Text style={styles.rowSubLabel}>Recibir actualizaciones de reportes</Text>
            </View>
            <Switch
              trackColor={{ false: "#767577", true: "#007AFF" }}
              thumbColor={notificacionesEnabled ? "#fff" : "#f4f3f4"}
              onValueChange={handleNotificationToggle}
              value={notificacionesEnabled}
              disabled={isToggleLoading}
            />
          </View>

          <View style={styles.rowNoBorder}>
            <Ionicons name="location-outline" size={24} color="#333" />
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowLabel}>Ubicacion</Text>
              <Text style={styles.rowSubLabel}>Permitir acceso a ubicacion</Text>
            </View>
            <Switch
              trackColor={{ false: "#767577", true: "#007AFF" }}
              thumbColor={ubicacionEnabled ? "#fff" : "#f4f3f4"}
              onValueChange={handlePermissionsLink} 
              value={ubicacionEnabled}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Informacion</Text>
          
          <TouchableOpacity style={styles.row} onPress={() => setModalSoporteVisible(true)}>
            <Ionicons name="mail-outline" size={24} color="#333" />
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowLabel}>Contactar Soporte</Text>
              <Text style={styles.rowSubLabel}>Obtener ayuda tecnica</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.rowNoBorder} onPress={() => setModalAcercaVisible(true)}>
            <Ionicons name="information-circle-outline" size={24} color="#333" />
            <View style={styles.rowTextContainer}>
              <Text style={styles.rowLabel}>Acerca de</Text>
              <Text style={styles.rowSubLabel}>Version {appConfig?.version || '1.0.0'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#D32F2F" style={{marginRight: 10}} />
            <Text style={styles.logoutButtonText}>Cerrar Sesion</Text>
        </TouchableOpacity>
        
      </View>
    </ScrollView>

    <Modal
      animationType="fade"
      transparent={true}
      visible={modalSoporteVisible}
      onRequestClose={() => setModalSoporteVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Soporte Técnico</Text>
          <Text style={styles.modalText}>
            Si tienes problemas con la aplicación, contáctanos:
          </Text>
          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color="#007AFF" />
            <Text style={styles.infoText}>{appConfig?.contactoEmail || 'Cargando...'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call" size={20} color="#007AFF" />
            <Text style={styles.infoText}>{appConfig?.contactoTelefono || 'Cargando...'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.modalButton} 
            onPress={() => setModalSoporteVisible(false)}
          >
            <Text style={styles.modalButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    <Modal
      animationType="fade"
      transparent={true}
      visible={modalAcercaVisible}
      onRequestClose={() => setModalAcercaVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Acerca de la App</Text>
          <Text style={styles.versionText}>Versión {appConfig?.version}</Text>
          <Text style={styles.modalDescription}>
            {appConfig?.acercaDe || 'Cargando información...'}
          </Text>
          <TouchableOpacity 
            style={styles.modalButton} 
            onPress={() => setModalAcercaVisible(false)}
          >
            <Text style={styles.modalButtonText}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    backgroundColor: '#0066FF', 
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: 'white',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
  },
  contentContainer: {
    paddingHorizontal: 20,
    top: -25,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statSeparator: {
    width: 1,
    backgroundColor: '#ddd',
    height: '80%',
    alignSelf: 'center',
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 15,
    textTransform: 'capitalize',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  rowSubLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: 'white',
    borderRadius: 15,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    borderWidth: 1,
    borderColor: '#ffcccc', 
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D32F2F',
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  versionText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginLeft: 10,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});