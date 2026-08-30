import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { draft, PrimaryButton, SHADOW, StepHeader, T } from '@/components/onboarding';
import { serviceArt } from '@/components/ui';
import { useApi, type Service } from '@/lib/api';

export default function Step3() {
  const insets = useSafeAreaInsets();
  const { data, loading, error } = useApi<{ services: Service[] }>('/api/services');
  const [selected, setSelected] = useState(draft.services);

  // Teleconsults aren't a "what brings you in" answer — they're a way to be seen.
  const services = (data?.services ?? []).filter((s) => !s.isTeleconsult);

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

        {loading ? (
          <ActivityIndicator style={{ marginTop: 60 }} color={T.aquaFlat} />
        ) : error ? (
          <Text className="mt-[40px] text-center text-[16px]" style={{ color: T.error }}>
            {error}
          </Text>
        ) : (
          <View className="mt-[20px] flex-row flex-wrap" style={{ gap: 10 }}>
            {services.map((s) => {
              const on = selected.some((v) => v.key === s.key);
              return (
                <Pressable
                  key={s.key}
                  onPress={() =>
                    setSelected(
                      on
                        ? selected.filter((v) => v.key !== s.key)
                        : [...selected, { key: s.key, name: s.name }]
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
                  <Image
                    source={serviceArt(s.key)}
                    style={{ width: 66, height: 66 }}
                    contentFit="contain"
                  />
                  <Text
                    className="mt-[8px] text-center text-[15px] font-semibold"
                    style={{ color: T.headline }}
                  >
                    {s.name}
                  </Text>
                  <Text className="mt-[4px] text-center text-[13px]" style={{ color: T.secondary }}>
                    {s.description}
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
        )}

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
