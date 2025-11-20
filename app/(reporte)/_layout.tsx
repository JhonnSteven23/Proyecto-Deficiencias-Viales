import { Stack } from 'expo-router';
import { ReportProvider } from '../../context/ReportContext';

export default function ReportLayout() {
  return (
    <ReportProvider>
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen
          name="reporte1"
          options={{ title: 'Tipo de Reporte' }}
        />
        <Stack.Screen
          name="reporte2"
          options={{ title: 'Elegir Ubicación' }}
        />
        <Stack.Screen
          name="reporte3"
          options={{ title: 'Completar Reporte' }}
        />
      </Stack>
    </ReportProvider>
  );
}