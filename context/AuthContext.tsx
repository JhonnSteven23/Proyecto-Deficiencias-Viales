import { FIREBASE_AUTH, FIREBASE_DB } from '@/services/firebase';
import * as Notifications from 'expo-notifications';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface AuthContextType {
  user: User | null;         
  profile: any | null;       
  isLoading: boolean;        
  setProfile: React.Dispatch<React.SetStateAction<any | null>>; 
}
const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  setProfile: () => {},
});

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
      alert('¡Error! No se pudo obtener el token para las notificaciones push.');
      return null;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("Expo Push Token:", token);

    return token;
}


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, async (user) => {
      setIsLoading(true);
      if (user) {
        setUser(user);
        const userDocRef = doc(FIREBASE_DB, "users", user.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const profileData = docSnap.data();
          setProfile(profileData);

          try {
            const token = await registerForPushNotificationsAsync();
            if (token && token !== profileData.pushToken) {
              console.log("Actualizando push token en Firestore...");
              await updateDoc(userDocRef, {
                pushToken: token,
              });
              setProfile({ ...profileData, pushToken: token }); 
            }
          } catch (e) {
            console.error("Error al registrar el token de notificación:", e);
          }

        } else {
          console.log("Error: Usuario logueado pero sin perfil en Firestore.");
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, setProfile }}> 
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  return useContext(AuthContext);
};