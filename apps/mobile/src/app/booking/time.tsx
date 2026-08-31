import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { B, booking, formatDate, fromISODay, Header, SHADOW } from '@/components/booking';
import { Button, PrimaryButton, UI } from '@/components/ui';
import { useApi, type Dentist, type Slot } from '@/lib/api';

const FALLBACK_PHOTO = require('@/assets/images/av-doctor.png');
const photo = (d: Dentist | null) => (d?.photoUrl ? { uri: d.photoUrl } : FALLBACK_PHOTO);

/**
 * Headshot with the background cut away by ImageKit's AI and flattened onto
 * white (`e-bgremove` chained to `bg-FFFFFF`). Zoom view only — every distinct
 * URL costs extension units, and the result is cached forever after the first
 * render. The first request can take seconds and comes back as an intermediate
 * 200 until it is ready, which is what the plain photo underneath is for.
 */
const cutout = (d: Dentist | null) =>
  d?.photoUrl
    ? { uri: `${d.photoUrl}${d.photoUrl.includes('?') ? '&' : '?'}tr=e-bgremove:bg-FFFFFF` }
    : FALLBACK_PHOTO;

export default function BookingTime() {
  const service = booking.service;
  const [picked, setPicked] = useState<Slot | null>(booking.slot);
  /** null = any dentist, the aggregated view the availability endpoint returns. */
  const [dentistId, setDentistId] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState(false);

  // This screen stays mounted behind confirm, so a slot the server rejected has
  // to be dropped from local state too — not just from `booking`.
  useFocusEffect(useCallback(() => setPicked(booking.slot), []));

  const { data, loading, error } = useApi<{ slots: Slot[] }>(
    service
      ? `/api/availability?serviceId=${service.id}&from=${booking.day}` +
          (dentistId ? `&dentistId=${dentistId}` : '')
      : null
  );
  const { data: dentistData } = useApi<{ dentists: Dentist[] }>(
    service ? `/api/dentists?serviceId=${service.id}` : null
  );

  /**
   * Availability comes back aggregated across every dentist who offers the
   * service, so the same wall-clock time can appear more than once. The patient
   * picks a time; the first dentist free at it is the one they get — unless
   * they pick a dentist above, which narrows the query server-side.
   */
  const slots = useMemo(() => {
    const byLabel = new Map<string, Slot>();
    for (const s of data?.slots ?? []) if (!byLabel.has(s.label)) byLabel.set(s.label, s);
    return [...byLabel.values()];
  }, [data]);

  const dentists = dentistData?.dentists ?? [];
  // With no dentist chosen, the card shows whoever the picked slot belongs to.
  const dentist = dentists.find((d) => d.id === (dentistId ?? picked?.dentistId)) ?? null;

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
          <Pressable onPress={() => dentist && setZoomed(true)}>
            <Image
              source={photo(dentist)}
              style={{ width: 76, height: 76, borderRadius: 38 }}
              contentFit="cover"
            />
          </Pressable>
          <View className="ml-[16px] flex-1">
            <Text className="text-[20px] font-semibold" style={{ color: B.title }}>
              {dentist?.displayName ?? 'Any available dentist'}
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
          <Pressable
            onPress={() => dentist && setZoomed(true)}
            className="h-[44px] w-[44px] items-center justify-center rounded-[14px]"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            <SymbolView name="info.circle" size={24} tintColor={B.link} />
          </Pressable>
        </View>

        {/* dentist picker */}
        {dentists.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-[14px]"
            contentContainerStyle={{ gap: 12, paddingVertical: 6, paddingHorizontal: 2 }}
          >
            {[null, ...dentists].map((d) => {
              const on = dentistId === (d?.id ?? null);
              return (
                <Pressable
                  key={d?.id ?? 'any'}
                  onPress={() => {
                    // A different dentist means a different set of times.
                    setDentistId(d?.id ?? null);
                    setPicked(null);
                  }}
                  className="items-center"
                  style={{ width: 84 }}
                >
                  <View
                    className="rounded-full p-[2px]"
                    style={{ borderWidth: 2, borderColor: on ? UI.aquaInk : 'transparent' }}
                  >
                    {d ? (
                      <Image
                        source={photo(d)}
                        style={{ width: 56, height: 56, borderRadius: 28 }}
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        className="h-[56px] w-[56px] items-center justify-center rounded-full"
                        style={{ backgroundColor: B.card, borderWidth: 1, borderColor: B.border }}
                      >
                        <SymbolView name="person.2.fill" size={24} tintColor={B.link} />
                      </View>
                    )}
                  </View>
                  <Text
                    numberOfLines={2}
                    className="mt-[6px] text-center text-[12px]"
                    style={{ color: on ? UI.aquaInk : B.sub }}
                  >
                    {d?.displayName ?? 'Any'}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

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
            {dentistId
              ? 'No times left with this dentist.\nTry another dentist or date.'
              : 'No times left on this day.\nGo back and try another date.'}
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

      <Modal visible={zoomed} transparent animationType="fade" onRequestClose={() => setZoomed(false)}>
        <Pressable
          className="flex-1 items-center justify-center px-[28px]"
          style={{ backgroundColor: 'rgba(10,37,64,0.62)' }}
          onPress={() => setZoomed(false)}
        >
          <Image
            source={cutout(dentist)}
            placeholder={photo(dentist)}
            placeholderContentFit="cover"
            transition={200}
            style={{ width: '86%', aspectRatio: 1, borderRadius: 28, backgroundColor: '#FFFFFF' }}
            contentFit="contain"
          />
          <Text className="mt-[18px] text-[22px] font-semibold text-white">
            {dentist?.displayName ?? ''}
          </Text>
          <Text className="mt-[4px] text-[16px]" style={{ color: '#C9E3F5' }}>
            {[dentist?.title, dentist?.specialty].filter(Boolean).join(' · ')}
          </Text>
          {dentist?.bio ? (
            <Text
              className="mt-[12px] text-center text-[15px]"
              style={{ color: '#C9E3F5', lineHeight: 22 }}
            >
              {dentist.bio}
            </Text>
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}
