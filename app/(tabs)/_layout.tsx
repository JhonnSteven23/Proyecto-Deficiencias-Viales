import { Ionicons } from '@expo/vector-icons'; // Importamos los iconos
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'blue', // Color de la pestaña activa
      }}>
      <Tabs.Screen
        name="index" // Este es el archivo index.tsx
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ios-home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="avisos" // Este es el archivo avisos.tsx
        options={{
          title: 'Avisos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ios-notifications" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil" // Este es el archivo perfil.tsx
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ios-person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}