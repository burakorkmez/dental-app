import '../global.css';

import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';

// Light mode only — see the design system. Splash auto-hides because we never
// call preventAutoHideAsync.
export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <ThemeProvider value={DefaultTheme}>
        <RootNavigator />
      </ThemeProvider>
    </ClerkProvider>
  );
}

// The guards do the routing: signed out only reaches the auth screen, signed in
// only reaches the app. No redirects, no flash of the wrong screen.
function RootNavigator() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;

  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#C6E2F5' } }}
    >
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="booking" />
        <Stack.Screen name="assistant" />
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
    </Stack>
  );
}
