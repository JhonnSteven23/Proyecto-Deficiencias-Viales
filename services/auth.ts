// services/auth.ts
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { FIREBASE_AUTH } from './firebase';

// 1. Configurar Google Sign-In
// Recuerda que este ID de Cliente Web lo obtuvimos en la Fase 1
// Es el ID de la "Aplicación Web" de Google Cloud
GoogleSignin.configure({
  webClientId: 'T910577145779-n0skoesjgdunh1i3qb1uevr7u4n6mpmu.apps.googleusercontent.com',
});

// 2. Función para Iniciar Sesión
export const onGoogleButtonPress = async () => {
  try {
    // Verificar que Google Play Services esté disponible
    await GoogleSignin.hasPlayServices();

    // Obtener el idToken del usuario (esto muestra el pop-up nativo)
    const { idToken } = await GoogleSignin.signIn();

    // Crear una credencial de Firebase con el idToken
    const googleCredential = GoogleAuthProvider.credential(idToken);

    // Iniciar sesión en Firebase con la credencial
    const userCredential = await signInWithCredential(FIREBASE_AUTH, googleCredential);

    // ¡Éxito! El usuario está logueado en Firebase
    console.log("¡Usuario logueado!", userCredential.user);
    return userCredential.user;

  } catch (error: any) {
    if (error.code === 'SIGN_IN_CANCELLED') {
      console.log('El usuario canceló el inicio de sesión');
    } else if (error.code === 'IN_PROGRESS') {
      console.log('El inicio de sesión ya está en progreso');
    } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      console.log('Google Play Services no está disponible');
    } else {
      console.error('Error de Google Sign-In:', error);
    }
    return null;
  }
};

// 3. Función para Cerrar Sesión
export const onSignOut = async () => {
  try {
    await GoogleSignin.signOut(); // Cierra sesión de Google
    await FIREBASE_AUTH.signOut(); // Cierra sesión de Firebase
    console.log("Sesión cerrada");
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
};