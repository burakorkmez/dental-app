import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Button, SHADOW_GLASS, UI } from '@/components/ui';
import { useApiClient, useApiStream } from '@/lib/api';
import { pickPhotos, UPLOAD_TIMEOUT_MS } from '@/lib/photo';

/**
 * AI Dental Assistant — design/ai-assistant-design-1.png (empty) and -2.png (chat).
 *
 * Education and triage only. Replies come from `POST /api/ai/chat`, which owns
 * the whole policy: the emergency card is matched server-side BEFORE any model
 * call, no patient record is ever attached, and the outbound call is gated on
 * an explicit deployment approval. This screen renders what it is handed.
 *
 * A photo goes to `POST /api/ai/attachments`, which stores it in ImageKit's
 * private folder and answers with two signed URLs of the same file: a blurred
 * render for the thread and the full one a tap swaps in. The blur is a
 * transformation on delivery, not a second upload, and it is not applied here —
 * nothing on the phone ever holds an unblurred copy it was not asked for.
 */

// screen-local surfaces only; every button comes from '@/components/ui'
const A = {
  title: '#0A2540',
  body: '#17324A',
  blue: '#1B8FD4',
  muted: '#9BB0C4',
  time: '#8CA4B8',
  card: 'rgba(255,255,255,0.54)',
  rim: 'rgba(255,255,255,0.92)',
  mine: 'rgba(190,229,246,0.80)',
  mineRim: 'rgba(255,255,255,0.80)',
  bullet: '#5CC0EA',
  veil: 'rgba(10,37,64,0.58)',
};

const SUGGESTIONS = [
  { label: 'Tooth sensitivity', img: require('@/assets/images/ic-tooth-fill.png') },
  { label: 'How to brush correctly', img: require('@/assets/images/ic-brush.png') },
  { label: 'Teeth whitening', sf: 'sparkles' as const },
  { label: 'Gum health', img: require('@/assets/images/ic-gum.png') },
];

const CHIPS: { label: string; sf?: SymbolViewProps['name']; img?: number }[] = [
  { label: 'Book a check-up', sf: 'calendar' },
  { label: 'Teeth whitening', sf: 'sparkles' },
  { label: 'Gum health', img: require('@/assets/images/ic-tooth-fill.png') },
];

/** The same stored file, rendered two ways by ImageKit. Both URLs expire. */
type Photo = { blurred: string; full: string };

type Msg = {
  from: 'me' | 'ai';
  time: string;
  /** Blank-line-separated paragraphs — the prompt asks for two at most. */
  paras: string[];
  /** Set instead of `paras` on an attachment: a photo goes on its own turn. */
  photo?: Photo;
};

/**
 * Module-level so backing out of the screen and returning keeps the thread
 * without a refetch. Across app restarts the server is the source of truth:
 * `GET /api/ai/chat` hands back the newest conversation and its messages.
 */
let conversationId: string | null = null;

type StoredMsg = {
  role: 'user' | 'assistant';
  content: string;
  image: Photo | null;
  createdAt: string;
};

const now = (d = new Date()) =>
  d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

/** Paragraphs are stored as the model wrote them — blank-line separated. */
const toMsg = (m: StoredMsg): Msg => ({
  from: m.role === 'user' ? 'me' : 'ai',
  time: now(new Date(m.createdAt)),
  paras: m.content.split(/\n{2,}/).filter(Boolean),
  photo: m.image ?? undefined,
});

function Card({
  children,
  radius = 26,
  style,
}: {
  children: React.ReactNode;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: A.card,
          borderRadius: radius,
          borderCurve: 'continuous',
          borderWidth: 1,
          borderColor: A.rim,
        },
        SHADOW_GLASS,
        style,
      ]}
    >
      {children}
    </View>
  );
}

function IconButton({
  sf,
  onPress,
  disabled,
}: {
  sf: SymbolViewProps['name'];
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      label=""
      variant="glass"
      height={42}
      radius={14}
      paddingX={0}
      leading={<SymbolView name={sf} size={22} tintColor={A.title} />}
      style={{ width: 42 }}
      onPress={onPress}
      disabled={disabled}
    />
  );
}

function Disclaimer() {
  return (
    <Card
      radius={22}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14 }}
    >
      <Image
        source={require('@/assets/images/ai-shield.png')}
        style={{ width: 44, height: 44 }}
        contentFit="contain"
      />
      <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: A.rim, marginLeft: 12 }} />
      <View className="ml-[12px] flex-1">
        <Text className="text-[14.5px]" style={{ color: A.body, lineHeight: 18 }}>
          Dentify AI Assistant provides general dental education and guidance.
        </Text>
        <Text className="mt-[5px] text-[14.5px]" style={{ color: A.blue, lineHeight: 18 }}>
          It is not a diagnosis or a substitute for professional dental advice.
        </Text>
      </View>
    </Card>
  );
}

