import { BottomSheet, DatePicker, Host } from '@expo/ui/swift-ui';
import { datePickerStyle } from '@expo/ui/swift-ui/modifiers';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ActionSheetIOS,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AQUA_BODY, PrimaryButton } from '@/components/ui';

const C = {
  page: '#EEF5FA',
  navy: '#0B2E4E',
  sub: '#65809A',
  label: '#7089A0',
  field: '#FFFFFF',
  border: '#E4EFF8',
  chevron: '#3E5C7D',
  ring: '#D6EDF6',
};

const GENDERS = ['Male', 'Female', 'Other'];

const formatDob = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const FIELD_SHADOW = {
  shadowColor: '#0A5B96',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
} as const;

/** Label + white rounded row. `onPress` turns it into a picker row with a chevron. */
function Field({
  label,
  value,
  onChangeText,
  onPress,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText?: (v: string) => void;
  onPress?: () => void;
  keyboardType?: 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'words';
}) {
  return (
    <View className="mt-[16px]">
      <Text className="mb-[8px] ml-[3px] text-[13px]" style={{ color: C.label }}>
        {label}
      </Text>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        className="h-[44px] flex-row items-center rounded-[16px] px-[24px]"
        style={[
          { backgroundColor: C.field, borderWidth: 1, borderColor: C.border, borderCurve: 'continuous' },
          FIELD_SHADOW,
        ]}
      >
        {onPress ? (
          <Text className="flex-1 text-[15px] font-semibold" style={{ color: C.navy }}>
            {value}
          </Text>
        ) : (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            className="flex-1 text-[15px] font-semibold"
            style={{ color: C.navy }}
          />
        )}
        {onPress ? (
          <SymbolView name="chevron.right" size={17} weight="semibold" tintColor={C.chevron} />
        ) : null}
      </Pressable>
    </View>
  );
}

export default function PersonalDetails() {
  const [name, setName] = useState('Alex Johnson');
  const [email, setEmail] = useState('alex.johnson@email.com');
  const [phone, setPhone] = useState('+1 234 567 890');
  const [dob, setDob] = useState(new Date(1990, 4, 15));
  const [gender, setGender] = useState('Male');
  const [dobOpen, setDobOpen] = useState(false);

  const pickGender = () =>
    ActionSheetIOS.showActionSheetWithOptions(
      { options: [...GENDERS, 'Cancel'], cancelButtonIndex: GENDERS.length, title: 'Gender' },
      (i) => i < GENDERS.length && setGender(GENDERS[i]),
    );

  return (
    <View collapsable={false} style={{ flex: 1, backgroundColor: C.page }}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingTop: 76, paddingHorizontal: 28, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={() => router.back()} hitSlop={12} className="h-[22px] justify-center">
            <SymbolView name="chevron.left" size={19} weight="semibold" tintColor={C.navy} />
          </Pressable>

          <Text className="mt-[20px] text-[27px] font-bold" style={{ color: C.navy }}>
            Personal Information
          </Text>
          <Text className="mt-[10px] text-[14.5px]" style={{ color: C.sub }}>
            Update your personal details
          </Text>

          {/* avatar + camera badge */}
          <View className="mt-[27px] h-[140px] w-[140px] self-center items-center justify-center">
            <View
              className="absolute h-[140px] w-[140px] rounded-full"
              style={{ backgroundColor: C.ring }}
            />
            <Image
              source={require('@/assets/images/av-alex.png')}
              style={{ width: 140, height: 140, borderRadius: 70 }}
              contentFit="cover"
            />
            <LinearGradient
              colors={AQUA_BODY}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{
                position: 'absolute',
                right: 3,
                bottom: 0,
                height: 46,
                width: 46,
                borderRadius: 23,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SymbolView name="camera.fill" size={21} tintColor="#FFFFFF" />
            </LinearGradient>
          </View>

          <View className="mt-[5px]">
            <Field label="Full Name" value={name} onChangeText={setName} autoCapitalize="words" />
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Field label="Date of Birth" value={formatDob(dob)} onPress={() => setDobOpen(true)} />
            <Field label="Gender" value={gender} onPress={pickGender} />
          </View>

          <View className="mt-[11px]">
            <PrimaryButton label="Save Changes" onPress={() => router.back()} />
          </View>

          {/* native wheel — no calendar of our own to keep in sync */}
          <Host style={{ position: 'absolute' }}>
            <BottomSheet isPresented={dobOpen} onIsPresentedChange={setDobOpen} fitToContents>
              <DatePicker
                selection={dob}
                range={{ end: new Date() }}
                displayedComponents={['date']}
                modifiers={[datePickerStyle('wheel')]}
                onDateChange={setDob}
              />
            </BottomSheet>
          </Host>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
