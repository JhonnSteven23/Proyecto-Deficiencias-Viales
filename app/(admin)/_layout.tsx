import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true, 
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingBottom: 5,
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Gestión Usuarios',
          tabBarLabel: 'Usuarios',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="[userId]"
        options={{
          href: null,
          title: 'Editar Usuario',
          presentation: 'modal',
          headerShown: true, 
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil Admin',
          tabBarLabel: 'Mi Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}