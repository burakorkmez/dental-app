import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { B, booking, formatDate, fromISODay, Header, SectionRow, SHADOW } from '@/components/booking';
import { PrimaryButton, serviceArt, UI, useAvatar } from '@/components/ui';
import { ApiError, useApiClient, type Appointment } from '@/lib/api';

function DetailRow({
  icon,
  label,
  value,
  suffix,
  last,
}: {
  icon: SymbolViewProps['name'];
  label: string;
  value: string;
  suffix?: string;
  last?: boolean;
}) {
  return (
    <View
      className="flex-row items-center py-[14px]"
      style={last ? undefined : { borderBottomWidth: 1, borderBottomColor: '#E4EFF8' }}
    >
      <SymbolView name={icon} size={28} tintColor={UI.aquaInk} style={{ width: 34 }} />
      <View className="ml-[12px]">
        <Text className="text-[15px]" style={{ color: B.sub }}>
          {label}
        </Text>
        <Text className="mt-[2px] text-[18px] font-semibold" style={{ color: B.navy }}>
          {value}
          {suffix ? (
            <Text className="text-[16px]" style={{ color: B.sub }}>
              {' '}
              {suffix}
            </Text>
          ) : null}
        </Text>
      </View>
    </View>
  );
}

export default function BookingConfirm() {
  const call = useApiClient();
  const avatar = useAvatar();
  const [saving, setSaving] = useState(false);
  const { patient, service, slot, dentistName } = booking;

  /**
   * `startsAt` is handed straight back from the slot the availability endpoint
   * offered. The server re-runs the scheduling engine over it and the exclusion
   * constraint settles any race — a 409 here means someone else got it first.
   */
  const confirm = async () => {
    if (!patient || !service || !slot || saving) return;
    setSaving(true);
    try {
      await call<{ appointment: Appointment }>('/api/appointments', {
        method: 'POST',
        body: {
          patientId: patient.id,
          serviceId: service.id,
          dentistId: slot.dentistId,
          startsAt: slot.startsAt,
        },
      });
      booking.slot = null;
      router.dismissTo('/home');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'slot_taken') {
        Alert.alert('That time just went', err.message, [
          { text: 'Pick another', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert(
          'Could not book',
          err instanceof Error ? err.message : 'Please try again.'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: B.page }}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ paddingTop: 72, paddingHorizontal: 22, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <Header title="Confirm Appointment" />

        <View className="mt-[30px]">
          <SectionRow label="Who is this for?" />
        </View>

        <View
          className="mt-[14px] flex-row items-center rounded-[22px] px-[18px] py-[18px]"
          style={[{ backgroundColor: B.card, borderWidth: 1, borderColor: B.border }, SHADOW]}
        >
          <View>
            <Image
              source={patient?.isSelf ? avatar : require('@/assets/images/av-alex.png')}
              style={{ width: 76, height: 76, borderRadius: 38 }}
              contentFit="cover"
            />
            <View className="absolute left-[-6px] top-[-4px]">
              <SymbolView name="checkmark.circle.fill" size={26} tintColor={UI.aquaInk} />
            </View>
          </View>
          <View className="ml-[20px]">
            <Text className="text-[22px] font-semibold" style={{ color: B.title }}>
              {patient ? `${patient.firstName} ${patient.lastName}` : '—'}
            </Text>
            <Text className="mt-[2px] text-[17px]" style={{ color: B.sub }}>
              {patient?.isSelf ? 'Me' : 'Family member'}
            </Text>
          </View>
        </View>

        <View
          className="mt-[24px] rounded-[22px] px-[18px] pb-[18px] pt-[18px]"
          style={[{ backgroundColor: B.card, borderWidth: 1, borderColor: B.border }, SHADOW]}
        >
          <Text className="text-[18px] font-semibold" style={{ color: B.title }}>
            Appointment Summary
          </Text>

          <View
            className="mt-[14px] flex-row items-center pb-[16px]"
            style={{ borderBottomWidth: 1, borderBottomColor: '#E4EFF8' }}
          >
            <View
              className="h-[66px] w-[66px] items-center justify-center rounded-full"
              style={{ backgroundColor: '#EDF6FC' }}
            >
              <Image
                source={serviceArt(service?.key)}
                style={{ width: 38, height: 38 }}
                contentFit="contain"
              />
            </View>
            <View className="ml-[16px] flex-1">
              <Text className="text-[22px] font-semibold" style={{ color: B.title }}>
                {service?.name ?? '—'}
              </Text>
              <Text className="mt-[3px] text-[16px]" style={{ color: B.sub }}>
                {service?.description ?? ''}
              </Text>
            </View>
          </View>

          <DetailRow icon="calendar" label="Date" value={formatDate(fromISODay(booking.day))} />
          <DetailRow
            icon="clock"
            label="Time"
            value={slot?.label ?? '—'}
            suffix={service ? `(${service.durationMinutes} min)` : undefined}
          />
          <DetailRow icon="person" label="Dentist" value={dentistName || 'Our team'} last />

          <View
            className="mt-[8px] flex-row items-center rounded-[16px] px-[12px] py-[14px]"
            style={{ backgroundColor: '#E8F4FC' }}
          >
            <SymbolView name="bell" size={22} tintColor={B.link} />
            <Text className="ml-[10px] flex-1 text-[13px]" style={{ color: B.navy }}>
              You will receive a reminder before your appointment.
            </Text>
          </View>
        </View>

        <View className="mt-[30px]">
          <PrimaryButton
            label={saving ? 'Booking…' : 'Confirm Appointment'}
            arrow
            disabled={saving || !slot}
            onPress={confirm}
          />
        </View>
      </ScrollView>
    </View>
  );
}
