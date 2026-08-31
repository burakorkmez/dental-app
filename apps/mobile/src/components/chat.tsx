import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Channel,
  MessageComposer,
  MessageList,
  useChannelContext,
  useChatContext,
} from 'stream-chat-expo';

import { PAGE } from '@/components/ui';
import { useRingCall } from '@/lib/stream';

/**
 * One conversation with the clinic — the patient's Messages tab and, for
 * staff, a thread opened from the inbox. Both render this, so a change to the
 * header or the call button lands on both sides at once.
 */

/** Rings everyone else in this conversation. Lives inside `Channel` so it can
 *  read the members the SDK already has — no extra API call to find them. */
function CallButton() {
  const { channel } = useChannelContext();
  const ring = useRingCall();
  const [busy, setBusy] = useState(false);

  const onPress = async () => {
    setBusy(true);
    try {
      const memberIds = Object.keys(channel?.state.members ?? {});
      const started = await ring(memberIds);
      if (!started) Alert.alert('Nobody to call', 'There is no one else in this conversation yet.');
    } catch {
      Alert.alert('Could not start the call', 'Please try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      hitSlop={12}
      className="h-[40px] w-[40px] items-center justify-center rounded-full"
      style={{ backgroundColor: PAGE.tile, opacity: busy ? 0.5 : 1 }}
    >
      {busy ? (
        <ActivityIndicator size="small" color={PAGE.icon} />
      ) : (
        <SymbolView name="video.fill" size={19} tintColor={PAGE.icon} />
      )}
    </Pressable>
  );
}

function Header({ title, subtitle, onBack }: { title: string; subtitle: string; onBack?: () => void }) {
  const { top } = useSafeAreaInsets();

  return (
    <View
      className="flex-row items-center px-[20px] pb-[14px]"
      style={{
        paddingTop: top + 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: PAGE.border,
      }}
    >
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={12} className="mr-[14px]">
          <SymbolView name="chevron.left" size={19} weight="semibold" tintColor={PAGE.navy} />
        </Pressable>
      ) : null}
      <View className="flex-1">
        <Text className="text-[19px] font-bold" style={{ color: PAGE.navy }}>
          {title}
        </Text>
        <Text className="mt-[2px] text-[12.5px]" style={{ color: PAGE.sub }}>
          {subtitle}
        </Text>
      </View>
      <CallButton />
    </View>
  );
}

export function Conversation({
  channelId,
  title,
  subtitle,
  onBack,
}: {
  channelId: string;
  title: string;
  subtitle: string;
  onBack?: () => void;
}) {
  const { client } = useChatContext();

  // Rebuilt from the id rather than passed through navigation — a Channel
  // instance must not ride in route params. Every conversation in this app is
  // `messaging`, so the type never needs to travel either.
  const channel = useMemo(() => client.channel('messaging', channelId), [channelId, client]);

  return (
    // The header is rendered inside Channel, so nothing sits above it to offset
    // against. Both props must be an explicit 0: Channel destructures
    // keyboardVerticalOffset with no default, so omitting it passes undefined.
    <Channel channel={channel} keyboardVerticalOffset={0} topInset={0}>
      <View style={{ flex: 1, backgroundColor: PAGE.bg }}>
        <Header title={title} subtitle={subtitle} onBack={onBack} />
        <MessageList />
        <MessageComposer />
      </View>
    </Channel>
  );
}

export function ChatUnavailable({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center px-[40px]" style={{ backgroundColor: PAGE.bg }}>
      <SymbolView name="message" size={34} tintColor={PAGE.sub} />
      <Text
        className="mt-[16px] text-center text-[15px]"
        style={{ color: PAGE.sub, lineHeight: 21 }}
      >
        {message}
      </Text>
    </View>
  );
}

export const goBackToInbox = () => (router.canGoBack() ? router.back() : router.replace('/messages'));
