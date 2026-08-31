import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, Text, View } from 'react-native';

import type { FamilyMember, Service, Slot } from '@/lib/api';

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

/** Today in the device's own calendar — the day the picker opens on. */
export function todayISO(): string {
  const d = new Date();
  return toISODay(d);
}

export const toISODay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** 'YYYY-MM-DD' back to a local Date, without the UTC shift `new Date(str)` adds. */
export const fromISODay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Shared across the three booking steps. Ids, not labels: `POST
 * /api/appointments` takes a patientId, a serviceId, the dentistId that came
 * back on the slot, and the slot's exact `startsAt`. The client never invents a
 * time — it only ever hands back one the availability endpoint offered.
 */
export const booking: {
  patient: FamilyMember | null;
  service: Service | null;
  /** Clinic-local calendar day being browsed, as YYYY-MM-DD. */
  day: string;
  slot: Slot | null;
  dentistName: string;
} = {
  patient: null,
  service: null,
  day: todayISO(),
  slot: null,
  dentistName: '',
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
