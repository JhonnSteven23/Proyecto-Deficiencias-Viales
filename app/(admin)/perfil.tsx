import { useAuth } from '@/context/AuthContext';
import { onSignOut } from '@/services/auth';
import { FIREBASE_DB } from '@/services/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface AppConfig {
  contactoEmail: string;
  contactoTelefono: string;
  version: string;
  acercaDe: string;
}

export default function AdminPerfilScreen() {
  const { profile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [config, setConfig] = useState<AppConfig>({
    contactoEmail: '',
    contactoTelefono: '',
    version: '',
    acercaDe: ''
  });
  
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(FIREBASE_DB, "config", "app_info");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfig(docSnap.data() as AppConfig);
        }
      } catch (error) {
        console.error("Error cargando config:", error);
      } finally {
        setIsLoadingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSaveConfig = async () => {
    if (!config.contactoEmail || !config.contactoTelefono) {
      Alert.alert("Error", "Los campos de contacto no pueden estar vacíos.");
      return;
    }

    setIsSaving(true);
    try {
      const docRef = doc(FIREBASE_DB, "config", "app_info");
      await updateDoc(docRef, { ...config });
      Alert.alert("¡Actualizado!", "La información pública de la app ha sido modificada.");
    } catch (error) {
      console.error("Error guardando config:", error);
      Alert.alert("Error", "No se pudo guardar la configuración.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await onSignOut();
      await Updates.reloadAsync();
    } catch (error) {
      router.replace('/'); 
    }
  };

  if (authLoading || isLoadingConfig) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
          
          <View style={styles.headerContainer}>
            <Image 
              source={{ uri: profile?.photoURL || 'https://via.placeholder.com/100' }} 
              style={styles.profileImage} 
            />
            <Text style={styles.profileName}>{profile?.displayName || "Administrador"}</Text>
            <Text style={styles.profileEmail}>{profile?.email}</Text>
            <Text style={styles.profileRole}>(Rol: {profile?.role})</Text>
          </View>

          <View style={styles.contentContainer}>
            
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Editar Información Pública</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email de Soporte</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={config.contactoEmail}
                    onChangeText={(text) => setConfig({...config, contactoEmail: text})}
                    placeholder="ej: soporte@app.com"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Teléfono / WhatsApp</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={config.contactoTelefono}
                    onChangeText={(text) => setConfig({...config, contactoTelefono: text})}
                    placeholder="ej: +591 70000000"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Versión Actual</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="git-branch-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={config.version}
                    onChangeText={(text) => setConfig({...config, version: text})}
                    placeholder="1.0.0"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Descripción (Acerca de)</Text>
                <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={config.acercaDe}
                    onChangeText={(text) => setConfig({...config, acercaDe: text})}
                    placeholder="Descripción de la app..."
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSaveConfig}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#D32F2F" style={{marginRight: 10}} />
                <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
            </TouchableOpacity>
            
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    textTransform: 'uppercase',
  },

  contentContainer: {
    paddingHorizontal: 20,
    top: -25, 
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
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },

  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  textAreaWrapper: {
    alignItems: 'flex-start', 
    paddingVertical: 5,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  saveButton: {
    backgroundColor: '#007AFF', 
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
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
});