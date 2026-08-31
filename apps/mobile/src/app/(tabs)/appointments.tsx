import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AQUA_BODY, Button, serviceArt, STATUS_LABEL } from '@/components/ui';
import { useApi, type Appointment } from '@/lib/api';
import { dateParts } from '@/lib/date-label';

const C = {
  navy: '#0B2E4E',
  sub: '#55719A',
  body: '#4E6B8C',
  teal: '#1D8290',
  card: '#F6FBFE',
  border: '#E3EFFA',
  dateBox: '#E3F1FE',
  iconBg: '#D8ECFA',
  track: '#F4FAFE',
  booked: '#DEF6F2',
  bookedInk: '#16867C',
  video: '#E2EFFC',
  videoInk: '#2C82D6',
  off: '#F6E9EA',
  offInk: '#B4565A',
  chevron: '#3E5C7D',
};

const CARD_SHADOW = {
  shadowColor: '#075A92',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.09,
  shadowRadius: 16,
} as const;

/** The video slot is a tinted tile rather than a 3D render, as in the mockup. */
function VideoTile() {
  return (
    <LinearGradient
      colors={AQUA_BODY}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ height: 44, width: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
    >
      <SymbolView name="video.fill" size={22} tintColor="#FFFFFF" />
    </LinearGradient>
  );
}

function Meta({ icon, text }: { icon: SymbolViewProps['name']; text: string }) {
  return (
    <View className="flex-row items-center">
      <SymbolView name={icon} size={15} weight="medium" tintColor={C.body} style={{ width: 17 }} />
      <Text numberOfLines={1} className="ml-[7px] text-[10.5px]" style={{ color: C.body }}>
        {text}
      </Text>
    </View>
  );
}

function Badge({ a }: { a: Appointment }) {
  if (a.isTeleconsult && a.status === 'booked') {
    return (
      <View
        className="h-[22px] flex-row items-center rounded-[11px] px-[9px]"
        style={{ backgroundColor: C.video }}
      >
        <SymbolView name="video.fill" size={13} tintColor={C.videoInk} style={{ marginRight: 5 }} />
        <Text className="text-[10px] font-medium" style={{ color: C.videoInk }}>
          Video
        </Text>
      </View>
    );
  }
  const off = a.status === 'cancelled' || a.status === 'no_show';
  return (
    <View
      className="h-[22px] items-center justify-center rounded-[11px] px-[9px]"
      style={{ backgroundColor: off ? C.off : C.booked }}
    >
      <Text className="text-[10px] font-medium" style={{ color: off ? C.offInk : C.bookedInk }}>
        {STATUS_LABEL[a.status]}
      </Text>
    </View>
  );
}

