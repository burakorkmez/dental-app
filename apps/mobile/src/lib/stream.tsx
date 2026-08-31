import { useAuth } from '@clerk/expo';
import {
  RingingCallContent,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useCalls,
  useStreamVideoClient,
  type DeepPartial,
  type Theme,
} from '@stream-io/video-react-native-sdk';
import { randomUUID } from 'expo-crypto';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Chat,
  OverlayProvider,
  useCreateChatClient,
  type DeepPartial as ChatDeepPartial,
  type Theme as ChatTheme,
} from 'stream-chat-expo';

import { useApiClient, useMe } from './api';

/**
 * Stream Chat + Stream Video, wired once at the app root (PLAN.md phases 6/7).
 *
 * Both clients authenticate with one token from `POST /api/stream/token`. The
 * app never names its own Stream user id and never sees the API secret — the
 * server derives the id from the Clerk session, which is what stops a patient
 * minting a token for a staff member.
 */

type StreamSession = {
  apiKey: string;
  userId: string;
  name: string;
  role: 'patient' | 'staff' | 'dentist';
  token: string;
};

/**
 * How long to wait for Stream before giving up and running without it.
 * Neither wait below is self-limiting — `fetch` has no timeout, and
 * `useCreateChatClient` retries a failing connection indefinitely — so without
 * this the whole app sits behind a spinner whenever the API or Stream is
 * unreachable. Messaging is a feature; booking and the assistant are not
 * allowed to die with it.
 */
const CONNECT_TIMEOUT_MS = 12_000;

/** The patient's one conversation with the clinic, plus who to ring. */
type Clinic = { channelId: string | null; memberIds: string[] };

/** `ready` is false whenever Stream is unreachable, so screens can say so
 *  instead of crashing on a missing Chat context. */
const ClinicContext = createContext<Clinic & { ready: boolean }>({
  ready: false,
  channelId: null,
  memberIds: [],
});

/** Members of the clinic conversation — the ring list for a patient. */
export const useClinic = () => useContext(ClinicContext);

/** The app's chat/call theme: Stream's light defaults retinted to the aqua and
 *  navy in `components/ui.tsx`, so messaging doesn't read as a bolted-on SDK. */
const chatTheme: ChatDeepPartial<ChatTheme> = {
  semantics: {
    accentPrimary: '#159FC6',
    chatBgOutgoing: '#DCEEF5',
    chatBorderOutgoing: '#DCEEF5',
    chatTextOutgoing: '#0B2E4E',
    chatTextIncoming: '#0B2E4E',
    chatTextLink: '#1B93D4',
    chatTextRead: '#159FC6',
  },
};

/**
 * Places a ringing call. A fresh id per ring: Stream treats a call id as a
 * durable room, so reusing one replays the previous call's state.
 */
export function useRingCall() {
  const client = useStreamVideoClient();

  return useCallback(
    async (memberIds: string[]) => {
      // A call needs someone on the other end; one member is just yourself.
      if (!client || memberIds.length < 2) return false;
      const call = client.call('default', randomUUID(), { reuseInstance: true });
      await call.getOrCreate({
        ring: true,
        video: true,
        data: { members: memberIds.map((user_id) => ({ user_id })) },
      });
      return true;
    },
    [client]
  );
}

/**
 * Incoming and outgoing rings, rendered above every screen. Mounted once at the
 * root rather than per screen, so a call that arrives while the patient is deep
 * in the booking flow still surfaces.
 */
function RingingCalls() {
  const ringingCall = useCalls().filter((c) => c.ringing)[0];
  if (!ringingCall) return null;

  return (
    <StreamCall call={ringingCall}>
      <View style={StyleSheet.absoluteFill}>
        {/* Routes itself between incoming, outgoing and accepted UI. */}
        <RingingCallContent />
      </View>
    </StreamCall>
  );
}

function Connecting() {
  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#EDF6FE' }}>
      <ActivityIndicator color="#22B0D0" />
    </View>
  );
}

