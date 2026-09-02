import '../global.css';

import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import * as Sentry from '@sentry/react-native';
import { DefaultTheme, Stack, ThemeProvider, useNavigationContainerRef } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MeProvider, useMe } from '@/lib/api';
import { StreamProvider } from '@/lib/stream';

// Turns each screen change into a transaction; the fetches and app start that
// happen under it hang off that transaction as spans. Registered below.
const navigationIntegration = Sentry.reactNavigationIntegration();

// No DSN (dev, or a checkout without one) leaves the SDK disabled.
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
  // ponytail: every transaction is sampled. Fine at this traffic — drop it to
  // ~0.1 (or swap in tracesSampler) once the app has real users.
  tracesSampleRate: 1.0,
  // Record every session, and every session that hit an error.
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    // Passing this explicitly is what overrides the masking — the SDK adds
    // `mobileReplayIntegration()` on its own once a replay sample rate is set,
    // and its defaults mask all three.
    //
    // ponytail: unmasked replay records the screen verbatim — a name, a DOB, a
    // medical history row and a chat thread all land in Sentry as video. That
    // contradicts the PHI non-negotiable in CLAUDE.md and is only survivable
    // while the app runs on seeded fake patients (PLAN.md A15). Flip these
    // three back to `true` — or drop the sample rates to 0 — before any real
    // patient signs in.
    Sentry.mobileReplayIntegration({
      maskAllText: false,
      maskAllImages: false,
      maskAllVectors: false,
    }),
    navigationIntegration,
  ],
  // Structured logs. Deliberately NOT paired with `consoleLoggingIntegration()`
  // — that would ship every console line to Sentry, which is exactly what
  // `beforeBreadcrumb` below strips out. Logs are written by hand, at the few
  // places worth watching in production.
  enableLogs: true,
  // PHI never leaves the boundary. A console breadcrumb carries whatever was
  // logged, so drop the category wholesale rather than pattern-matching a name,
  // and let an event carry the Clerk id but never an email or a display name.
  beforeBreadcrumb: (b) => (b.category === 'console' ? null : b),
  beforeSend: (event) => {
    if (event.user) event.user = { id: event.user.id };
    return event;
  },
  // `beforeSend` does not run on logs, and the SDK copies the scope's user onto
  // every one as `user.id` / `user.email` / `user.name` — a display name is a
  // patient name. Same reduction, second door.
  beforeSendLog: (log) => {
    delete log.attributes?.['user.email'];
    delete log.attributes?.['user.name'];
    return log;
  },
});

// Light mode only — see the design system. Splash auto-hides because we never
// call preventAutoHideAsync.
function RootLayout() {
  const navigationRef = useNavigationContainerRef();
  useEffect(() => {
    if (navigationRef?.current) navigationIntegration.registerNavigationContainer(navigationRef);
  }, [navigationRef]);

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
      {/*
        A deep link resolves any file under `app/`, declared here or not — so
        dropping the <Stack.Screen> would not have kept `dentify://sentry-test`
        from opening a crash harness in a release build. `Stack.Protected` is
        what actually removes the route. The Profile entry point has its own
        `__DEV__` guard; this is the one that holds when that is bypassed.
      */}
      <Stack.Protected guard={isSignedIn && __DEV__}>
        <Stack.Screen name="sentry-test" />
        <Stack.Screen name="sentry-logs" />
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
