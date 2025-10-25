import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { FIREBASE_AUTH, FIREBASE_DB } from './firebase';

GoogleSignin.configure({
  webClientId: '910577145779-4l9n7vb9m1h8odbjt6i1adrfq728ubt7.apps.googleusercontent.com',
});

const createUserProfile = async (user: any) => {
  const userDocRef = doc(FIREBASE_DB, "users", user.uid);
  const docSnap = await getDoc(userDocRef);

  if (!docSnap.exists()) {
    console.log("Creando perfil para nuevo usuario...");
    try {
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: "usuario", 
        createdAt: serverTimestamp() 
      });
      console.log("¡Perfil creado en Firestore!");
    } catch (error) {
      console.error("Error al crear el perfil de usuario:", error);
    }
  } else {
    console.log("El usuario ya tiene un perfil en Firestore.");
  }
}

export const onGoogleButtonPress = async () => {
  try {
    await GoogleSignin.signOut();
    await FIREBASE_AUTH.signOut();
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    console.log("Información del Usuario de Google:", JSON.stringify(userInfo, null, 2));

    const idToken = (userInfo as any)?.data?.idToken ?? (userInfo as any)?.idToken;

    if (!idToken) {
      throw new Error("Error: No se recibió idToken de Google. Revisa tu configuración.");
    }

    const googleCredential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(FIREBASE_AUTH, googleCredential);
    console.log("¡Usuario logueado en Firebase Auth!", userCredential.user);

    await createUserProfile(userCredential.user);

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

export const onSignOut = async () => {
  try {
    await GoogleSignin.signOut(); 
    await FIREBASE_AUTH.signOut(); 
    console.log("Sesión cerrada");
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
};