import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChannelList, useChatContext } from 'stream-chat-expo';

import { ChatUnavailable, Conversation } from '@/components/chat';
import { PAGE } from '@/components/ui';
import { useMe } from '@/lib/api';
import { useClinic } from '@/lib/stream';

/**
 * PLAN.md phase 7 — secure chat with the clinic.
 *
 * One screen, two roles. A patient has exactly one conversation (A9), so they
 * land straight in it. Staff have the shared inbox, so they get the list and
 * open a thread from it.
 */
export default function Messages() {
  const { me } = useMe();
  const { ready, channelId } = useClinic();
  const isStaff = me?.role === 'staff' || me?.role === 'dentist';

  if (!ready) {
    return <ChatUnavailable message="Messaging is offline right now. Everything else still works." />;
  }
  if (isStaff) return <StaffInbox />;
  if (!channelId) {
    return <ChatUnavailable message="Finish setting up your profile and the clinic will be able to message you." />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Conversation
        channelId={channelId}
        title="Clinic Team"
        subtitle="DentaCare · usually replies same day"
      />
    </>
  );
}

/** Every patient conversation this staff member is a member of, newest first. */
function StaffInbox() {
  const { client } = useChatContext();
  const { top } = useSafeAreaInsets();
  const userId = client.userID;

  // Memoized: an unstable filter object makes ChannelList requery every render.
  const filters = useMemo(
    () => ({ type: 'messaging', members: { $in: [userId!] } }),
    [userId]
  );
  const sort = useMemo(() => [{ last_message_at: -1 as const }], []);
  const options = useMemo(() => ({ limit: 20, messages_limit: 30 }), []);

  return (
    <View style={{ flex: 1, backgroundColor: PAGE.bg }}>
      <StatusBar style="dark" />
      <View
        className="px-[20px] pb-[14px]"
        style={{
          paddingTop: top + 12,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: PAGE.border,
        }}
      >
        <Text className="text-[22px] font-bold" style={{ color: PAGE.navy }}>
          Inbox
        </Text>
        <Text className="mt-[2px] text-[12.5px]" style={{ color: PAGE.sub }}>
          Patient conversations
        </Text>
      </View>
      <ChannelList
        filters={filters}
        sort={sort}
        options={options}
        // The id, never the Channel instance — route params must stay serializable.
        onSelect={(channel) => router.push(`/channel/${channel.id}`)}
      />
    </View>
  );
}
