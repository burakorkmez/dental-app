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
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AQUA_BODY, PrimaryButton, useAvatar } from '@/components/ui';
import { useApiClient, useMe } from '@/lib/api';

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

/** The column is a `date`, so it travels as YYYY-MM-DD with no timezone attached. */
const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const fromISODate = (iso: string | null) => {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

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
  editable = true,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText?: (v: string) => void;
  onPress?: () => void;
  /** False for values this app can't change — the email lives in Clerk. */
  editable?: boolean;
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
            editable={editable}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            className="flex-1 text-[15px] font-semibold"
            style={{ color: editable ? C.navy : C.sub }}
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
  const { me, refresh } = useMe();
  const avatar = useAvatar();
  const call = useApiClient();
  const self = me?.self;

  // `me` is already loaded by the time this screen can be reached, so seeding
  // state from it directly is enough — no effect to sync.
  const [name, setName] = useState(self ? `${self.firstName} ${self.lastName}` : '');
  const [phone, setPhone] = useState(self?.phone ?? '');
  const [dob, setDob] = useState<Date | null>(fromISODate(self?.dateOfBirth ?? null));
  const [gender, setGender] = useState(self?.gender ?? 'Male');
  const [dobOpen, setDobOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickGender = () =>
    ActionSheetIOS.showActionSheetWithOptions(
      { options: [...GENDERS, 'Cancel'], cancelButtonIndex: GENDERS.length, title: 'Gender' },
      (i) => i < GENDERS.length && setGender(GENDERS[i]),
    );

  const save = async () => {
    if (!self || saving) return;
    const [firstName, ...rest] = name.trim().split(/\s+/);
    if (!firstName || rest.length === 0) {
      Alert.alert('Name needed', 'Please enter both a first and a last name.');
      return;
    }
    setSaving(true);
    try {
      await call(`/api/patients/${self.id}`, {
        method: 'PATCH',
        body: {
          firstName,
          lastName: rest.join(' '),
          phone: phone.trim() || null,
          gender,
          dateOfBirth: dob ? toISODate(dob) : null,
        },
      });
      await refresh();
      router.back();
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
              source={avatar}
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
            {/* Clerk owns the email — changing it here would not stick. */}
            <Field label="Email" value={me?.email ?? ''} editable={false} />
            <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Field
              label="Date of Birth"
              value={dob ? formatDob(dob) : 'Not set'}
              onPress={() => setDobOpen(true)}
            />
            <Field label="Gender" value={gender} onPress={pickGender} />
          </View>

          <View className="mt-[11px]">
            <PrimaryButton
              label={saving ? 'Saving…' : 'Save Changes'}
              disabled={saving || !self}
              onPress={save}
            />
          </View>

          {/* native wheel — no calendar of our own to keep in sync */}
          <Host style={{ position: 'absolute' }}>
            <BottomSheet isPresented={dobOpen} onIsPresentedChange={setDobOpen} fitToContents>
              <DatePicker
                selection={dob ?? new Date(1990, 0, 1)}
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
