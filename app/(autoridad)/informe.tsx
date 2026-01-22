import { useAuth } from "@/context/AuthContext";
import { FIREBASE_DB } from "@/services/firebase";
import { endOfDay, isWithinInterval, parseISO, startOfDay } from "date-fns";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { BarChart } from "react-native-chart-kit";

LocaleConfig.locales["es"] = {
  monthNames: [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ],
  monthNamesShort: [
    "Ene.",
    "Feb.",
    "Mar.",
    "Abr.",
    "May.",
    "Jun.",
    "Jul.",
    "Ago.",
    "Sep.",
    "Oct.",
    "Nov.",
    "Dic.",
  ],
  dayNames: [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ],
  dayNamesShort: ["Dom.", "Lun.", "Mar.", "Mié.", "Jue.", "Vie.", "Sáb."],
  today: "Hoy",
};
LocaleConfig.defaultLocale = "es";

const screenWidth = Dimensions.get("window").width;

interface Reporte {
  id: string;
  tipo: string;
  descripcion: string;
  imagenUrl: string;
  status: string;
  createdAt: any;
  completedAt?: any;
  ubicacion: { latitude: number; longitude: number };
}

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
  if (ms <= 0) return "0 min";
  const dias = ms / (1000 * 60 * 60 * 24);
  if (dias >= 1) return `${dias.toFixed(0)} días`;
  const horas = ms / (1000 * 60 * 60);
  if (horas >= 1) return `${horas.toFixed(1)} hs`;
  const minutos = ms / (1000 * 60);
  return `${minutos.toFixed(0)} min`;
}

const BigStatCard = ({
  title,
  value,
  color = "#007AFF",
}: {
  title: string;
  value: number;
  color?: string;
}) => (
  <View style={[styles.bigCard, { borderColor: color }]}>
    <Text style={[styles.bigCardValue, { color }]}>{value}</Text>
    <Text style={[styles.bigCardTitle, { color }]}>{title}</Text>
  </View>
);

const MediumStatCard = ({ title, value }: { title: string; value: number }) => (
  <View style={styles.mediumCard}>
    <Text style={styles.mediumCardValue}>{value}</Text>
    <Text style={styles.mediumCardTitle}>{title}</Text>
  </View>
);

const TimeMetricCard = ({ title, value }: { title: string; value: string }) => (
  <View style={styles.timeCard}>
    <Text style={styles.timeCardValue}>{value}</Text>
    <Text style={styles.timeCardTitle}>{title}</Text>
  </View>
);

const generateHTML = (
  profile: any,
  stats: Stats,
  reportes: Reporte[],
  dateRange: { start: string | null; end: string | null },
): string => {
  const fechaHoy = new Date().toLocaleDateString();
  const especialidad =
    profile.especialidad.charAt(0).toUpperCase() +
    profile.especialidad.slice(1);
  const rangoTexto =
    dateRange.start && dateRange.end
      ? `Del ${dateRange.start} al ${dateRange.end}`
      : "Histórico Completo";

  let reportesHtml = `<h3>Listado de Reportes (${rangoTexto})</h3><table>`;
  reportesHtml += `
    <tr>
      <th>Estado</th>
      <th>Fecha Creación</th>
      <th>Fecha Completado</th>
      <th>Descripción</th>
    </tr>
  `;

  for (const reporte of reportes) {
    reportesHtml += `
      <tr>
        <td>${reporte.status}</td>
        <td>${reporte.createdAt?.toDate().toLocaleDateString() || "-"}</td>
        <td>${reporte.completedAt?.toDate().toLocaleDateString() || "-"}</td>
        <td class="text-wrap">${reporte.descripcion.substring(0, 60)}...</td>
      </tr>
    `;
  }
  reportesHtml += "</table>";

  return `
    <html>
      <head>
        <style>
          body { font-family: Helvetica, sans-serif; padding: 20px; }
          h1 { color: #007AFF; text-align: center; }
          h3 { border-bottom: 2px solid #eee; margin-top: 20px; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; color: #333; }
          .stats-grid { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .stat-box { border: 1px solid #ddd; padding: 10px; width: 48%; text-align: center; border-radius: 8px; }
          .big-num { font-size: 24px; font-weight: bold; color: #007AFF; display: block; }
        </style>
      </head>
      <body>
        <h1>Informe de Gestión: ${especialidad}</h1>
        <p style="text-align:center">Gestor: ${profile.displayName} | Generado: ${fechaHoy}</p>
        
        <h3>Métricas Globales</h3>
        <div class="stats-grid">
          <div class="stat-box">
             <span class="big-num">${stats.completados}</span>
             Reportes Completados
          </div>
          <div class="stat-box">
             <span class="big-num">${formatDuration(stats.avgSolucionMs)}</span>
             Tiempo Promedio Solución
          </div>
        </div>

        ${reportesHtml}
      </body>
    </html>
  `;
};

