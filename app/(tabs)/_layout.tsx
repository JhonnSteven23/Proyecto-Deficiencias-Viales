import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { FIREBASE_DB } from '../../services/firebase';

function TabBarIcon({ name, color, size, badgeCount }: { name: any; color: string; size: number; badgeCount: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <Ionicons name={name} size={size} color={color} />
      {badgeCount > 0 && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>
            {badgeCount > 9 ? '9+' : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function ReporteroTabsLayout() { 
  const { profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(FIREBASE_DB, "notificaciones"),
      where("userId", "==", profile.uid),
      where("leido", "==", false)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setUnreadCount(querySnapshot.size); 
    });

    return () => unsubscribe(); 
  }, [profile]);


  return (
    <Tabs
      screenOptions={{
        headerShown: true, 
        tabBarStyle: {
          backgroundColor: '#007AFF', 
          borderTopWidth: 0, 
        },
        tabBarActiveTintColor: '#FFFFFF', 
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.7)', 
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Reportes',
          headerTitle: 'Panel de Reportes', 
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="avisos"
        options={{
          title: 'Avisos',
          headerTitle: 'Historial de Avisos',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon 
              name="notifications-outline" 
              color={color} 
              size={size} 
              badgeCount={unreadCount} 
            />
          ),
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          headerTitle: 'Mi Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
              name="[reporteId]" 
              options={{
                href: null, 
                headerTitle: 'Detalle del Reporte',
              }}
            />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    position: 'absolute',
    right: -8,
    top: -4,    
    backgroundColor: 'red',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});