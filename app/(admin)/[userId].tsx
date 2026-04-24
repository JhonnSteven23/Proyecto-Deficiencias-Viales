import { FIREBASE_DB } from "@/services/firebase";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AdminEditUserScreen() {
  const { userId } = useLocalSearchParams();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState("usuario");
  const [especialidad, setEspecialidad] = useState("");

  useEffect(() => {
    if (!userId) return;
    const fetchUser = async () => {
      const docRef = doc(FIREBASE_DB, "users", userId as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        setRole(data.role || "usuario");
        setEspecialidad(data.especialidad || "");
      } else {
        Alert.alert("Error", "No se encontró el usuario.");
        router.back();
      }
      setIsLoading(false);
    };
    fetchUser();
  }, [userId]);

  const handleSaveChanges = async () => {
    if (!userId) return;
    setIsLoading(true);

    if (role === "autoridad" && (!especialidad || especialidad === "")) {
      Alert.alert(
        "Error",
        "Debe seleccionar una especialidad para la autoridad.",
      );
      setIsLoading(false);
      return;
    }

    const finalEspecialidad = role === "autoridad" ? especialidad : null;

    try {
      const docRef = doc(FIREBASE_DB, "users", userId as string);
      await updateDoc(docRef, {
        role: role,
        especialidad: finalEspecialidad,
      });
      setIsLoading(false);
      Alert.alert("Éxito", "Usuario actualizado correctamente.");
      router.back();
    } catch (error) {
      console.error("Error al actualizar usuario: ", error);
      Alert.alert("Error", "No se pudo actualizar el usuario.");
      setIsLoading(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <ActivityIndicator style={styles.centered} size="large" color="#007AFF" />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f4f4f8" />
      <View style={styles.headerContainer}>
        <Text style={styles.name}>{profile.displayName}</Text>
        <Text style={styles.email}>{profile.email}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Rol del Usuario</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={role}
            style={styles.picker}
            dropdownIconColor="#007AFF"
            onValueChange={(itemValue) => {
              setRole(itemValue);
              if (itemValue !== "autoridad") {
                setEspecialidad("");
              }
            }}
          >
            <Picker.Item label="Usuario Normal" value="usuario" />
            <Picker.Item label="Autoridad" value="autoridad" />
            <Picker.Item label="Administrador" value="admin" />
          </Picker>
        </View>
      </View>

      {role === "autoridad" && (
        <View style={styles.card}>
          <Text style={styles.label}>Especialidad de la Autoridad</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={especialidad}
              style={styles.picker}
              dropdownIconColor="#007AFF"
              onValueChange={(itemValue) => setEspecialidad(itemValue)}
            >
              <Picker.Item
                label="Selecciona una especialidad..."
                value=""
                color="#888"
              />
              <Picker.Item label="Bache" value="Bache" />
              <Picker.Item label="Alcantarilla" value="Alcantarilla" />
              <Picker.Item label="Poste" value="Poste" />
            </Picker>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
        onPress={handleSaveChanges}
        disabled={isLoading}
      >
        <Text style={styles.saveButtonText}>
          {isLoading ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f4f4f8",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 25,
    marginTop: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    color: "#1a1a1a",
    marginBottom: 5,
  },
  email: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  label: {
    fontSize: 15,
    color: "#333",
    marginBottom: 10,
    fontWeight: "600",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    overflow: "hidden",
  },
  picker: {
    height: 55,
    width: "100%",
    color: "#333",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 40,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: "#8abbf0",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});
