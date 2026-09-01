import { useSSO } from '@clerk/expo';
import * as AuthSession from 'expo-auth-session';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const C = {
  heroBg: '#C6E2F5',
  card: '#E7F2FC',
  navy: '#1A456C',
  cyan: '#00C4F8',
  headline: '#032D53',
  subtitle: '#32526F',
  footer: '#4A6681',
  link: '#027BBC',
};

// Design-system "floating shadow": 0 12px 32px rgba(7,90,146,0.12)
const SHADOW = {
  shadowColor: '#075A92',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.22,
  shadowRadius: 14,
  elevation: 6,
} as const;

type Strategy = 'oauth_apple' | 'oauth_google';

/**
 * The Terms and Privacy Policy are pages on the web app (apps/web), so there is
 * one canonical text rather than a copy bundled into the binary that goes stale
 * on the next legal review. Opened in an in-app browser: leaving the app to
 * Safari mid-signup is where people drop out.
 */
const legalUrl = (path: '/terms' | '/privacy') =>
  `${process.env.EXPO_PUBLIC_API_URL ?? ''}${path}`;

function LegalLink({ path, children }: { path: '/terms' | '/privacy'; children: string }) {
  return (
    <Text
      className="font-semibold"
      style={{ color: C.link }}
      onPress={() => WebBrowser.openBrowserAsync(legalUrl(path))}
    >
      {children}
    </Text>
  );
}

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { startSSOFlow } = useSSO();
  const [busy, setBusy] = useState<Strategy | null>(null);

  // No createdSessionId means the user dismissed the browser, or the account
  // needs another factor — either way there is nothing to activate.
  const signInWith = async (strategy: Strategy) => {
    setBusy(strategy);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId) await setActive?.({ session: createdSessionId });
    } catch (err) {
      Alert.alert('Sign in failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: C.heroBg }}>
      <StatusBar style="dark" />

      <Image
        source={require('@/assets/images/auth-hero-tooth.png')}
        style={{ position: 'absolute', top: -60, left: 0, right: 0, height: '58%' }}
        contentFit="cover"
      />

      <View
        className="absolute inset-x-[7px] rounded-[32px] px-[34px]"
        style={{ backgroundColor: C.card, top: '48%', bottom: 9, paddingBottom: insets.bottom }}
      >
        <Text
          className="mt-[35px] text-center text-[35px] font-bold"
          style={{ color: C.navy }}
        >
          Dent<Text style={{ color: C.cyan }}>ify</Text>
        </Text>

        <Text
          className="mt-[13px] text-center text-[30px] font-bold"
          style={{ color: C.headline, lineHeight: 43 }}
        >
          Care for your smile,{'\n'}without the phone call
        </Text>

        <Text className="mt-[12px] text-center text-[14.3px]" style={{ color: C.subtitle }}>
          Modern dental care, made easy.
        </Text>

        <Pressable
          className="mt-[34px] h-[56px] flex-row items-center rounded-full bg-black pl-[110px]"
          style={[SHADOW, busy ? { opacity: 0.6 } : null]}
          disabled={busy !== null}
          onPress={() => signInWith('oauth_apple')}
        >
          {busy === 'oauth_apple' ? (
            <ActivityIndicator color="#FFFFFF" style={{ position: 'absolute', left: 49 }} />
          ) : (
            <SymbolView
              name="apple.logo"
              size={25}
              tintColor="#FFFFFF"
              style={{ position: 'absolute', left: 49 }}
            />
          )}
          <Text className="text-[18.5px] font-semibold text-white">
            Continue with Apple
          </Text>
        </Pressable>

        <Pressable
          className="mt-[20px] h-[56px] flex-row items-center rounded-full bg-white pl-[110px]"
          style={[SHADOW, busy ? { opacity: 0.6 } : null]}
          disabled={busy !== null}
          onPress={() => signInWith('oauth_google')}
        >
          {busy === 'oauth_google' ? (
            <ActivityIndicator color="#10253D" style={{ position: 'absolute', left: 46 }} />
          ) : (
            <Image
              source={require('@/assets/images/google-logo.png')}
              style={{ position: 'absolute', left: 46, width: 29, height: 29 }}
              contentFit="contain"
            />
          )}
          <Text className="text-[18.5px] font-semibold" style={{ color: '#10253D' }}>
            Continue with Google
          </Text>
        </Pressable>

        <View className="mt-[39px] flex-row items-center justify-center">
          <SymbolView name="lock.fill" size={10} tintColor={C.link} style={{ marginRight: 2 }} />
          <Text className="text-[12.5px]" style={{ color: C.footer }}>
            By continuing, you agree to our
          </Text>
        </View>
        <Text className="mt-[6px] text-center text-[12.5px]" style={{ color: C.footer }}>
          <LegalLink path="/privacy">Privacy Policy</LegalLink> and{' '}
          <LegalLink path="/terms">Terms of Service</LegalLink>
        </Text>
      </View>
    </View>
  );
}