export function StreamProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const call = useApiClient();
  const [session, setSession] = useState<StreamSession | null>(null);
  const [failed, setFailed] = useState(false);
  const [wasSignedIn, setWasSignedIn] = useState(isSignedIn);

  // Signing out — or switching account — must not leave the previous user's
  // Stream token in play while the next one is still in flight, or the app
  // briefly connects to Stream as the wrong person. Adjusted during render,
  // matching MeProvider. https://react.dev/learn/you-might-not-need-an-effect
  if (wasSignedIn !== isSignedIn) {
    setWasSignedIn(isSignedIn);
    setSession(null);
    setFailed(false);
  }

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    call<StreamSession>('/api/stream/token', { method: 'POST' }).then(
      (next) => !cancelled && setSession(next),
      // Stream being unreachable must not take the whole app down with it —
      // booking and the assistant have nothing to do with messaging.
      () => !cancelled && setFailed(true)
    );
    return () => {
      cancelled = true;
    };
  }, [call, isLoaded, isSignedIn]);

  // Stage 1 deadline: the token POST. Stops once a session lands.
  useEffect(() => {
    if (!isSignedIn || failed || session) return;
    const timer = setTimeout(() => setFailed(true), CONNECT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isSignedIn, failed, session]);

  // Stage 2 deadline, owned by ConnectedStream: the chat socket.
  const giveUp = useCallback(() => setFailed(true), []);

  if (!isLoaded) return <Connecting />;
  if (!isSignedIn || failed) return <>{children}</>;
  if (!session) return <Connecting />;

  return (
    <ConnectedStream session={session} onUnavailable={giveUp}>
      {children}
    </ConnectedStream>
  );
}

/**
 * Both clients live here, so signing out unmounts this component and
 * disconnects them together before the next user's are built.
 */
function ConnectedStream({
  session,
  onUnavailable,
  children,
}: {
  session: StreamSession;
  onUnavailable: () => void;
  children: ReactNode;
}) {
  const call = useApiClient();
  const { me } = useMe();
  const { top, right, bottom, left } = useSafeAreaInsets();
  const [clinic, setClinic] = useState<Clinic>({ channelId: null, memberIds: [] });

  // Re-hits the same authenticated endpoint on expiry. Stable, because
  // `useApiClient` holds Clerk's getToken in a ref.
  const tokenProvider = useCallback(
    () => call<StreamSession>('/api/stream/token', { method: 'POST' }).then((s) => s.token),
    [call]
  );

  const userData = useMemo(
    () => ({ id: session.userId, name: session.name }),
    [session.userId, session.name]
  );

  const chatClient = useCreateChatClient({
    apiKey: session.apiKey,
    tokenOrProvider: tokenProvider,
    userData,
  });

  // getOrCreateInstance, never `new`: a second instance breaks ringing state
  // and push wake-ups. Idempotent for the same user, which is what makes it
  // safe to derive here rather than through an effect + setState.
  const videoClient = useMemo(
    () =>
      StreamVideoClient.getOrCreateInstance({
        apiKey: session.apiKey,
        user: userData,
        token: session.token,
        tokenProvider,
        options: { rejectCallWhenBusy: true },
      }),
    [session.apiKey, session.token, userData, tokenProvider]
  );

  // Signing out unmounts this component, which is where both clients hang up.
  useEffect(
    () => () => {
      videoClient.disconnectUser().catch(() => {});
    },
    [videoClient]
  );

  // Staff have an inbox, not a channel, so only patients resolve one. It is
  // also where the ring list comes from, so calling costs no extra round trip.
  const wantsChannel = session.role === 'patient' && me?.hasOnboarded;
  useEffect(() => {
    if (!wantsChannel) return;
    let cancelled = false;
    call<Clinic>('/api/stream/channel').then(
      (next) => !cancelled && setClinic(next),
      () => {}
    );
    return () => {
      cancelled = true;
    };
  }, [call, wantsChannel]);

  // Stream is up but the socket never opened. Hand back to the parent, which
  // renders the app un-wrapped so every non-Stream screen still works.
  useEffect(() => {
    if (chatClient) return;
    const timer = setTimeout(onUnavailable, CONNECT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [chatClient, onUnavailable]);

  if (!chatClient) return <Connecting />;

  // CallContent and RingingCallContent pad themselves from this theme, which is
  // why call screens are never wrapped in a SafeAreaView (that double-pads).
  const videoTheme: DeepPartial<Theme> = { variants: { insets: { top, right, bottom, left } } };

  return (
    <StreamVideo client={videoClient} style={videoTheme}>
      {/* The Chat theme rides on OverlayProvider's `style`, which is what the
          SDK merges last — see the theming docs. */}
      <OverlayProvider value={{ style: chatTheme }}>
        <Chat client={chatClient}>
          <ClinicContext.Provider value={{ ready: true, ...clinic }}>
            {children}
          </ClinicContext.Provider>
        </Chat>
      </OverlayProvider>
      {/* Sibling of the navigator so a ring covers whatever screen is open. */}
      <RingingCalls />
    </StreamVideo>
  );
}
