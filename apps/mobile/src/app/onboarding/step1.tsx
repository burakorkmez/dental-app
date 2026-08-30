import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Chip,
  draft,
  Field,
  Label,
  PrimaryButton,
  StepHeader,
  SHADOW,
  T,
} from '@/components/onboarding';
import { dobError, formatDob, isValidDob } from '@/lib/dob';

const GENDERS = ['Male', 'Female', 'Other'];

export default function Step1() {
  const [firstName, setFirstName] = useState(draft.firstName);
  const [lastName, setLastName] = useState(draft.lastName);
  const [dob, setDob] = useState(draft.dob);
  const [phone, setPhone] = useState(draft.phone);
  const [gender, setGender] = useState(draft.gender);

  const onContinue = () => {
    if (!isValidDob(dob)) return;
    Object.assign(draft, { firstName, lastName, dob, phone, gender });
    router.push('/onboarding/step2');
  };

  return (
    <View className="flex-1" style={{ backgroundColor: T.page }}>
      <StatusBar style="dark" />
      <Image
        source={require('@/assets/images/onboarding-bg.png')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <ScrollView
        contentContainerStyle={{ paddingTop: 90, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Text className="text-center text-[30px] font-bold" style={{ color: '#1A456C' }}>
          Dent<Text style={{ color: '#00C4F8' }}>ify</Text>
        </Text>
        <Text className="mt-[6px] text-center text-[17px]" style={{ color: T.secondary }}>
          Care for your smile
        </Text>

        <View
          className="mx-[32px] mt-[22px] rounded-[30px] px-[22px] pb-[26px] pt-[24px]"
          style={[{ backgroundColor: T.card }, SHADOW]}
        >
          <StepHeader step={1} />

          <View className="mt-[32px] mb-[7px]">
            <Text className="text-[31px] font-bold" style={{ color: T.headline }}>
              Tell us about you
            </Text>
            <Text className="mt-[10px] text-[16px]" style={{ color: T.secondary }}>
              We&rsquo;ll create your personal profile.
            </Text>
          </View>

          <Field
            label="First name"
            placeholder="Enter your first name"
            value={firstName}
            onChangeText={setFirstName}
          />
          <Field
            label="Last name"
            placeholder="Enter your last name"
            value={lastName}
            onChangeText={setLastName}
          />
          <Field
            label="Date of birth"
            placeholder="MM / DD / YYYY"
            icon="calendar"
            value={dob}
            onChangeText={(text) => setDob(formatDob(text))}
            keyboardType="number-pad"
            maxLength={14}
            error={dobError(dob)}
          />
          <Field
            label="Phone number"
            placeholder="(555) 123-4567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            left={
              <View className="mr-[14px] flex-row items-center" style={{ gap: 6 }}>
                <Text className="text-[22px]">🇺🇸</Text>
                <Text className="text-[13px]" style={{ color: T.secondary }}>
                  ▾
                </Text>
                <View className="ml-[8px] h-[26px] w-[1px]" style={{ backgroundColor: T.border }} />
              </View>
            }
          />

          <View className="mt-[15px]">
            <Label>Gender</Label>
            <View className="flex-row" style={{ gap: 12 }}>
              {GENDERS.map((g) => (
                <Chip
                  key={g}
                  label={g}
                  grow
                  selected={gender === g}
                  onPress={() => setGender(g)}
                />
              ))}
            </View>
          </View>

          <View className="mt-[26px]">
            <PrimaryButton label="Continue" disabled={!isValidDob(dob)} onPress={onContinue} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
