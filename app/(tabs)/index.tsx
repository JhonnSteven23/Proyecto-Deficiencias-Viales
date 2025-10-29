import { useRouter } from 'expo-router';
import { Button } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  const iniciarReporte = () => {
    router.push('/(reporte)/reporte1'); 
  };

  return (
    <Button title="Reportar una deficiencia" onPress={iniciarReporte} />
  );
}