import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAvatar } from '@/components/ui';
import { useApi, useMe, type Appointment } from '@/lib/api';

const C = {
  page: '#EDF6FE',
  card: '#F4FAFE',
  navy: '#0B2E4E',
  blue: '#1B93D4',
  link: '#1B93D4',
  sub: '#5D7C93',
  border: '#DCEBF8',
  accent: '#22B0D0',
};

const SHADOW = {
  shadowColor: '#075A92',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
} as const;

const CARD_SHADOW = {
  shadowColor: '#075A92',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.14,
  shadowRadius: 16,
} as const;

const ACTIONS = [
  { label: 'Book Appointment', href: '/booking/date' as const, img: require('@/assets/images/qa-book.png') },
  { label: 'Message Clinic', img: require('@/assets/images/qa-message.png') },
  { label: 'Video Consult', img: require('@/assets/images/qa-video.png') },
  { label: 'AI Assistant', href: '/assistant' as const, img: require('@/assets/images/qa-ai.png') },
];

function Row({ icon, text }: { icon: SymbolViewProps['name']; text: string }) {
  return (
    <View className="h-[45.5px] flex-row items-center">
      <SymbolView name={icon} size={23} tintColor={C.blue} style={{ width: 26 }} />
      <Text className="ml-[14px] text-[17px]" style={{ color: C.navy }}>
        {text}
      </Text>
    </View>
  );
}

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning,' : h < 18 ? 'Good afternoon,' : 'Good evening,';
};

export default function Home() {
  const { me } = useMe();
  const avatar = useAvatar();
  // Across the whole family, soonest first — the API already ordered it.
  const { data, loading } = useApi<{ appointments: Appointment[] }>(
    me?.hasOnboarded ? '/api/appointments?scope=upcoming' : null
  );

  const next = data?.appointments[0];

  return (
    <View collapsable={false} style={{ flex: 1, backgroundColor: C.page }}>
      <StatusBar style="dark" />
      <Image
        source={require('@/assets/images/onboarding-bg.png')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <ScrollView
        contentContainerStyle={{ paddingTop: 88, paddingHorizontal: 24, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* header */}
        <View className="flex-row items-center">
          <View className="flex-1">
            <Text className="text-[17px]" style={{ color: C.navy }}>
              {greeting()}
            </Text>
            <Text className="mt-[2px] text-[30px] font-bold" style={{ color: C.navy }}>
              {me?.self?.firstName ?? 'there'} 👋
            </Text>
          </View>
          <SymbolView name="bell" size={27} tintColor={C.navy} style={{ marginRight: 22 }} />
          <Image
            source={avatar}
            style={{ width: 64, height: 64, borderRadius: 32 }}
            contentFit="cover"
          />
        </View>

        {/* next appointment */}
        <View
          className="mt-[34px] rounded-[28px] px-[22px] pb-[10px] pt-[28px]"
          style={[{ backgroundColor: C.card, borderWidth: 1, borderColor: C.border }, SHADOW]}
        >
          <Image
            source={require('@/assets/images/appt-tooth.png')}
            style={{ position: 'absolute', right: 8, top: 0, bottom: 0, width: 150 }}
            contentFit="contain"
          />
          <Text className="text-[18px] font-semibold" style={{ color: C.blue }}>
            Next Appointment
          </Text>

          {loading ? (
            <ActivityIndicator style={{ marginVertical: 52 }} color={C.accent} />
          ) : next ? (
            <>
              <View className="mt-[19px]">
                <Row icon="calendar" text={next.dateLabel} />
                <Row icon="clock" text={next.timeLabel} />
                <Row icon="person" text={next.dentist?.displayName ?? 'The clinic'} />
                <Row icon="mouth" text={next.service?.name ?? 'Appointment'} />
              </View>
              <Pressable
                onPress={() => router.push(`/appointment/${next.id}`)}
                className="ml-auto mt-[4px] h-[38px] items-center justify-center rounded-[19px] px-[26px]"
                style={{ borderWidth: 1.5, borderColor: '#7FD3EE', backgroundColor: '#F2FBFE' }}
              >
                <Text className="text-[17px]" style={{ color: C.blue }}>
                  View Details
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text className="mt-[16px] text-[17px] font-semibold" style={{ color: C.sub, lineHeight: 24 }}>
                {'Nothing booked yet.\nPick a time that suits you.'}
              </Text>
              <Pressable
                onPress={() => router.push('/booking/date')}
                className="ml-auto mt-[18px] h-[38px] items-center justify-center rounded-[19px] px-[26px]"
                style={{ borderWidth: 1.5, borderColor: '#7FD3EE', backgroundColor: '#F2FBFE' }}
              >
                <Text className="text-[17px] font-semibold" style={{ color: C.blue }}>
                  Book now
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {/* quick actions */}
        <Text className="mt-[9px] text-[19px] font-bold" style={{ color: C.navy }}>
          Quick Actions
        </Text>
        <View className="mt-[14px] flex-row flex-wrap" style={{ gap: 12 }}>
          {ACTIONS.map((a) => (
            <Pressable
              key={a.label}
              onPress={() => ('href' in a && a.href ? router.push(a.href) : undefined)}
              className="items-center rounded-[24px] px-[12px] pb-[18px] pt-[20px]"
              style={[
                { width: '48%', backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
                CARD_SHADOW,
              ]}
            >
              <View
                className="h-[62px] w-[62px] items-center justify-center rounded-[20px]"
                style={{ backgroundColor: '#E8F3FC' }}
              >
                <Image source={a.img} style={{ width: 50, height: 50 }} contentFit="contain" />
              </View>
              <Text
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                className="mt-[12px] text-center text-[15px] font-semibold"
                style={{ color: C.navy, lineHeight: 19 }}
              >
                {a.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
