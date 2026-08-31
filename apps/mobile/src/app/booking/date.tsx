import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { B, booking, fromISODay, Header, SectionRow, SHADOW, toISODay } from '@/components/booking';
import { AQUA_BODY, Button, GLASS_BODY, PrimaryButton, SHADOW_GLASS, UI } from '@/components/ui';
import { useApi, useMe, type FamilyMember, type Service } from '@/lib/api';

// No patient photos in v1 — the family list gets stock avatars by position.
const AVATARS = [
  require('@/assets/images/av-alex.png'),
  require('@/assets/images/av-emma.png'),
  require('@/assets/images/av-noah.png'),
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export default function BookingDate() {
  const { me } = useMe();
  const { data, loading, error, reload } = useApi<{ services: Service[] }>('/api/services');
  const services = data?.services ?? [];

  const family: FamilyMember[] = me?.family ?? [];
  const [patient, setPatient] = useState<FamilyMember | null>(
    booking.patient ?? family.find((p) => p.isSelf) ?? null
  );
  const [service, setService] = useState<Service | null>(booking.service);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);

  const today = useMemo(() => startOfDay(new Date()), []);
  const [picked, setPicked] = useState<Date>(fromISODay(booking.day));

  const view = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = view.getFullYear();
  const month = view.getMonth();

  const cells = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lead = (new Date(year, month, 1).getDay() + 6) % 7; // week starts Monday
    return [
      ...Array<number | null>(lead).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
  }, [year, month]);

  // The family list arrives with `me`, so the default self-selection can only
  // be made once it has.
  const selected = patient ?? family.find((p) => p.isSelf) ?? null;

  return (
    <View className="flex-1" style={{ backgroundColor: B.page }}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ paddingTop: 72, paddingHorizontal: 22, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <Header title="Book Appointment" />

        <View className="mt-[25px]">
          <SectionRow label="Who is this for?" action="Change" />
        </View>

        <View className="mt-[14px] flex-row" style={{ gap: 10 }}>
          {family.map((p, i) => {
            const on = selected?.id === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => setPatient(p)}
                className="flex-1 items-center rounded-[20px] pb-[12px] pt-[14px]"
                style={[
                  {
                    backgroundColor: B.card,
                    borderWidth: on ? 1.5 : 1,
                    borderColor: on ? '#4FC3E8' : B.border,
                  },
                  SHADOW,
                ]}
              >
                <Image
                  source={AVATARS[i % AVATARS.length]}
                  style={{ width: 64, height: 64, borderRadius: 14 }}
                  contentFit="cover"
                />
                <Text numberOfLines={1} className="mt-[8px] text-[15px]" style={{ color: B.navy }}>
                  {p.firstName}
                </Text>
                {on ? (
                  <View className="absolute left-[-6px] top-[-6px]">
                    <SymbolView name="checkmark.circle.fill" size={26} tintColor={UI.aquaInk} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
          <View
            className="flex-1 items-center justify-center rounded-[20px] pb-[12px] pt-[14px]"
            style={[{ backgroundColor: B.card, borderWidth: 1, borderColor: B.border }, SHADOW]}
          >
            <View className="h-[64px] items-center justify-center">
              <SymbolView name="plus" size={30} tintColor={B.link} />
            </View>
            <Text className="mt-[8px] text-[15px]" style={{ color: B.navy }}>
              Add
            </Text>
          </View>
        </View>

        <Text className="mt-[20px] text-[18px] font-semibold" style={{ color: B.title }}>
          Select reason
        </Text>
        <Pressable onPress={() => setPickerOpen(true)} disabled={loading} style={SHADOW_GLASS}>
          <LinearGradient
            colors={GLASS_BODY}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{
              marginTop: 10,
              height: 56,
              borderRadius: 18,
              borderCurve: 'continuous',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.95)',
              borderBottomColor: '#DDEAF6',
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
            }}
          >
            <Image
              source={require('@/assets/images/ic-tooth.png')}
              style={{ width: 34, height: 34 }}
              contentFit="contain"
            />
            <Text
              className="ml-[16px] flex-1 text-[18px]"
              style={{ color: service ? B.navy : B.muted }}
            >
              {service?.name ?? (loading ? 'Loading…' : 'Choose a reason')}
            </Text>
            <SymbolView name="chevron.down" size={20} tintColor={B.navy} />
          </LinearGradient>
        </Pressable>

        <Text className="mt-[22px] text-[18px] font-semibold" style={{ color: B.title }}>
          Choose a date
        </Text>

        <View
          className="mt-[12px] rounded-[22px] px-[12px] pb-[14px] pt-[14px]"
          style={[{ backgroundColor: B.card, borderWidth: 1, borderColor: B.border }, SHADOW]}
        >
          <View className="h-[30px] flex-row items-center justify-between px-[8px]">
            {/* no way back past the current month — you cannot book a past date */}
            {monthOffset > 0 ? (
              <Pressable onPress={() => setMonthOffset((m) => m - 1)} hitSlop={12}>
                <SymbolView name="chevron.left" size={22} tintColor={B.link} />
              </Pressable>
            ) : (
              <View style={{ width: 22 }} />
            )}
            <Text className="text-[18px] font-semibold" style={{ color: B.title }}>
              {view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <Pressable onPress={() => setMonthOffset((m) => m + 1)} hitSlop={12}>
              <SymbolView name="chevron.right" size={22} tintColor={B.link} />
            </Pressable>
          </View>

          <View className="mt-[14px] flex-row">
            {WEEKDAYS.map((d) => (
              <Text key={d} className="flex-1 text-center text-[14px]" style={{ color: B.sub }}>
                {d}
              </Text>
            ))}
          </View>

          <View className="mt-[10px] flex-row flex-wrap">
            {cells.map((n, i) => {
              if (n === null) {
                return <View key={i} className="h-[40px]" style={{ width: '14.28%' }} />;
              }
              const date = new Date(year, month, n);
              const past = date < today;
              const on = date.getTime() === picked.getTime();
              return (
                <View
                  key={i}
                  className="h-[40px] items-center justify-center"
                  style={{ width: '14.28%' }}
                >
                  <Pressable
                    disabled={past}
                    onPress={() => setPicked(date)}
                    className="h-[34px] w-[34px] items-center justify-center rounded-full"
                    style={{ overflow: 'hidden' }}
                  >
                    {on ? (
                      <LinearGradient
                        colors={AQUA_BODY}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                      />
                    ) : null}
                    <Text
                      className="text-[16px]"
                      style={{ color: on ? '#FFFFFF' : past ? '#B9C8D6' : B.navy }}
                    >
                      {n}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>

        <View className="mt-[24px]">
          <PrimaryButton
            label="Continue"
            arrow
            disabled={!selected || !service}
            onPress={() => {
              // A new day invalidates whatever slot was chosen before.
              Object.assign(booking, {
                patient: selected,
                service,
                day: toISODay(picked),
                slot: null,
                dentistName: '',
              });
              router.push('/booking/time');
            }}
          />
        </View>
      </ScrollView>

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(10,37,64,0.35)' }}
          onPress={() => setPickerOpen(false)}
        >
          <View
            className="rounded-t-[28px] px-[22px] pb-[38px] pt-[20px]"
            style={{ backgroundColor: B.page }}
          >
            <Text className="mb-[8px] text-[18px] font-semibold" style={{ color: B.title }}>
              Select reason
            </Text>
            {loading ? <ActivityIndicator color={UI.aquaInk} /> : null}
            {error ? (
              <View className="py-[10px]">
                <Text className="mb-[14px] text-[16px]" style={{ color: '#D2405B' }}>
                  {error}
                </Text>
                <Button label="Try again" variant="glass" onPress={reload} />
              </View>
            ) : null}
            {services.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => {
                  setService(s);
                  setPickerOpen(false);
                }}
                className="h-[54px] flex-row items-center"
              >
                <Text
                  className="flex-1 text-[17px]"
                  style={{ color: s.id === service?.id ? UI.aquaInk : B.navy }}
                >
                  {s.name}
                </Text>
                <Text className="mr-[12px] text-[15px]" style={{ color: B.sub }}>
                  {s.durationMinutes} min
                </Text>
                {s.id === service?.id ? (
                  <SymbolView name="checkmark" size={19} tintColor={UI.aquaInk} />
                ) : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
