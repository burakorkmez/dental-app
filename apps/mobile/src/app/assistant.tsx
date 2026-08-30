import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Button, SHADOW_GLASS, UI } from '@/components/ui';

/**
 * AI Dental Assistant — design/ai-assistant-design-1.png (empty) and -2.png (chat).
 *
 * Education and triage only: the replies below are canned copy that ships with
 * the app. No patient record and no message ever leaves the device from here —
 * see the non-negotiables in CLAUDE.md.
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

type Msg = {
  from: 'me' | 'ai';
  time: string;
  text?: string;
  paras?: string[];
  bullets?: string[];
  link?: string;
};

type Reply = Omit<Msg, 'from' | 'time'>;

const REPLIES: Record<string, Reply> = {
  'Tooth sensitivity': {
    paras: [
      'Tooth sensitivity with cold drinks is quite common and can happen for a few reasons:',
      'You can try using a desensitizing toothpaste and avoid very cold foods or drinks for a while.',
    ],
    bullets: [
      'Enamel wear from brushing too hard or acidic foods',
      'Gum recession that exposes the root surface',
      'Recent teeth whitening treatments',
    ],
    link: 'If it keeps happening, book a check-up.',
  },
};

const GENERIC: Reply = {
  paras: [
    'Thanks for asking. General guidance only: brush twice a day for two minutes, clean between your teeth daily, and keep sugary drinks to mealtimes.',
    'I can point you at the basics, but I cannot examine you or make a diagnosis.',
  ],
  link: 'If something hurts or looks unusual, book a check-up.',
};

const now = () =>
  new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

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

function IconButton({ sf, onPress }: { sf: SymbolViewProps['name']; onPress?: () => void }) {
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
        <Text className="text-[13px]" style={{ color: A.body, lineHeight: 19 }}>
          {m.text}
        </Text>
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

function AiBubble({ m }: { m: Msg }) {
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
        {m.paras?.slice(0, 1).map((p) => (
          <Text key={p} className="text-[13px]" style={{ color: A.body, lineHeight: 19 }}>
            {p}
          </Text>
        ))}
        {m.bullets ? (
          <View className="mt-[10px]">
            {m.bullets.map((b) => (
              <View key={b} className="mb-[4px] flex-row pl-[6px]">
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: A.bullet,
                    marginTop: 7,
                    marginRight: 11,
                  }}
                />
                <Text
                  className="flex-1 text-[13px]"
                  style={{ color: A.body, lineHeight: 19 }}
                >
                  {b}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        {m.paras?.slice(1).map((p) => (
          <Text
            key={p}
            className="mt-[10px] text-[13px]"
            style={{ color: A.body, lineHeight: 19 }}
          >
            {p}
          </Text>
        ))}
        {m.link ? (
          <Text className="mt-[8px] text-[13px]" style={{ color: A.blue, lineHeight: 19 }}>
            {m.link}
          </Text>
        ) : null}
        <Text className="mt-[10px] text-[12.5px]" style={{ color: A.time }}>
          {m.time}
        </Text>
      </Card>
    </View>
  );
}

export default function Assistant() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const scroll = useRef<ScrollView>(null);
  const chatting = msgs.length > 0;

  const send = (q: string) => {
    const t = q.trim();
    if (!t) return;
    setText('');
    setMsgs((m) => [
      ...m,
      { from: 'me', text: t, time: now() },
      { from: 'ai', time: now(), ...(REPLIES[t] ?? GENERIC) },
    ]);
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
          <IconButton sf="ellipsis" />
        </View>

        <ScrollView
          ref={scroll}
          contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 22, paddingBottom: chatting ? 12 : 0 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => chatting && scroll.current?.scrollToEnd({ animated: true })}
        >
          <Disclaimer />

          {chatting ? (
            <View className="mt-[24px]">
              {msgs.map((m, i) =>
                m.from === 'me' ? <MeBubble key={i} m={m} /> : <AiBubble key={i} m={m} />,
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
              placeholder="Ask anything about your dental health..."
              placeholderTextColor={A.muted}
              value={text}
              onChangeText={setText}
              onSubmitEditing={() => send(text)}
              returnKeyType="send"
              multiline={!chatting}
              style={{
                fontSize: chatting ? 16 : 18,
                color: A.body,
                lineHeight: 26,
                paddingVertical: 12,
                marginRight: 8,
              }}
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
