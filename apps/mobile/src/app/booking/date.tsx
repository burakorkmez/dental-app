import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { B, booking, Header, SectionRow, SHADOW } from '@/components/booking';
import { AQUA_BODY, GLASS_BODY, PrimaryButton, SHADOW_GLASS, UI } from '@/components/ui';

const PEOPLE = [
  { name: 'Alex', img: require('@/assets/images/av-alex.png') },
  { name: 'Emma', img: require('@/assets/images/av-emma.png') },
  { name: 'Noah', img: require('@/assets/images/av-noah.png') },
];

const REASONS = [
  'Checkup',
  'Cleaning',
  'Tooth pain',
  'Whitening',
  'Orthodontic consultation',
  'Restorative',
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export default function BookingDate() {
  const [who, setWho] = useState(booking.who);
  const [reason, setReason] = useState(booking.reason);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);

  const today = useMemo(() => startOfDay(new Date()), []);
  const [picked, setPicked] = useState<Date>(today);

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
          {PEOPLE.map((p, i) => (
            <Pressable
              key={p.name}
              onPress={() => setWho(i)}
              className="flex-1 items-center rounded-[20px] pb-[12px] pt-[14px]"
              style={[
                {
                  backgroundColor: B.card,
                  borderWidth: who === i ? 1.5 : 1,
                  borderColor: who === i ? '#4FC3E8' : B.border,
                },
                SHADOW,
              ]}
            >
              <Image
                source={p.img}
                style={{ width: 64, height: 64, borderRadius: 14 }}
                contentFit="cover"
              />
              <Text className="mt-[8px] text-[15px]" style={{ color: B.navy }}>
                {p.name}
              </Text>
              {who === i ? (
                <View className="absolute left-[-6px] top-[-6px]">
                  <SymbolView name="checkmark.circle.fill" size={26} tintColor={UI.aquaInk} />
                </View>
              ) : null}
            </Pressable>
          ))}
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
        <Pressable onPress={() => setPickerOpen(true)} style={SHADOW_GLASS}>
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
            <Text className="ml-[16px] flex-1 text-[18px]" style={{ color: B.navy }}>
              {reason}
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
            onPress={() => {
              Object.assign(booking, { who, reason, date: picked });
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
            {REASONS.map((r) => (
              <Pressable
                key={r}
                onPress={() => {
                  setReason(r);
                  setPickerOpen(false);
                }}
                className="h-[54px] flex-row items-center"
              >
                <Text
                  className="flex-1 text-[17px]"
                  style={{ color: r === reason ? UI.aquaInk : B.navy }}
                >
                  {r}
                </Text>
                {r === reason ? (
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
