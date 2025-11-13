import { onSignOut } from '@/services/auth';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';

export default function AdminLayout() {
  const router = useRouter(); 

  const handleLogout = () => {
    onSignOut();
    router.replace('/');
  };

  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Panel de Administrador',
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
              <Ionicons 
                name="log-out-outline" 
                size={26} 
                color="#dc3545" 
              />
            </TouchableOpacity>
          ),
        }} 
      />
      <Stack.Screen 
        name="[userId]" 
        options={{ 
          title: 'Editar Usuario',
          presentation: 'modal', 
        }} 
      />
    </Stack>
  );
}