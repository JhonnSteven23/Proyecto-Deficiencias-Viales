
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDexDlubfcbFjUaV5R60UdDlRPoD1BiYc4",
  authDomain: "deficiencias-viales-jhonn.firebaseapp.com",
  projectId: "deficiencias-viales-jhonn",
  storageBucket: "deficiencias-viales-jhonn.firebasestorage.app",
  messagingSenderId: "910577145779",
  appId: "1:910577145779:web:6a1955cf6e9108025d1dc6",
  measurementId: "G-Y5XCP8ZKT3"
};

let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const FIREBASE_AUTH = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});