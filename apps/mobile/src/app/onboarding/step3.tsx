import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { draft, PrimaryButton, SHADOW, StepHeader, T } from '@/components/onboarding';

const SERVICES = [
  { key: 'checkup', title: 'Checkup', sub: 'Regular exam', img: require('@/assets/images/svc-checkup.png') },
  { key: 'cleaning', title: 'Cleaning', sub: 'Professional cleaning', img: require('@/assets/images/svc-cleaning.png') },
  { key: 'pain', title: 'Tooth pain', sub: 'Pain or discomfort', img: require('@/assets/images/svc-toothpain.png') },
  { key: 'white', title: 'Whitening', sub: 'Brighten your smile', img: require('@/assets/images/svc-whitening.png') },
  { key: 'ortho', title: 'Orthodontic consultation', sub: 'Braces or aligners', img: require('@/assets/images/svc-ortho.png') },
  { key: 'resto', title: 'Restorative', sub: 'Crowns, bridges, implants', img: require('@/assets/images/svc-restorative.png') },
];

export default function Step3() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(draft.services);

  const onContinue = () => {
    draft.services = selected;
    router.push('/onboarding/step4');
  };

  return (
    <View className="flex-1" style={{ backgroundColor: '#EAF4FC' }}>
      <StatusBar style="dark" />
      <Image
        source={require('@/assets/images/onboarding-bg.png')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: 30 }}
        className="px-[22px]"
        showsVerticalScrollIndicator={false}
      >
        <StepHeader step={3} skip onSkip={() => router.push('/onboarding/step4')} />

        <Text className="mt-[24px] text-[31px] font-bold" style={{ color: T.headline }}>
          What brings you in?
        </Text>
        <Text className="mt-[8px] text-[17px]" style={{ color: T.secondary }}>
          Select all that apply.
        </Text>

        <View className="mt-[20px] flex-row flex-wrap" style={{ gap: 10 }}>
          {SERVICES.map((s) => {
            const on = selected.includes(s.key);
            return (
              <Pressable
                key={s.key}
                onPress={() =>
                  setSelected(
                    on ? selected.filter((k) => k !== s.key) : [...selected, s.key]
                  )
                }
                className="items-center rounded-[20px] px-[8px] pb-[16px] pt-[14px]"
                style={[
                  {
                    width: '31%',
                    backgroundColor: T.surface,
                    borderWidth: on ? 2 : 1,
                    borderColor: on ? '#2E9BE0' : T.border,
                  },
                  SHADOW,
                ]}
              >
                <Image source={s.img} style={{ width: 66, height: 66 }} contentFit="contain" />
                <Text
                  className="mt-[8px] text-center text-[15px] font-semibold"
                  style={{ color: T.headline }}
                >
                  {s.title}
                </Text>
                <Text className="mt-[4px] text-center text-[13px]" style={{ color: T.secondary }}>
                  {s.sub}
                </Text>
                {on ? (
                  <View className="absolute right-[8px] top-[8px]">
                    <SymbolView name="checkmark.circle.fill" size={26} tintColor="#1487E0" />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View
          className="mt-[14px] flex-row items-center rounded-[20px] px-[16px] py-[14px]"
          style={[{ backgroundColor: T.surface, borderWidth: 1, borderColor: T.border }, SHADOW]}
        >
          <View
            className="h-[42px] w-[42px] items-center justify-center rounded-full"
            style={{ backgroundColor: '#CFE7F8' }}
          >
            <SymbolView name="plus" size={20} tintColor="#FFFFFF" />
          </View>
          <View className="ml-[14px]">
            <Text className="text-[16px] font-semibold" style={{ color: T.headline }}>
              Other concern
            </Text>
            <Text className="mt-[2px] text-[14px]" style={{ color: T.secondary }}>
              Not listed above
            </Text>
          </View>
        </View>

        <View className="mt-[22px]">
          <PrimaryButton label="Continue" arrow onPress={onContinue} />
        </View>
      </ScrollView>
    </View>
  );
}