function Card({
  children,
  height,
  onPress,
}: {
  children: ReactNode;
  height: number;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center rounded-[24px] px-[13px]"
      style={[
        { height, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
        CARD_SHADOW,
      ]}
    >
      {children}
      <View className="absolute bottom-0 right-[14px] top-0 justify-center">
        <SymbolView name="chevron.right" size={19} weight="medium" tintColor={C.chevron} />
      </View>
    </Pressable>
  );
}

export default function Appointments() {
  const [scope, setScope] = useState<'upcoming' | 'past'>('upcoming');
  const { data, loading, error } = useApi<{ appointments: Appointment[] }>(
    `/api/appointments?scope=${scope}`
  );
  const appointments = data?.appointments ?? [];

  return (
    <View collapsable={false} style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#F2F9FD', '#E4F0FC']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={{ paddingTop: 70, paddingHorizontal: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable className="ml-[10px] h-[30px] w-[30px] justify-center">
          <SymbolView name="arrow.left" size={23} weight="medium" tintColor={C.navy} />
        </Pressable>

        <View className="mt-[14px] flex-row items-start px-[10px]">
          <View className="flex-1">
            <Text className="text-[26px] font-bold" style={{ color: C.navy }}>
              Appointments
            </Text>
            <Text className="mt-[10px] text-[12.5px]" style={{ color: C.sub }}>
              View and manage your appointments
            </Text>
          </View>
          <Button
            label=""
            variant="glass"
            height={50}
            radius={25}
            paddingX={0}
            leading={<SymbolView name="bell" size={23} weight="medium" tintColor={C.navy} />}
            style={{ width: 50, marginTop: 2 }}
          />
        </View>

        {/* upcoming / past */}
        <View
          className="mt-[24px] h-[44px] flex-row rounded-[22px] p-[3px]"
          style={{ backgroundColor: C.track, borderWidth: 1, borderColor: C.border }}
        >
          {(['upcoming', 'past'] as const).map((s) =>
            s === scope ? (
              <Button
                key={s}
                label={s === 'upcoming' ? 'Upcoming' : 'Past'}
                height={38}
                radius={19}
                textSize={13}
                grow
              />
            ) : (
              <Pressable
                key={s}
                onPress={() => setScope(s)}
                className="flex-1 items-center justify-center"
              >
                <Text className="text-[13px] font-medium" style={{ color: C.navy }}>
                  {s === 'upcoming' ? 'Upcoming' : 'Past'}
                </Text>
              </Pressable>
            )
          )}
        </View>

        <Text className="ml-[10px] mt-[22px] text-[12.5px] font-bold" style={{ color: C.navy }}>
          {scope === 'upcoming' ? 'Upcoming Appointments' : 'Past Visits'}
        </Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 44 }} color={C.teal} />
        ) : error ? (
          <Text className="mt-[40px] text-center text-[13px]" style={{ color: C.offInk }}>
            {error}
          </Text>
        ) : appointments.length === 0 ? (
          <Text className="mt-[40px] text-center text-[13px]" style={{ color: C.sub }}>
            {scope === 'upcoming'
              ? 'You have no upcoming appointments.'
              : 'No past visits yet.'}
          </Text>
        ) : (
          <View className="mt-[11px]" style={{ gap: 11 }}>
            {appointments.map((a) => {
              const d = dateParts(a.dateLabel);
              return (
                <Card key={a.id} height={106} onPress={() => router.push(`/appointment/${a.id}`)}>
                  <View
                    className="h-[80px] w-[57px] items-center justify-center rounded-[14px]"
                    style={{ backgroundColor: C.dateBox }}
                  >
                    <Text className="text-[10.5px] font-semibold" style={{ color: C.teal }}>
                      {d.mon}
                    </Text>
                    <Text className="my-[3px] text-[25.5px] font-bold" style={{ color: C.navy }}>
                      {d.day}
                    </Text>
                    <Text className="text-[10.5px] font-medium" style={{ color: C.sub }}>
                      {d.dow}
                    </Text>
                  </View>

                  <View
                    className="ml-[11px] h-[64px] w-[64px] items-center justify-center rounded-full"
                    style={{ backgroundColor: C.iconBg }}
                  >
                    {a.isTeleconsult ? (
                      <VideoTile />
                    ) : (
                      <Image
                        source={serviceArt(a.service?.key)}
                        style={{ width: 56, height: 56 }}
                        contentFit="contain"
                      />
                    )}
                  </View>

                  <View className="ml-[13px] mr-[10px] flex-1">
                    <View className="flex-row items-center">
                      <Text
                        numberOfLines={1}
                        className="flex-1 text-[13.5px] font-bold"
                        style={{ color: C.navy }}
                      >
                        {a.service?.name ?? 'Appointment'}
                      </Text>
                      <Badge a={a} />
                    </View>
                    <View className="mt-[8px]">
                      <Meta icon="person" text={a.dentist?.displayName ?? 'The clinic'} />
                    </View>
                    <View className="mt-[20px] flex-row items-center">
                      <Meta icon="clock" text={a.timeLabel} />
                      <View className="ml-[14px] flex-1">
                        <Meta
                          icon={a.isTeleconsult ? 'video' : 'mappin'}
                          text={a.isTeleconsult ? 'Video call' : 'DentaCare Clinic'}
                        />
                      </View>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        <View className="mt-[27px]">
          <Card height={93}>
            <View
              className="h-[56px] w-[56px] items-center justify-center rounded-[16px]"
              style={{ backgroundColor: C.dateBox }}
            >
              <SymbolView name="calendar.badge.plus" size={30} weight="medium" tintColor={C.teal} />
            </View>
            <View className="ml-[13px] mr-[26px] flex-1">
              <Text className="text-[14px] font-bold" style={{ color: C.navy }}>
                Add to Calendar
              </Text>
              <Text className="mt-[5px] text-[12px]" style={{ color: C.sub, lineHeight: 17 }}>
                {'Sync your appointments with\nyour favorite calendar app'}
              </Text>
            </View>
          </Card>
        </View>

        <View className="mt-[19px]">
          <Button
            label="Book New Appointment"
            arrow="plus"
            height={58}
            textSize={17.5}
            onPress={() => router.push('/booking/date')}
          />
        </View>
      </ScrollView>
    </View>
  );
}
