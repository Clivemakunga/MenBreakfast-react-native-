import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Redirect, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import 'react-native-reanimated';
import { supabase } from '../lib/supabase';
import { View } from 'react-native';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check if the user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for authentication changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (!loading) {
      // Hide the splash screen once the session check is complete
      await SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) {
    // Return null or a loading indicator while waiting
    return null;
  }


  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
       {session ? <Redirect href="/(tabs)/home" /> : <Redirect href="/" />}
       <Stack
        screenOptions={{
          headerShown: false,
          headerTitleStyle: {
            color: '#000',
            fontWeight: 'bold',
            fontSize: 20,
          },
          headerTintColor: '#000', // Back button and icons color
        }}
      >
        <Stack.Screen
          name="adminhome"
          options={{
            title: 'Admin', // Custom title
            headerShown: true,
            headerBackTitle: 'Back'
          }}
        />
        <Stack.Screen
          name="rsvps"
          options={{
            title: 'RSVPs', // Custom title
            headerShown: true,
            headerBackTitle: 'Back'
          }}
        />
        <Stack.Screen
          name="manageusers"
          options={{
            title: 'Manage Users', // Custom title
            headerShown: true,
            headerBackTitle: 'Back'
          }}
        />
         <Stack.Screen
          name="manageevents"
          options={{
            title: 'Manage Events', // Custom title
            headerShown: true,
            headerBackTitle: 'Back'
          }}
        />
      <Stack.Screen name="+not-found" />
      </Stack>
    </View>
  );
}