/**
 * The blur lives in the URL, so revealing is a source swap with nothing to
 * fetch first — both renders were handed over together. It is a screen against
 * a shoulder or a scroll-past, not an access control: what actually keeps the
 * photo private is the folder it sits in and the signature on the URL.
 */
function PhotoAttachment({ photo }: { photo: Photo }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <Pressable
      onPress={() => setRevealed((r) => !r)}
      accessibilityRole="button"
      accessibilityLabel={revealed ? 'Hide photo' : 'Reveal photo'}
      style={{ borderRadius: 18, borderCurve: 'continuous', overflow: 'hidden' }}
    >
      <Image
        source={{ uri: revealed ? photo.full : photo.blurred }}
        style={{ width: 221, height: 221, backgroundColor: '#CFE4F2' }}
        contentFit="cover"
        transition={160}
      />
      {revealed ? null : (
        <View
          className="absolute inset-0 items-center justify-center"
          style={{ pointerEvents: 'none' }}
        >
          <View
            className="flex-row items-center rounded-[16px] px-[13px] py-[8px]"
            style={{ backgroundColor: A.veil }}
          >
            <SymbolView name="eye" size={15} tintColor="#FFFFFF" />
            <Text className="ml-[7px] text-[13px] font-semibold" style={{ color: '#FFFFFF' }}>
              Tap to view
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

function MeBubble({ m }: { m: Msg }) {
  return (
    <View className="mb-[20px] flex-row justify-end">
      <View
        style={[
          {
            maxWidth: 253,
            backgroundColor: A.mine,
            borderRadius: 24,
            borderBottomRightRadius: 6,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: A.mineRim,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 8,
          },
          SHADOW_GLASS,
        ]}
      >
        {m.photo ? (
          <PhotoAttachment photo={m.photo} />
        ) : (
          <Text className="text-[13px]" style={{ color: A.body, lineHeight: 19 }}>
            {m.paras.join('\n\n')}
          </Text>
        )}
        <View className="mt-[6px] flex-row items-center justify-end">
          <Text className="mr-[7px] text-[12.5px]" style={{ color: '#5E93B5' }}>
            {m.time}
          </Text>
          <SymbolView name="checkmark" size={11} tintColor="#2E9BD8" />
          <SymbolView
            name="checkmark"
            size={11}
            tintColor="#2E9BD8"
            style={{ marginLeft: -5 }}
          />
        </View>
      </View>
    </View>
  );
}

function AiBubble({ m, streaming }: { m: Msg; streaming?: boolean }) {
  return (
    <View className="mb-[20px] flex-row items-start">
      <View
        style={[
          {
            width: 40,
            height: 40,
            borderRadius: 20,
            overflow: 'hidden',
            marginRight: 15,
            flexShrink: 0,
            backgroundColor: '#FFFFFF',
          },
          SHADOW_GLASS,
        ]}
      >
        <Image
          source={require('@/assets/images/ai-bot.png')}
          style={{ width: 40, height: 40 }}
          contentFit="cover"
        />
      </View>
      <Card
        radius={20}
        style={{ flexShrink: 1, maxWidth: 257, paddingHorizontal: 15, paddingVertical: 14 }}
      >
        {(m.paras.length ? m.paras : ['']).map((p, i, all) => (
          <Text
            key={i}
            className="text-[13px]"
            style={{ color: A.body, lineHeight: 19, marginTop: i === 0 ? 0 : 10 }}
          >
            {p}
            {/* Caret sits on the last line, so the answer grows in front of it. */}
            {streaming && i === all.length - 1 ? (
              <Text style={{ color: A.blue }}>▍</Text>
            ) : null}
          </Text>
        ))}
        {/* A timestamp on a half-written answer is a lie — it lands when it lands. */}
        {streaming ? null : (
          <Text className="mt-[10px] text-[12.5px]" style={{ color: A.time }}>
            {m.time}
          </Text>
        )}
      </Card>
    </View>
  );
}

export default function Assistant() {
  const stream = useApiStream();
  const call = useApiClient();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [pending, setPending] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const chatting = msgs.length > 0;

  // Load once per mount, not on every focus: a refetch mid-stream would fight
  // the bubble being written. A failure just leaves the empty state up.
  useEffect(() => {
    call<{ conversationId: string | null; messages: StoredMsg[] }>('/api/ai/chat')
      .then((h) => {
        conversationId = h.conversationId;
        setMsgs(h.messages.map(toMsg));
      })
      .catch(() => {});
  }, [call]);

  /** Server first — clearing the screen on a failed delete would be a lie. */
  const clearHistory = () =>
    pending
      ? undefined
      : call('/api/ai/chat', { method: 'DELETE' })
          .then(() => {
            conversationId = null;
            setMsgs([]);
          })
          .catch((err) =>
            Alert.alert('Could not delete', err instanceof Error ? err.message : 'Try again.')
          );

  const confirmClear = () =>
    Alert.alert(
      'Delete chat history?',
      'This permanently deletes your conversation with the assistant.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: clearHistory },
      ]
    );

  /** Rewrites the trailing AI bubble — the one this turn is filling in. */
  const setReply = (content: string) =>
    setMsgs((m) => [
      ...m.slice(0, -1),
      { ...m[m.length - 1], paras: content.split(/\n{2,}/).filter(Boolean) },
    ]);

  /**
   * The reply is whatever the API returns — including its 503s, which carry
   * copy worth showing ("the assistant is unavailable in this environment").
   * An alert would hide that behind a dialog the patient has to dismiss.
   *
   * The empty AI bubble goes up with the question so the answer has somewhere
   * to stream into; until the first token lands it shows a spinner.
   */
  const send = async (q: string) => {
    const t = q.trim();
    if (!t || pending) return;
    setText('');
    setMsgs((m) => [
      ...m,
      { from: 'me', paras: [t], time: now() },
      { from: 'ai', paras: [], time: now() },
    ]);
    setPending(true);
    try {
      conversationId = await stream(
        '/api/ai/chat',
        { conversationId: conversationId ?? undefined, message: t },
        setReply
      );
    } catch (err) {
      setReply(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setPending(false);
    }
  };

  /**
   * A photo is a complete turn: the API stores it and answers with its own
   * canned reply, because the assistant is not allowed to interpret an image
   * and the image is never sent to the model. So nothing streams here — one
   * request, both bubbles.
   */
  const attach = async () => {
    if (pending) return;

    setPending(true);
    try {
      const [photo] = await pickPhotos();
      if (!photo) return;

      const form = new FormData();
      if (conversationId) form.append('conversationId', conversationId);
      form.append('photo', photo.file);

      const sent = await call<{ conversationId: string; image: Photo; reply: string }>(
        '/api/ai/attachments',
        { method: 'POST', body: form, timeoutMs: UPLOAD_TIMEOUT_MS }
      );

      conversationId = sent.conversationId;
      setMsgs((m) => [
        ...m,
        { from: 'me', paras: [], time: now(), photo: sent.image },
        { from: 'ai', paras: sent.reply.split(/\n{2,}/).filter(Boolean), time: now() },
      ]);
    } catch (err) {
      // Nothing was added to the thread, so unlike `send` there is no bubble to
      // write the failure into — a dialog is the only place left for it.
      Alert.alert('Could not send the photo', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setPending(false);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: '#E7F2FD' }}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#EFF6FD', '#E0EEFE']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* header */}
        <View className="flex-row items-center px-[28px] pt-[70px]">
          <IconButton sf="arrow.left" onPress={() => router.back()} />
          <View className="flex-1 flex-row items-center justify-center">
            <SymbolView name="sparkle" size={26} tintColor="#3FBDEA" />
            <Text className="ml-[10px] text-[22px] font-bold" style={{ color: A.title }}>
              AI Dental Assistant
            </Text>
          </View>
          {/* Nothing to delete on the empty state — the spacer keeps the title centred. */}
          {chatting ? (
            <IconButton sf="trash" onPress={confirmClear} disabled={pending} />
          ) : (
            <View style={{ width: 42 }} />
          )}
        </View>

        <ScrollView
          ref={scroll}
          contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 22, paddingBottom: chatting ? 12 : 0 }}
          showsVerticalScrollIndicator={false}
          // Not animated while a reply streams: one animation per token stutters.
          onContentSizeChange={() => chatting && scroll.current?.scrollToEnd({ animated: !pending })}
        >
          <Disclaimer />

          {chatting ? (
            <View className="mt-[24px]">
              {msgs.map((m, i) =>
                m.from === 'me' ? (
                  <MeBubble key={i} m={m} />
                ) : (
                  <AiBubble key={i} m={m} streaming={pending && i === msgs.length - 1} />
                ),
              )}
            </View>
          ) : (
            <>
              <Image
                source={require('@/assets/images/ai-hero.png')}
                style={{ width: '100%', height: 231 }}
                contentFit="contain"
              />
              <View className="px-[12px]">
                {SUGGESTIONS.map((s, i) => (
                  <Button
                    key={s.label}
                    label={s.label}
                    variant="glass"
                    align="start"
                    height={58}
                    radius={29}
                    paddingX={16}
                    textSize={17.5}
                    textColor={A.title}
                    textWeight="600"
                    leading={
                      <View
                        className="mr-[20px] items-center justify-center rounded-full bg-white"
                        style={{ width: 43, height: 43 }}
                      >
                        {'img' in s ? (
                          <Image
                            source={s.img}
                            style={{ width: 27, height: 27 }}
                            contentFit="contain"
                          />
                        ) : (
                          <SymbolView name={s.sf} size={24} tintColor="#3FBDEA" />
                        )}
                      </View>
                    }
                    style={{ marginBottom: i === SUGGESTIONS.length - 1 ? 0 : 6 }}
                    onPress={() => send(s.label)}
                  />
                ))}
              </View>
            </>
          )}
        </ScrollView>

        {/* quick chips — chat state only */}
        {chatting ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 28, gap: 6, paddingVertical: 4 }}
          >
            {CHIPS.map((c) => (
              <Button
                key={c.label}
                label={c.label}
                variant="glass"
                height={40}
                radius={20}
                paddingX={9}
                textSize={12.5}
                textColor={A.blue}
                textWeight="500"
                leading={
                  c.img ? (
                    <Image
                      source={c.img}
                      style={{ width: 16, height: 16, marginRight: 5 }}
                      contentFit="contain"
                    />
                  ) : (
                    <SymbolView
                      name={c.sf!}
                      size={16}
                      tintColor={A.blue}
                      style={{ marginRight: 5 }}
                    />
                  )
                }
                onPress={() => send(c.label)}
              />
            ))}
          </ScrollView>
        ) : null}

        {/* composer */}
        <View className="px-[28px] pt-[12px]">
          <Card
            radius={30}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingLeft: chatting ? 18 : 24,
              paddingRight: chatting ? 8 : 14,
              minHeight: chatting ? 72 : 88,
            }}
          >
            <TextInput
              className="flex-1"
              // Short enough to fit one line at both sizes, down to a 375pt
              // screen: the placeholder has no room to wrap or ellipsize — a
              // multiline input is only as tall as its value, which is empty.
              // It lost a word when the attach button took 50pt off the row.
              placeholder="Ask a question"
              placeholderTextColor={A.muted}
              value={text}
              onChangeText={setText}
              onSubmitEditing={() => send(text)}
              editable={!pending}
              returnKeyType="send"
              multiline={!chatting}
              style={{
                fontSize: chatting ? 16 : 18,
                color: A.body,
                paddingVertical: 0,
                marginRight: 8,
              }}
            />
            <Button
              label=""
              variant="glass"
              height={chatting ? 44 : 48}
              radius={chatting ? 22 : 24}
              paddingX={0}
              leading={<SymbolView name="photo" size={chatting ? 20 : 22} tintColor={A.blue} />}
              disabled={pending}
              style={{ width: chatting ? 44 : 48, marginRight: 6 }}
              onPress={attach}
            />
            <Button
              label=""
              height={chatting ? 46 : 52}
              radius={chatting ? 23 : 26}
              paddingX={0}
              leading={
                <SymbolView
                  name={chatting ? 'paperplane.fill' : 'plus'}
                  size={chatting ? 23 : 27}
                  tintColor="#FFFFFF"
                />
              }
              disabled={pending}
              style={{ width: chatting ? 46 : 52 }}
              onPress={() => send(text)}
            />
          </Card>
        </View>

        {/* educational-use note — empty state only */}
        {chatting ? (
          <View style={{ height: 34 }} />
        ) : (
          <View className="px-[28px] pb-[39px] pt-[19px]">
            <Card radius={22} style={{ flexDirection: 'row', paddingVertical: 13, paddingHorizontal: 18 }}>
              <SymbolView
                name="checkmark.shield"
                size={28}
                tintColor={A.blue}
                style={{ marginTop: 2 }}
              />
              <Text
                className="ml-[20px] flex-1 text-[12.5px]"
                style={{ color: A.body, lineHeight: 17 }}
              >
                For educational purposes only, not medical advice. If you have concerns or pain,
                please consult a dentist or book an appointment on{' '}
                <Text style={{ color: UI.aquaInk, fontWeight: '600' }}>Dentify</Text>.
              </Text>
            </Card>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
