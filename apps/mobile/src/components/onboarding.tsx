import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Pressable, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

export { Button, Chip, PrimaryButton, UI } from './ui';

/** Tokens read off design-system.png + sampled from the onboarding mockups. */
export const T = {
  page: '#DCECFB',
  card: '#EDF5FD',
  surface: '#F4F9FE',
  border: '#E1EEF9',
  navy: '#17324A',
  headline: '#0B2E4E',
  secondary: '#6C8399',
  placeholder: '#9BB0C2',
  aquaFrom: '#22B0D0',
  aquaTo: '#45C4E0',
  aquaFlat: '#2FBAD8',
  link: '#0E86C4',
  track: '#DCE9F4',
  error: '#D2405B',
};

export const AQUA = [T.aquaFrom, T.aquaTo] as const;

// The design's inputs sit on a soft, wide, low-contrast shadow.
export const FIELD_SHADOW = {
  shadowColor: '#0A5B96',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.09,
  shadowRadius: 9,
  elevation: 2,
} as const;

export const SHADOW = {
  shadowColor: '#075A92',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.13,
  shadowRadius: 12,
  elevation: 4,
} as const;

export function Progress({ step, total = 4 }: { step: number; total?: number }) {
  return (
    <View className="flex-row" style={{ gap: 8 }}>
      {Array.from({ length: total }, (_, i) =>
        i < step ? (
          <LinearGradient
            key={i}
            colors={AQUA}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, height: 6, borderRadius: 3 }}
          />
        ) : (
          <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: T.track }} />
        )
      )}
    </View>
  );
}

export function StepHeader({
  step,
  skip,
  onSkip,
}: {
  step: number;
  skip?: boolean;
  onSkip?: () => void;
}) {
  return (
    <View>
      <View className="mb-[14px] h-[26px] flex-row items-center justify-between">
        <View className="flex-row items-center" style={{ gap: 8 }}>
          {step > 1 ? (
            <Pressable onPress={() => router.back()} hitSlop={16} className="-ml-[2px]">
              <SymbolView name="chevron.left" size={19} tintColor={T.link} weight="semibold" />
            </Pressable>
          ) : null}
          <Text className="text-[17px] font-semibold" style={{ color: T.link }}>
            {step} of 4
          </Text>
        </View>
        {skip ? (
          <Pressable onPress={onSkip} hitSlop={12}>
            <Text className="text-[17px] font-semibold" style={{ color: T.link }}>
              Skip
            </Text>
          </Pressable>
        ) : (
          <SymbolView name="sparkle" size={18} tintColor="#8FB6D2" />
        )}
      </View>
      <Progress step={step} />
    </View>
  );
}

export function Heading({ title, sub }: { title: string; sub: string }) {
  return (
    <View>
      <Text className="text-[30px] font-bold" style={{ color: T.headline, lineHeight: 38 }}>
        {title}
      </Text>
      <Text className="mt-[8px] text-[16px]" style={{ color: T.secondary }}>
        {sub}
      </Text>
    </View>
  );
}

export function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <Text className="mb-[8px] text-[14px] font-semibold" style={{ color: T.navy }}>
      {children}
      {hint ? (
        <Text className="text-[14px] font-normal" style={{ color: T.secondary }}>
          {' '}
          {hint}
        </Text>
      ) : null}
    </Text>
  );
}

export function Field({
  label,
  placeholder,
  icon,
  left,
  value,
  onChangeText,
  keyboardType,
  maxLength,
  error,
}: {
  label: string;
  placeholder: string;
  icon?: SymbolViewProps['name'];
  left?: ReactNode;
  value?: string;
  onChangeText?: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  /** Shown under the field; also reddens the rim. */
  error?: string;
}) {
  return (
    <View className="mt-[15px]">
      <Label>{label}</Label>
      <View
        className="h-[54px] flex-row items-center rounded-[18px] px-[18px]"
        style={[
          { backgroundColor: '#F8FBFE', borderWidth: 1, borderColor: error ? T.error : T.border },
          FIELD_SHADOW,
        ]}
      >
        {left}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          maxLength={maxLength}
          placeholder={placeholder}
          placeholderTextColor={T.placeholder}
          className="flex-1 text-[17px]"
          style={{ color: T.navy }}
        />
        {icon ? <SymbolView name={icon} size={22} tintColor={T.link} /> : null}
      </View>
      {error ? (
        <Text className="ml-[6px] mt-[6px] text-[13px]" style={{ color: T.error }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

// ponytail: in-memory draft, session-only. Phase 3 replaces it with the API
// call that saves the patient profile.
export const draft = {
  firstName: '',
  lastName: '',
  dob: '',
  phone: '',
  gender: 'Male',
  allergies: ['Penicillin'] as string[],
  medications: ['None'] as string[],
  smokes: false,
  pregnant: false,
  notes: '',
  anxiety: 5,
  services: ['cleaning', 'pain'] as string[],
  preferredTime: 'Morning',
  heardAbout: 'Friend / Family',
  extraNotes: '',
};

// ponytail: hard-coded, session-only. The real value comes from the API in
// Phase 3 — set this to true to skip onboarding and land straight on home.
export let hasOnboarded = true;
export const finishOnboarding = () => {
  hasOnboarded = true;
};
