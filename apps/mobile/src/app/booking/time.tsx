import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { B, booking, formatDate, Header, SHADOW } from '@/components/booking';
import { Button, PrimaryButton, UI } from '@/components/ui';

const SLOTS = [
  '09:00 AM', '09:15 AM', '09:30 AM',
  '09:45 AM', '10:00 AM', '10:15 AM',
  '10:30 AM', '10:45 AM', '11:00 AM',
  '11:15 AM', '11:30 AM', '11:45 AM',
  '12:00 PM', '12:15 PM', '12:30 PM',
];
const TAKEN = ['10:00 AM', '11:15 AM', '11:30 AM', '11:45 AM'];

export default function BookingTime() {
  const [picked, setPicked] = useState(booking.time);

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
            source={require('@/assets/images/av-doctor.png')}
            style={{ width: 76, height: 76, borderRadius: 38 }}
            contentFit="cover"
          />
          <View className="ml-[16px] flex-1">
            <Text className="text-[20px] font-semibold" style={{ color: B.title }}>
              Dr. Sarah Johnson
            </Text>
            <Text className="mt-[3px] text-[16px]" style={{ color: B.sub }}>
              Orthodontist
            </Text>
            <View className="mt-[4px] flex-row items-center">
              <SymbolView name="star.fill" size={15} tintColor="#F5B301" />
              <Text className="ml-[5px] text-[15px] font-semibold" style={{ color: B.navy }}>
                4.9
              </Text>
              <Text className="ml-[4px] text-[15px]" style={{ color: B.sub }}>
                (320 reviews)
              </Text>
            </View>
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
            {formatDate(booking.date)}
          </Text>
        </View>

        {/* legend */}
        <View className="mt-[20px] flex-row items-center">
          <View className="h-[10px] w-[10px] rounded-full" style={{ backgroundColor: UI.aquaInk }} />
          <Text className="ml-[8px] text-[15px]" style={{ color: B.navy }}>
            Available
          </Text>
          <View
            className="ml-[22px] h-[10px] w-[10px] rounded-full"
            style={{ backgroundColor: '#C9D8E5' }}
          />
          <Text className="ml-[8px] text-[15px]" style={{ color: B.muted }}>
            Unavailable
          </Text>
        </View>

        {/* slots */}
        <View className="mt-[16px] flex-row flex-wrap" style={{ gap: 10 }}>
          {SLOTS.map((t) => {
            const off = TAKEN.includes(t);
            const on = picked === t;
            return (
              <Button
                key={t}
                label={t}
                variant={on ? 'primary' : 'glass'}
                check={on}
                disabled={off}
                height={62}
                radius={18}
                paddingX={0}
                textSize={17}
                checkSize={22}
                onPress={() => setPicked(t)}
                style={{ width: '31.4%' }}
              />
            );
          })}
        </View>

        <View className="mt-[30px]">
          <PrimaryButton
            label="Continue"
            arrow
            onPress={() => {
              booking.time = picked;
              router.push('/booking/confirm');
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}
