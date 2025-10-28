import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'blue', 
      }}>
      <Tabs.Screen
        name="index" 
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ios-home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="avisos" 
        options={{
          title: 'Avisos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ios-notifications" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil" 
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name ="ios-person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}