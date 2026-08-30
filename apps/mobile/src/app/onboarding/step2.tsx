import { Host, Slider } from '@expo/ui/swift-ui';
import { glassEffect, padding, tint } from '@expo/ui/swift-ui/modifiers';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip, draft, Label, PrimaryButton, SHADOW, StepHeader, T } from '@/components/onboarding';

const ALLERGIES = ['Penicillin', 'Latex', 'Sulfa', 'Ibuprofen', 'None'];
const MEDICATIONS = ['Blood thinner', 'Insulin', 'None'];

const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

function ToggleRow({
  label,
  value,
  onValueChange,
  last,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View
      className="h-[46px] flex-row items-center justify-between px-[20px]"
      style={last ? undefined : { borderBottomWidth: 1, borderBottomColor: T.border }}
    >
      <Text className="text-[17px]" style={{ color: T.headline }}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: T.track, true: T.aquaFlat }}
      />
    </View>
  );
}

export default function Step2() {
  const insets = useSafeAreaInsets();
  const [allergies, setAllergies] = useState(draft.allergies);
  const [medications, setMedications] = useState(draft.medications);
  const [smokes, setSmokes] = useState(draft.smokes);
  const [pregnant, setPregnant] = useState(draft.pregnant);
  const [notes, setNotes] = useState(draft.notes);
  const [anxiety, setAnxiety] = useState(draft.anxiety);

  const onContinue = () => {
    Object.assign(draft, { allergies, medications, smokes, pregnant, notes, anxiety });
    router.push('/onboarding/step3');
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
        className="px-[29px]"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <StepHeader step={2} />

        <View className="mt-[26px]">
          <Text className="text-[30px] font-bold" style={{ color: T.headline, lineHeight: 38 }}>
            Your medical history
          </Text>
          <Text className="mt-[10px] text-[16px]" style={{ color: T.secondary }}>
            Help us provide the best care.
          </Text>
        </View>

        <View className="mt-[36px]">
          <Label hint="(select all that apply)">Allergies</Label>
          <View className="flex-row flex-wrap" style={{ gap: 18 }}>
            {ALLERGIES.map((a) => (
              <Chip
                key={a}
                label={a}
                check
                selected={allergies.includes(a)}
                onPress={() => setAllergies(toggle(allergies, a))}
              />
            ))}
          </View>
        </View>

        <View className="mt-[24px]">
          <Label hint="(select all that apply)">Medications</Label>
          <View className="flex-row flex-wrap" style={{ gap: 18 }}>
            {MEDICATIONS.map((m) => (
              <Chip
                key={m}
                label={m}
                check
                selected={medications.includes(m)}
                onPress={() => setMedications(toggle(medications, m))}
              />
            ))}
          </View>
        </View>

        <View
          className="mt-[22px] rounded-[22px]"
          style={[{ backgroundColor: T.surface }, SHADOW]}
        >
          <ToggleRow label="Do you smoke?" value={smokes} onValueChange={setSmokes} />
          <ToggleRow label="Are you pregnant?" value={pregnant} onValueChange={setPregnant} last />
        </View>

        <View className="mt-[22px]">
          <Text className="text-[19px] font-semibold" style={{ color: T.headline }}>
            Anxiety level
          </Text>
          <Host style={{ height: 54, marginTop: 8, marginHorizontal: -14 }}>
            <Slider
              value={anxiety}
              min={0}
              max={10}
              step={1}
              onValueChange={setAnxiety}
              modifiers={[
                tint(T.aquaFlat),
                padding({ horizontal: 18, vertical: 12 }),
                glassEffect({
                  glass: { variant: 'regular', interactive: true },
                  shape: 'capsule',
                }),
              ]}
            />
          </Host>
          <View className="mt-[6px] flex-row justify-between">
            <Text className="text-[15px]" style={{ color: T.secondary }}>Relaxed</Text>
            <Text className="text-[15px]" style={{ color: T.secondary }}>Very anxious</Text>
          </View>
        </View>

        <View className="mt-[20px]">
          <Label hint="(optional)">Additional notes</Label>
          <View
            className="h-[90px] rounded-[20px] px-[18px] pt-[14px]"
            style={{ backgroundColor: T.surface, borderWidth: 1, borderColor: T.border }}
          >
            <TextInput
              value={notes}
              onChangeText={setNotes}
              maxLength={300}
              multiline
              placeholder="Type here..."
              placeholderTextColor={T.placeholder}
              className="flex-1 text-[17px]"
              style={{ color: T.navy }}
            />
            <Text className="pb-[12px] text-right text-[14px]" style={{ color: T.placeholder }}>
              {notes.length}/300
            </Text>
          </View>
        </View>

        <Pressable onPress={() => router.push('/onboarding/step3')} hitSlop={8}>
          <Text className="mt-[18px] text-center text-[17px] font-semibold" style={{ color: T.link }}>
            I&rsquo;ll do this later
          </Text>
        </Pressable>

        <View className="mt-[14px]">
          <PrimaryButton label="Continue" arrow onPress={onContinue} />
        </View>
      </ScrollView>
    </View>
  );
}