export default function InformeScreen() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const [range, setRange] = useState<{
    start: string | null;
    end: string | null;
  }>({ start: null, end: null });
  const [markedDates, setMarkedDates] = useState<any>({});

  useEffect(() => {
    if (!profile || !profile.especialidad) {
      setIsLoading(false);
      return;
    }

    const reportesRef = collection(FIREBASE_DB, "reportes");
    const q = query(reportesRef, where("tipo", "==", profile.especialidad));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReportes: Reporte[] = [];
      let counts = { espera: 0, progreso: 0, completados: 0, rechazados: 0 };
      let timeAceptacion = 0,
        countAcep = 0;
      let timeSolucion = 0,
        countSol = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedReportes.push({ id: doc.id, ...data } as Reporte);

        switch (data.status) {
          case "En espera":
            counts.espera++;
            break;
          case "En progreso":
            counts.progreso++;
            break;
          case "Completado":
            counts.completados++;
            break;
          case "Rechazado":
            counts.rechazados++;
            break;
        }

        if (data.createdAt && data.acceptedAt) {
          const diff =
            data.acceptedAt.toDate().getTime() -
            data.createdAt.toDate().getTime();
          if (diff > 0) {
            timeAceptacion += diff;
            countAcep++;
          }
        }
        if (data.acceptedAt && data.completedAt) {
          const diff =
            data.completedAt.toDate().getTime() -
            data.acceptedAt.toDate().getTime();
          if (diff > 0) {
            timeSolucion += diff;
            countSol++;
          }
        }
      });

      setReportes(fetchedReportes);
      setStats({
        total: snapshot.size,
        ...counts,
        avgAceptacionMs: countAcep ? timeAceptacion / countAcep : 0,
        avgSolucionMs: countSol ? timeSolucion / countSol : 0,
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const chartData = useMemo(() => {
    const months = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    const data = new Array(12).fill(0);

    reportes.forEach((r) => {
      if (r.status === "Completado" && r.completedAt) {
        const monthIndex = r.completedAt.toDate().getMonth();
        data[monthIndex]++;
      }
    });

    return {
      labels: months,
      datasets: [{ data }],
    };
  }, [reportes]);

  const handleDayPress = (day: { dateString: string }) => {
    let newRange = { ...range };
    let newMarked: any = {};

    if (!range.start || (range.start && range.end)) {
      newRange = { start: day.dateString, end: null };
      newMarked[day.dateString] = {
        startingDay: true,
        color: "#007AFF",
        textColor: "white",
      };
    } else {
      const start = range.start;
      const end = day.dateString;

      if (new Date(end) < new Date(start)) {
        newRange = { start: end, end: start };
      } else {
        newRange = { start, end };
      }

      newMarked[newRange.start!] = {
        startingDay: true,
        color: "#007AFF",
        textColor: "white",
      };
      newMarked[newRange.end!] = {
        endingDay: true,
        color: "#007AFF",
        textColor: "white",
      };
    }

    setRange(newRange);
    setMarkedDates(newMarked);
  };

  const handleGeneratePDF = async () => {
    if (!stats || reportes.length === 0) return;
    setIsGeneratingPDF(true);

    try {
      let reportesFiltrados = [...reportes];

      if (range.start && range.end) {
        const start = startOfDay(parseISO(range.start));
        const end = endOfDay(parseISO(range.end));

        reportesFiltrados = reportes.filter((r) => {
          if (!r.createdAt) return false;
          const fecha = r.createdAt.toDate();
          return isWithinInterval(fecha, { start, end });
        });
      }

      const html = generateHTML(profile, stats, reportesFiltrados, range);
      const { uri } = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: ".pdf",
          mimeType: "application/pdf",
        });
      }
    } catch (e) {
      Alert.alert("Error", "No se pudo crear el PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading || !stats)
    return <ActivityIndicator style={styles.centered} size="large" />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={styles.headerTitle}>Informes y Estadísticas</Text>
      <Text style={styles.subTitle}>
        Mi gestión de: {profile?.especialidad}s
      </Text>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Reportes Completados (Mensual)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <BarChart
            data={chartData}
            width={Math.max(screenWidth - 40, 500)}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              barPercentage: 0.5,
            }}
            style={styles.chart}
            showValuesOnTopOfBars
          />
        </ScrollView>
      </View>

      <Text style={styles.sectionTitle}>Productividad Total</Text>
      <View style={styles.row}>
        <BigStatCard
          title="Total Asignados"
          value={stats.total}
          color="#007AFF"
        />
        <BigStatCard
          title="Completados"
          value={stats.completados}
          color="#34C759"
        />
      </View>

      <Text style={styles.sectionTitle}>Carga de Trabajo Actual</Text>
      <View style={styles.row}>
        <MediumStatCard title="En Espera" value={stats.espera} />
        <MediumStatCard title="En Progreso" value={stats.progreso} />
      </View>
      <View style={{ marginTop: 10 }}>
        <MediumStatCard title="Rechazados" value={stats.rechazados} />
      </View>

      <Text style={styles.sectionTitle}>Métricas de Trabajo</Text>
      <View style={styles.row}>
        <TimeMetricCard
          title="Tiempo Promedio de Aceptación"
          value={formatDuration(stats.avgAceptacionMs)}
        />
        <TimeMetricCard
          title="Tiempo Promedio de Solución"
          value={formatDuration(stats.avgSolucionMs)}
        />
      </View>

      <Text style={styles.sectionTitle}>Generación de informes</Text>
      <Text style={styles.description}>
        Elige el rango de fechas para el PDF
      </Text>

      <View style={styles.calendarContainer}>
        <Calendar
          markingType={"period"}
          markedDates={markedDates}
          onDayPress={handleDayPress}
          theme={{
            selectedDayBackgroundColor: "#007AFF",
            todayTextColor: "#007AFF",
            arrowColor: "#007AFF",
            textMonthFontWeight: "bold",
          }}
        />
      </View>

      <TouchableOpacity
        style={styles.pdfButton}
        onPress={handleGeneratePDF}
        disabled={isGeneratingPDF}
      >
        {isGeneratingPDF ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.pdfButtonText}>GENERAR INFORME PDF</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, backgroundColor: "#f8f9fa", padding: 20 },

  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#1c1c1e" },
  subTitle: {
    fontSize: 18,
    color: "#333",
    marginBottom: 20,
    fontWeight: "600",
  },

  chartContainer: {
    alignItems: "center",
    marginVertical: 10,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 10,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#555",
    alignSelf: "flex-start",
  },
  chart: { borderRadius: 16 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1c1c1e",
    marginTop: 25,
    marginBottom: 15,
  },
  description: { fontSize: 14, color: "#666", marginBottom: 10 },

  row: { flexDirection: "row", justifyContent: "space-between" },

  bigCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bigCardValue: { fontSize: 36, fontWeight: "bold", marginBottom: 5 },
  bigCardTitle: { fontSize: 12, fontWeight: "600" },

  mediumCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginHorizontal: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#eee",
  },
  mediumCardValue: { fontSize: 28, fontWeight: "bold", color: "#007AFF" },
  mediumCardTitle: { fontSize: 12, color: "#666" },

  timeCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    elevation: 2,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  timeCardValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
    textAlign: "center",
    marginBottom: 5,
  },
  timeCardTitle: { fontSize: 11, color: "#007AFF", textAlign: "center" },

  calendarContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 10,
    elevation: 3,
    marginBottom: 20,
  },

  pdfButton: {
    backgroundColor: "#007AFF",
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  pdfButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
