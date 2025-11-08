import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { FIREBASE_AUTH, FIREBASE_DB } from './firebase';

GoogleSignin.configure({
  webClientId: '910577145779-4l9n7vb9m1h8odbjt6i1adrfq728ubt7.apps.googleusercontent.com',
});

const createUserProfile = async (user: any): Promise<any> => {
  const userDocRef = doc(FIREBASE_DB, "users", user.uid);
  const docSnap = await getDoc(userDocRef);

  if (!docSnap.exists()) {
    console.log("Creando perfil para nuevo usuario...");
    const profileData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: "usuario", 
      pushToken: null,     
      especialidad: null,  
      createdAt: serverTimestamp() 
  };
    
    try {
      await setDoc(userDocRef, profileData);
      console.log("¡Perfil creado en Firestore!");
      return profileData; 
    } catch (error) {
      console.error("Error al crear el perfil de usuario:", error);
      return null;
    }

  } else {
    console.log("El usuario ya tiene un perfil en Firestore.");
    return docSnap.data(); 
  }
}

export const onGoogleButtonPress = async () => {
  try {
    await GoogleSignin.signOut();
    await FIREBASE_AUTH.signOut();
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const idToken = (userInfo as any)?.data?.idToken ?? (userInfo as any)?.idToken;

    if (!idToken) {
      throw new Error("Error: No se recibió idToken de Google.");
    }

    const googleCredential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(FIREBASE_AUTH, googleCredential);
    console.log("¡Usuario logueado en Firebase Auth!", userCredential.user);
    const profile = await createUserProfile(userCredential.user);
    return profile; 

  } catch (error: any) {
    console.error('Error de Google Sign-In:', error);
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