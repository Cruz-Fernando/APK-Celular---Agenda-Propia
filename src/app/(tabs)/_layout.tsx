// app/(tabs)/_layout.tsx

// Importamos el componente Tabs de Expo Router. Este componente es el motor 
// que crea la barra inferior y gestiona la navegación entre pantallas.
import { Tabs } from 'expo-router';

// Importamos Ionicons, un paquete de iconos nativos que ya viene preinstalado en Expo.
import { Ionicons } from '@expo/vector-icons';

// Exportamos la función principal TabLayout. Esta función actúa como un "molde" (layout) 
// que envolverá a todas las pantallas que declaremos aquí adentro.
export default function TabLayout() {
  return (
    // <Tabs> renderiza la barra de navegación inferior en la pantalla de tu celular.
    // 'screenOptions' aplica reglas de diseño globales a todas las pestañas por igual.
    <Tabs
      screenOptions={{
        // tabBarActiveTintColor: El color del texto y del icono cuando estás en esa pestaña.
        tabBarActiveTintColor: '#007BFF',

        // tabBarInactiveTintColor: El color cuando la pestaña NO está seleccionada.
        tabBarInactiveTintColor: 'gray',

        // tabBarStyle: Controla el diseño físico de la barra. Aquí le damos 60px de altura.
        tabBarStyle: { paddingBottom: 5, height: 60 },

        // headerShown: Oculta el título feo que pone Android por defecto en la parte superior,
        // permitiendo que cada una de tus pantallas (como Apuntes o Agenda) dibuje su propio diseño.
        headerShown: false,
      }}>

      {/* --- PESTAÑA 1: APUNTES --- */}
      {/* <Tabs.Screen> representa un solo botón en tu barra de navegación. */}
      <Tabs.Screen
        name="index" // IMPORTANTE: 'name' busca el archivo exacto. "index" renderiza index.tsx
        options={{
          title: 'Apuntes', // El texto que lee el usuario debajo del icono.

          // tabBarIcon es una función que recibe el color (activo/inactivo) y el tamaño,
          // y retorna el icono que se dibujará en la barra.
          tabBarIcon: ({ color, size }) => (
            // Inyectamos las variables color y size para que el icono reaccione al tocarlo.
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />

      {/* --- PESTAÑA 2: TEMPORIZADOR --- */}
      <Tabs.Screen
        name="temporizador" // Renderiza el archivo temporizador.tsx
        options={{
          title: 'Pomodoro',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="timer-outline" size={size} color={color} />
          ),
        }}
      />

      {/* --- PESTAÑA 3: AGENDA --- */}
      <Tabs.Screen
        name="agenda" // Renderiza el archivo agenda.tsx
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      {/* --- PESTAÑA 4: HÁBITOS --- */}
      <Tabs.Screen
        name="habitos" // Renderiza el archivo habitos.tsx
        options={{
          title: 'Hábitos',
          tabBarIcon: ({ color, size }) => (
            // Usamos el icono de una medalla ('medal-outline') para representar las rachas y logros.
            <Ionicons name="medal-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}