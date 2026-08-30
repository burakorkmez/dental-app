import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { ScrollView, Text, View } from 'react-native';

import { B, booking, formatDate, Header, SectionRow, SHADOW } from '@/components/booking';
import { PrimaryButton, UI } from '@/components/ui';

function DetailRow({
  icon,
  label,
  value,
  suffix,
  last,
}: {
  icon: SymbolViewProps['name'];
  label: string;
  value: string;
  suffix?: string;
  last?: boolean;
}) {
  return (
    <View
      className="flex-row items-center py-[14px]"
      style={last ? undefined : { borderBottomWidth: 1, borderBottomColor: '#E4EFF8' }}
    >
      <SymbolView name={icon} size={28} tintColor={UI.aquaInk} style={{ width: 34 }} />
      <View className="ml-[12px]">
        <Text className="text-[15px]" style={{ color: B.sub }}>
          {label}
        </Text>
        <Text className="mt-[2px] text-[18px] font-semibold" style={{ color: B.navy }}>
          {value}
          {suffix ? (
            <Text className="text-[16px]" style={{ color: B.sub }}>
              {' '}
              {suffix}
            </Text>
          ) : null}
        </Text>
      </View>
    </View>
  );
}

export default function BookingConfirm() {
  return (
    <View className="flex-1" style={{ backgroundColor: B.page }}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ paddingTop: 72, paddingHorizontal: 22, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <Header title="Confirm Appointment" />

        <View className="mt-[30px]">
          <SectionRow label="Who is this for?" />
        </View>

        <View
          className="mt-[14px] flex-row items-center rounded-[22px] px-[18px] py-[18px]"
          style={[{ backgroundColor: B.card, borderWidth: 1, borderColor: B.border }, SHADOW]}
        >
          <View>
            <Image
              source={require('@/assets/images/av-alex.png')}
              style={{ width: 76, height: 76, borderRadius: 38 }}
              contentFit="cover"
            />
            <View className="absolute left-[-6px] top-[-4px]">
              <SymbolView name="checkmark.circle.fill" size={26} tintColor={UI.aquaInk} />
            </View>
          </View>
          <View className="ml-[20px]">
            <Text className="text-[22px] font-semibold" style={{ color: B.title }}>
              Alex
            </Text>
            <Text className="mt-[2px] text-[17px]" style={{ color: B.sub }}>
              Me
            </Text>
          </View>
        </View>

        <View
          className="mt-[24px] rounded-[22px] px-[18px] pb-[18px] pt-[18px]"
          style={[{ backgroundColor: B.card, borderWidth: 1, borderColor: B.border }, SHADOW]}
        >
          <Text className="text-[18px] font-semibold" style={{ color: B.title }}>
            Appointment Summary
          </Text>

          <View
            className="mt-[14px] flex-row items-center pb-[16px]"
            style={{ borderBottomWidth: 1, borderBottomColor: '#E4EFF8' }}
          >
            <View
              className="h-[66px] w-[66px] items-center justify-center rounded-full"
              style={{ backgroundColor: '#EDF6FC' }}
            >
              <Image
                source={require('@/assets/images/ic-tooth.png')}
                style={{ width: 38, height: 38 }}
                contentFit="contain"
              />
            </View>
            <View className="ml-[16px]">
              <Text className="text-[22px] font-semibold" style={{ color: B.title }}>
                {booking.reason}
              </Text>
              <Text className="mt-[3px] text-[16px]" style={{ color: B.sub }}>
                Regular professional cleaning
              </Text>
            </View>
          </View>

          <DetailRow icon="calendar" label="Date" value={formatDate(booking.date)} />
          <DetailRow icon="clock" label="Time" value={booking.time} suffix="(45 min)" />
          <DetailRow icon="person" label="Dentist" value="Dr. Sarah Johnson" last />

          <View
            className="mt-[8px] flex-row items-center rounded-[16px] px-[12px] py-[14px]"
            style={{ backgroundColor: '#E8F4FC' }}
          >
            <SymbolView name="bell" size={22} tintColor={B.link} />
            <Text className="ml-[10px] flex-1 text-[13px]" style={{ color: B.navy }}>
              You will receive a reminder before your appointment.
            </Text>
          </View>
        </View>

        <View className="mt-[30px]">
          <PrimaryButton label="Confirm Appointment" arrow onPress={() => router.dismissTo('/home')} />
        </View>
      </ScrollView>
    </View>
  );
}
