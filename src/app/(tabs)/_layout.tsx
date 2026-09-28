// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Iconos que ya vienen con Expo

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // Color del icono y texto cuando la pestaña está seleccionada
        tabBarActiveTintColor: '#007BFF', 
        // Color inactivo
        tabBarInactiveTintColor: 'gray',
        // Estilo general de la barra inferior
        tabBarStyle: { paddingBottom: 5, height: 60 },
        // Esto oculta el título superior global para que cada pantalla tenga el suyo
        headerShown: false, 
      }}>
      
      {/* Configuración de la primera pestaña (index.tsx -> Apuntes) */}
      <Tabs.Screen
        name="index" // Debe coincidir con el nombre del archivo sin el .tsx
        options={{
          title: 'Apuntes', // Texto que aparece bajo el icono
          tabBarIcon: ({ color, size }) => (
            // Icono de libreta usando Ionicons
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Configuración de la segunda pestaña (temporizador.tsx) */}
      <Tabs.Screen
        name="temporizador"
        options={{
          title: 'Pomodoro',
          tabBarIcon: ({ color, size }) => (
            // Icono de reloj/cronómetro
            <Ionicons name="timer-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}