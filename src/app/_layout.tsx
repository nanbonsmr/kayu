import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PF } from '@/constants/colors';
import { calcExpiresAt, detectPaymentResult } from '@/services/dodo-service';
import { useSubscriptionStore } from '@/store/subscription-store';

export default function RootLayout() {
  const activatePro      = useSubscriptionStore((s) => s.activatePro);
  const loadSubscription = useSubscriptionStore((s) => s.loadSubscription);

  // Load persisted subscription on app start
  useEffect(() => {
    loadSubscription();
  }, []);

  // Handle deep-link redirects from Dodo (external browser fallback)
  // This fires when the OS opens the app via kayu://payment/success
  useEffect(() => {
    // Handle cold-start deep link (app was closed)
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Handle warm deep link (app was in background)
    const sub = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => sub.remove();
  }, []);

  const handleDeepLink = async (url: string) => {
    const result = detectPaymentResult(url);
    if (result === 'success') {
      await activatePro(calcExpiresAt());
      Alert.alert(
        '🎉 Welcome to Kayu Pro!',
        'Your subscription is now active. All premium features are unlocked!',
        [{ text: "Let's Go!" }]
      );
    }
    // cancel deep link — no action needed, user is already back in the app
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={PF.bg} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: PF.bg },
            animation: 'slide_from_right',
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen
            name="editor"
            options={{
              animation: 'slide_from_bottom',
              gestureEnabled: false,
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
