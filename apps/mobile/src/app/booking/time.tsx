import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { B, booking, formatDate, fromISODay, Header, SHADOW } from '@/components/booking';
import { Button, PrimaryButton, UI } from '@/components/ui';
import { useApi, type Dentist, type Slot } from '@/lib/api';

export default function BookingTime() {
  const service = booking.service;
  const [picked, setPicked] = useState<Slot | null>(booking.slot);

  // This screen stays mounted behind confirm, so a slot the server rejected has
  // to be dropped from local state too — not just from `booking`.
  useFocusEffect(useCallback(() => setPicked(booking.slot), []));

  const { data, loading, error } = useApi<{ slots: Slot[] }>(
    service ? `/api/availability?serviceId=${service.id}&from=${booking.day}` : null
  );
  const { data: dentistData } = useApi<{ dentists: Dentist[] }>(
    service ? `/api/dentists?serviceId=${service.id}` : null
  );

  /**
   * Availability comes back aggregated across every dentist who offers the
   * service, so the same wall-clock time can appear more than once. The patient
   * picks a time; the first dentist free at it is the one they get.
   */
  const slots = useMemo(() => {
    const byLabel = new Map<string, Slot>();
    for (const s of data?.slots ?? []) if (!byLabel.has(s.label)) byLabel.set(s.label, s);
    return [...byLabel.values()];
  }, [data]);

  const dentists = dentistData?.dentists ?? [];
  const dentist = dentists.find((d) => d.id === picked?.dentistId) ?? dentists[0] ?? null;

  return (
    <View className="flex-1" style={{ backgroundColor: B.page }}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ paddingTop: 72, paddingHorizontal: 22, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <Header title="Select Time" />

        {/* dentist */}
        <View
          className="mt-[28px] flex-row items-center rounded-[22px] px-[16px] py-[16px]"
          style={[{ backgroundColor: B.card, borderWidth: 1, borderColor: B.border }, SHADOW]}
        >
          <Image
            source={
              dentist?.photoUrl
                ? { uri: dentist.photoUrl }
                : require('@/assets/images/av-doctor.png')
            }
            style={{ width: 76, height: 76, borderRadius: 38 }}
            contentFit="cover"
          />
          <View className="ml-[16px] flex-1">
            <Text className="text-[20px] font-semibold" style={{ color: B.title }}>
              {dentist?.displayName ?? 'Our team'}
            </Text>
            <Text className="mt-[3px] text-[16px]" style={{ color: B.sub }}>
              {dentist?.specialty ?? service?.name ?? ''}
            </Text>
            {dentist?.title ? (
              <Text className="mt-[4px] text-[15px]" style={{ color: B.navy }}>
                {dentist.title}
              </Text>
            ) : null}
          </View>
          <View
            className="h-[44px] w-[44px] items-center justify-center rounded-[14px]"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            <SymbolView name="info.circle" size={24} tintColor={B.link} />
          </View>
        </View>

        {/* date */}
        <View
          className="mt-[18px] h-[62px] flex-row items-center rounded-[20px] px-[18px]"
          style={[{ backgroundColor: B.card, borderWidth: 1, borderColor: B.border }, SHADOW]}
        >
          <SymbolView name="calendar" size={26} tintColor={B.link} />
          <Text className="ml-[14px] flex-1 text-[18px]" style={{ color: B.navy }}>
            {formatDate(fromISODay(booking.day))}
          </Text>
        </View>

        {/* legend */}
        <View className="mt-[20px] flex-row items-center">
          <View className="h-[10px] w-[10px] rounded-full" style={{ backgroundColor: UI.aquaInk }} />
          <Text className="ml-[8px] text-[15px]" style={{ color: B.navy }}>
            Available
          </Text>
          {service ? (
            <Text className="ml-auto text-[15px]" style={{ color: B.sub }}>
              {service.durationMinutes} min
            </Text>
          ) : null}
        </View>

        {/* slots */}
        {loading ? (
          <ActivityIndicator style={{ marginTop: 44 }} color={UI.aquaInk} />
        ) : error ? (
          <Text className="mt-[36px] text-center text-[16px]" style={{ color: '#D2405B' }}>
            {error}
          </Text>
        ) : slots.length === 0 ? (
          <Text className="mt-[36px] text-center text-[16px]" style={{ color: B.sub, lineHeight: 24 }}>
            {'No times left on this day.\nGo back and try another date.'}
          </Text>
        ) : (
          <View className="mt-[16px] flex-row flex-wrap" style={{ gap: 10 }}>
            {slots.map((s) => {
              const on = picked?.startsAt === s.startsAt;
              return (
                <Button
                  key={s.startsAt}
                  label={s.label}
                  variant={on ? 'primary' : 'glass'}
                  check={on}
                  height={62}
                  radius={18}
                  paddingX={0}
                  textSize={17}
                  checkSize={22}
                  onPress={() => setPicked(s)}
                  style={{ width: '31.4%' }}
                />
              );
            })}
          </View>
        )}

        <View className="mt-[30px]">
          <PrimaryButton
            label="Continue"
            arrow
            disabled={!picked}
            onPress={() => {
              booking.slot = picked;
              booking.dentistName =
                dentists.find((d) => d.id === picked?.dentistId)?.displayName ?? '';
              router.push('/booking/confirm');
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}
