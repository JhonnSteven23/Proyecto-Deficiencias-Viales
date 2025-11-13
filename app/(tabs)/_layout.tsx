import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function AutoridadTabsLayout() {
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
            <Ionicons name="notifications-outline" size={size} color={color} />
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
    </Tabs>
  );
}