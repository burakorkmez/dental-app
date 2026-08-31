import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useChatContext } from 'stream-chat-expo';

import { ChatUnavailable, Conversation, goBackToInbox } from '@/components/chat';
import { useClinic } from '@/lib/stream';

/**
 * One patient thread, opened from the staff inbox. The patient side never
 * reaches here — they have a single conversation and it lives in the tab.
 */
export default function ChannelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ready } = useClinic();
  const { client } = useChatContext();

  if (!ready || !id) {
    return <ChatUnavailable message="This conversation could not be opened." />;
  }

  // Already in the client's cache from the inbox query, so the patient's name
  // is there without another round trip.
  const name = client.activeChannels[`messaging:${id}`]?.data?.name;

  return (
    <>
      <StatusBar style="dark" />
      <Conversation
        channelId={id}
        title={name ?? 'Patient'}
        subtitle="Patient conversation"
        onBack={goBackToInbox}
      />
    </>
  );
}
