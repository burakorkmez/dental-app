import '../global.css';

import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import * as Sentry from '@sentry/react-native';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MeProvider, useMe } from '@/lib/api';
import { StreamProvider } from '@/lib/stream';

// No DSN (dev, or a checkout without one) leaves the SDK disabled.
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
  // PHI never leaves the boundary. A console breadcrumb carries whatever was
  // logged, so drop the category wholesale rather than pattern-matching a name,
  // and let an event carry the Clerk id but never an email or a display name.
  beforeBreadcrumb: (b) => (b.category === 'console' ? null : b),
  beforeSend: (event) => {
    if (event.user) event.user = { id: event.user.id };
    return event;
  },
});

// Light mode only — see the design system. Splash auto-hides because we never
// call preventAutoHideAsync.
function RootLayout() {
  return (
    // GestureHandlerRootView is required by Stream Chat's overlays, and
    // SafeAreaProvider feeds the insets the call UI pads itself with.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ClerkProvider
          publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
          tokenCache={tokenCache}
        >
          <ThemeProvider value={DefaultTheme}>
            <MeProvider>
              <StreamProvider>
                <RootNavigator />
              </StreamProvider>
            </MeProvider>
          </ThemeProvider>
        </ClerkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);

// The guards do the routing: signed out only reaches the auth screen, signed in
// only reaches the app. No redirects, no flash of the wrong screen.
function RootNavigator() {
  const { isLoaded, isSignedIn } = useAuth();
  const { loading, error, refresh } = useMe();

  // Hold the splash until we know both who they are and whether onboarding ran,
  // so `/home` never has to guess and bounce.
  if (!isLoaded || (isSignedIn && loading)) return null;
  if (isSignedIn && error) return <Unreachable message={error} onRetry={refresh} />;

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
        <Stack.Screen name="appointment/[id]" />
        <Stack.Screen name="assistant" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="channel/[id]" />
        <Stack.Screen name="call/[id]" />
      </Stack.Protected>
    </Stack>
  );
}

/** The API is down or unreachable. Retry beats dropping them into onboarding. */
function Unreachable({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-[40px]" style={{ backgroundColor: '#EDF6FE' }}>
      <Text className="text-center text-[20px] font-bold" style={{ color: '#0B2E4E' }}>
        Can&rsquo;t reach the clinic
      </Text>
      <Text className="mt-[10px] text-center text-[15px]" style={{ color: '#5D7C93' }}>
        {message}
      </Text>
      <Pressable onPress={onRetry} hitSlop={12} className="mt-[22px]">
        <Text className="text-[17px] font-semibold" style={{ color: '#1B93D4' }}>
          Try again
        </Text>
      </Pressable>
    </View>
  );
}
