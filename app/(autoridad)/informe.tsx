import { useAuth } from '@/context/AuthContext';
import { FIREBASE_DB } from '@/services/firebase';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, ScrollView, StyleSheet, Text, View } from 'react-native';
interface Stats {
  total: number;
  espera: number;
  progreso: number;
  completados: number;
  rechazados: number;
  avgAceptacionMs: number; 
  avgSolucionMs: number;   
}

function formatDuration(ms: number): string {
  if (ms <= 0) return 'N/A';
  
  const dias = ms / (1000 * 60 * 60 * 24);
  if (dias >= 1) return `${dias.toFixed(1)} días`;
  
  const horas = ms / (1000 * 60 * 60);
  if (horas >= 1) return `${horas.toFixed(1)} hs`;
  
  const minutos = ms / (1000 * 60);
  return `${minutos.toFixed(0)} min`;
}

const StatCard = ({ title, value, iconName }: { title: string, value: string | number, iconName: keyof typeof Ionicons.glyphMap }) => (
  <View style={styles.statCard}>
    <Ionicons name={iconName} size={30} color="#007AFF" />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

const generateHTML = (profile: any, stats: Stats): string => {
  const fecha = new Date().toLocaleDateString();
  const especialidad = profile.especialidad.charAt(0).toUpperCase() + profile.especialidad.slice(1);

  const styles = `
    <style>
      body { font-family: sans-serif; margin: 20px; }
      h1 { color: #007AFF; }
      h2 { border-bottom: 2px solid #eee; padding-bottom: 5px; }
      table { width: 100%; border-collapse: collapse; margin-top: 15px; }
      th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
      th { background-color: #f5f5f5; }
      .header { text-align: center; }
      .label { font-weight: bold; }
    </style>
  `;
  return `
    <html>
      <head>${styles}</head>
      <body>
        <div class="header">
          <h1>Informe de Gestión de Deficiencias</h1>
          <p>Generado el: ${fecha}</p>
        </div>
        
        <h2>Gestor: ${profile.displayName}</h2>
        <p><span class="label">Especialidad:</span> ${especialidad}s</p>
        
        <h2>Resumen de Productividad</h2>
        <table>
          <tr>
            <td>Total Asignados</td>
            <td>${stats.total}</td>
          </tr>
          <tr>
            <td>Completados</td>
            <td>${stats.completados}</td>
          </tr>
        </table>
        
        <h2>Carga de Trabajo Actual</h2>
        <table>
          <tr>
            <td>En Espera</td>
            <td>${stats.espera}</td>
          </tr>
          <tr>
            <td>En Progreso</td>
            <td>${stats.progreso}</td>
          </tr>
          <tr>
            <td>Rechazados</td>
            <td>${stats.rechazados}</td>
          </tr>
        </table>
        
        <h2>Optimización de Procesos</h2>
        <table>
          <tr>
            <td>Tiempo Promedio de Aceptación</td>
            <td>${formatDuration(stats.avgAceptacionMs)}</td>
          </tr>
          <tr>
            <td>Tiempo Promedio de Solución</td>
            <td>${formatDuration(stats.avgSolucionMs)}</td>
          </tr>
        </table>
        
      </body>
    </html>
  `;
};

export default function InformeScreen() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (!profile || !profile.especialidad) {
      setIsLoading(false);
      return; 
    }

    const reportesRef = collection(FIREBASE_DB, "reportes");
    const q = query(
      reportesRef,
      where("tipo", "==", profile.especialidad)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let espera = 0;
      let progreso = 0;
      let completados = 0;
      let rechazados = 0;
      
      let totalTiemposAceptacion = 0;
      let reportesConAceptacion = 0;
      let totalTiemposSolucion = 0;
      let reportesConSolucion = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const status = data.status;

        if (data.createdAt && data.acceptedAt) {
          const tCreacion = data.createdAt.toDate().getTime();
          const tAceptacion = data.acceptedAt.toDate().getTime();
          if (tAceptacion > tCreacion) {
            totalTiemposAceptacion += (tAceptacion - tCreacion);
            reportesConAceptacion++;
          }
        }
        
        if (data.acceptedAt && data.completedAt) {
          const tAceptacion = data.acceptedAt.toDate().getTime();
          const tCompletado = data.completedAt.toDate().getTime();
          if (tCompletado > tAceptacion) { 
            totalTiemposSolucion += (tCompletado - tAceptacion);
            reportesConSolucion++;
          }
        }

        switch (status) {
          case 'En espera': espera++; break;
          case 'En progreso': progreso++; break;
          case 'Completado': completados++; break;
          case 'Rechazado': rechazados++; break;
        }
      });

      const avgAceptacionMs = reportesConAceptacion > 0 ? totalTiemposAceptacion / reportesConAceptacion : 0;
      const avgSolucionMs = reportesConSolucion > 0 ? totalTiemposSolucion / reportesConSolucion : 0;

      setStats({
        total: querySnapshot.size,
        espera,
        progreso,
        completados,
        rechazados,
        avgAceptacionMs,
        avgSolucionMs,
      });
      setIsLoading(false);

    }, (error) => {
      console.error("Error al obtener estadísticas: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);


  const handleGeneratePDF = async () => {
    if (!stats || !profile) {
      Alert.alert("Error", "No hay datos para generar el informe.");
      return;
    }
    setIsGeneratingPDF(true); 
    try {
      const html = generateHTML(profile, stats);
      const { uri } = await Print.printToFileAsync({ html });
      console.log('PDF generado en:', uri);

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Error", "La función de compartir no está disponible en este dispositivo.");
        return;
      }
      
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Informe de ${profile.especialidad} - ${new Date().toLocaleDateString()}`,
        UTI: '.pdf'
      });

    } catch (error) {
      console.error("Error al generar PDF: ", error);
      Alert.alert("Error", "No se pudo generar el PDF.");
    } finally {
      setIsGeneratingPDF(false); 
    }
  };

  if (isLoading) {
    return <ActivityIndicator style={styles.centered} size="large" />;
  }

  if (!stats) {
    return (
      <View style={styles.centered}>
        <Text>No se pudieron cargar las estadísticas.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Mi Gestión de: {profile?.especialidad}s</Text>
      
      <Text style={styles.sectionTitle}>Productividad Total</Text>
      <View style={styles.statCardContainer}>
        <StatCard 
          title="Total Asignados" 
          value={stats.total} 
          iconName="file-tray-full-outline" 
        />
        <StatCard 
          title="Completados" 
          value={stats.completados} 
          iconName="checkmark-circle-outline" 
        />
      </View>

      <Text style={styles.sectionTitle}>Carga de Trabajo Actual</Text>
      <View style={styles.statCardContainer}>
        <StatCard 
          title="En Espera" 
          value={stats.espera} 
          iconName="hourglass-outline" 
        />
        <StatCard 
          title="En Progreso" 
          value={stats.progreso} 
          iconName="build-outline" 
        />
      </View>
       <View style={styles.statCardContainer}>
        <StatCard 
          title="Rechazados" 
          value={stats.rechazados} 
          iconName="close-circle-outline" 
        />
      </View>

      <Text style={styles.sectionTitle}>Optimización de Procesos</Text>
      <View style={styles.statCardContainer}>
        <StatCard 
          title="Tiempo Prom. Aceptación" 
          value={formatDuration(stats.avgAceptacionMs)} 
          iconName="timer-outline" 
        />
        <StatCard 
          title="Tiempo Prom. Solución" 
          value={formatDuration(stats.avgSolucionMs)}
          iconName="speedometer-outline" 
        />
      </View>

      <View style={styles.exportButtonContainer}>
        {isGeneratingPDF ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : (
          <Button
            title="Generar Informe PDF"
            onPress={handleGeneratePDF}
            color="#007AFF"
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5', 
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textTransform: 'capitalize', 
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 25,
    marginBottom: 10,
  },
  statCardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCard: {
    flex: 1, 
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginVertical: 5,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center', 
  },

  exportButtonContainer: {
    marginTop: 40,
    marginBottom: 20,
  },
});