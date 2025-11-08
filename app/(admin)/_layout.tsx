import { Stack } from 'expo-router';
import React from 'react';

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ title: 'Panel de Administrador' }} 
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