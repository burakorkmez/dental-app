import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, Text, View } from 'react-native';

/** Sampled from design/book-app-*.png */
export const B = {
  page: '#EBF5FD',
  card: '#F6FAFD',
  field: '#F1F8FE',
  navy: '#0B2E4E',
  title: '#0A2540',
  sub: '#6C8399',
  muted: '#9AA9BA',
  link: '#1678CB',
  teal: '#0FB4C4',
  border: '#E2EFF9',
};

// surfaces only — every button/chip comes from '@/components/ui' (see AGENTS.md)
export { SHADOW_GLASS as SHADOW } from './ui';

/** Shared across the three booking steps (same pattern as the onboarding draft). */
export const booking = {
  who: 0,
  reason: 'Cleaning',
  date: new Date(),
  time: '10:30 AM',
};

export const formatDate = (d: Date) =>
  d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export function Header({ title }: { title: string }) {
  return (
    <View className="h-[38px] justify-center">
      <Pressable onPress={() => router.back()} className="absolute left-0 z-10 p-[4px]">
        <SymbolView name="arrow.left" size={26} tintColor={B.title} />
      </Pressable>
      <Text className="text-center text-[21px] font-semibold" style={{ color: B.title }}>
        {title}
      </Text>
    </View>
  );
}

export function SectionRow({ label, action }: { label: string; action?: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-[18px] font-semibold" style={{ color: B.title }}>
        {label}
      </Text>
      {action ? (
        <Text className="text-[17px]" style={{ color: B.link }}>
          {action}
        </Text>
      ) : null}
    </View>
  );
}
