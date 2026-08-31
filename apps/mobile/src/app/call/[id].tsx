import * as Sentry from '@sentry/react-native';
import {
  CallContent,
  CallingState,
  StreamCall,
  useStreamVideoClient,
  type Call,
} from '@stream-io/video-react-native-sdk';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

/**
 * PLAN.md phase 6 — the scheduled teleconsult. The call id is
 * `appointment-{id}`, derived server-side at booking (D9), so it is never
 * client-supplied and both sides land in the same room without coordinating.
 *
 * Ringing calls do NOT come here: those render as an overlay from the root
 * (`lib/stream.tsx`), which is what lets a ring reach the user on any screen.
 */
export default function CallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const client = useStreamVideoClient();
  const [error, setError] = useState<string | null>(null);

  // reuseInstance: the SDK may already hold this (type, id) from a ring or a
  // push wake-up; constructing a second one leaks the SFU connection. The call
  // is derived rather than held in state so this screen owns exactly one.
  const call: Call | undefined = useMemo(
    () => (client && id ? client.call('default', id, { reuseInstance: true }) : undefined),
    [client, id]
  );

  useEffect(() => {
    if (!call) return;
    // Ride out a lift or a tunnel instead of ending the consultation.
    call.setDisconnectionTimeout(120);
    const startedAt = Date.now();
    call.join({ create: true }).then(
      () =>
        Sentry.logger.info('teleconsult joined', {
          call_type: 'default',
          join_duration_ms: Date.now() - startedAt,
        }),
      (err) => {
        // A consultation nobody could join is the worst failure this app has —
        // the patient is sat waiting and the dentist is billing the slot. The
        // reason is a WebRTC/SFU string, never anything about the patient.
        Sentry.logger.error('teleconsult join failed', {
          call_type: 'default',
          reason: err instanceof Error ? err.message : 'unknown',
          duration_ms: Date.now() - startedAt,
        });
        setError('Could not join the consultation. Check your connection and try again.');
      }
    );

    return () => {
      // Guarded: CallContent's hangup already left, and leaving twice throws.
      if (call.state.callingState !== CallingState.LEFT) call.leave().catch(() => {});
    };
  }, [call]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-[40px]" style={{ backgroundColor: '#0B2E4E' }}>
        <Text className="text-center text-[15px]" style={{ color: '#C6E2F5', lineHeight: 21 }}>
          {error}
        </Text>
      </View>
    );
  }

  if (!call) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#0B2E4E' }}>
        <ActivityIndicator color="#7FD3EE" />
      </View>
    );
  }

  return (
    <StreamCall call={call}>
      {/* No SafeAreaView wrapper: CallContent pads itself from the insets
          bridged into StreamVideo's theme, and wrapping double-pads it. */}
      <CallContent onHangupCallHandler={() => router.back()} />
    </StreamCall>
  );
}
