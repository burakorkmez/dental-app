import * as Sentry from '@sentry/react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { B, booking, formatDate, fromISODay, Header, SectionRow, SHADOW } from '@/components/booking';
import { PrimaryButton, serviceArt, UI, useAvatar } from '@/components/ui';
import { ApiError, useApiClient, type Appointment } from '@/lib/api';
import { pickPhotos, UPLOAD_TIMEOUT_MS, type PickedPhoto } from '@/lib/photo';

/** Matches the server's own per-appointment cap. */
const MAX_ATTACHMENTS = 10;

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
  const [busy, setBusy] = useState<null | 'booking' | 'uploading'>(null);
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const { patient, service, slot, dentistName } = booking;

  const addPhotos = async () => {
    if (busy) return;
    try {
      const picked = await pickPhotos(MAX_ATTACHMENTS - photos.length);
      if (picked.length) setPhotos((v) => [...v, ...picked]);
    } catch (err) {
      Alert.alert('Could not add that photo', err instanceof Error ? err.message : 'Try again.');
    }
  };

  /**
   * `startsAt` is handed straight back from the slot the availability endpoint
   * offered. The server re-runs the scheduling engine over it and the exclusion
   * constraint settles any race — a 409 here means someone else got it first.
   */
  const confirm = async () => {
    if (!patient || !service || !slot || busy) return;
    setBusy('booking');
    try {
      const { appointment } = await call<{ appointment: Appointment }>('/api/appointments', {
        method: 'POST',
        body: {
          patientId: patient.id,
          serviceId: service.id,
          dentistId: slot.dentistId,
          startsAt: slot.startsAt,
        },
      });
      // The app's whole reason to exist (PLAN.md: "book without calling"), so
      // it is worth a line even on success — a booking rate that falls off a
      // cliff is otherwise invisible. Lead time and for-a-dependent are the two
      // things that shape demand. Never the procedure: the same rule that keeps
      // it out of a push body keeps it out of a log line.
      Sentry.logger.info('appointment booked', {
        lead_time_hours: Math.round(
          (new Date(slot.startsAt).getTime() - Date.now()) / 3_600_000
        ),
        is_teleconsult: service.isTeleconsult,
        for_dependent: !patient.isSelf,
        attachments: photos.length,
      });

      // The uploads ride AFTER the booking: an attachment needs an appointment
      // to belong to, and a photo that fails to upload must never cost the
      // patient the slot they just won. Hence the count, not a throw.
      let failed = 0;
      if (photos.length) {
        setBusy('uploading');
        for (const photo of photos) {
          const form = new FormData();
          form.append('photo', photo.file);
          try {
            await call(`/api/appointments/${appointment.id}/attachments`, {
              method: 'POST',
              body: form,
              timeoutMs: UPLOAD_TIMEOUT_MS,
            });
          } catch {
            failed += 1;
          }
        }
      }

      booking.slot = null;
      router.dismissTo('/home');
      if (failed) {
        Alert.alert(
          'Appointment booked',
          `${failed} of your ${photos.length} images could not be uploaded. You can bring them to your visit.`
        );
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === 'slot_taken') {
        // The exclusion constraint doing its job. Rare by design — a rate that
        // climbs means availability is going stale before patients can confirm.
        Sentry.logger.warn('booking lost the slot race', {
          lead_time_hours: Math.round(
            (new Date(slot.startsAt).getTime() - Date.now()) / 3_600_000
          ),
        });
        // Drop the rejected slot so the time screen cannot re-submit it.
        booking.slot = null;
        booking.dentistName = '';
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
      setBusy(null);
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

        <View className="mt-[24px]">
          <SectionRow label="X-rays or photos" />
          <Text className="mt-[6px] text-[15px]" style={{ color: B.sub, lineHeight: 21 }}>
            Optional. Photos that help your dentist prepare — a recent X-ray, or a
            picture of the tooth that is bothering you.
          </Text>

          <View className="mt-[14px] flex-row flex-wrap" style={{ gap: 10 }}>
            {photos.map((photo) => (
              <View key={photo.uri}>
                <Image
                  source={{ uri: photo.uri }}
                  style={{ width: 84, height: 84, borderRadius: 16 }}
                  contentFit="cover"
                />
                <Pressable
                  hitSlop={10}
                  accessibilityLabel="Remove image"
                  onPress={() => setPhotos((v) => v.filter((p) => p !== photo))}
                  className="absolute right-[-7px] top-[-7px]"
                >
                  <SymbolView name="xmark.circle.fill" size={24} tintColor={B.navy} />
                </Pressable>
              </View>
            ))}

            {photos.length < MAX_ATTACHMENTS ? (
              <Pressable
                onPress={addPhotos}
                accessibilityLabel="Add an image"
                className="h-[84px] w-[84px] items-center justify-center rounded-[16px]"
                style={{ backgroundColor: B.field, borderWidth: 1, borderColor: B.border }}
              >
                <SymbolView name="plus" size={26} tintColor={B.link} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <View className="mt-[30px]">
          <PrimaryButton
            label={
              busy === 'uploading'
                ? 'Uploading images…'
                : busy
                  ? 'Booking…'
                  : 'Confirm Appointment'
            }
            arrow
            disabled={!!busy || !slot}
            onPress={confirm}
          />
        </View>
      </ScrollView>
    </View>
  );
}
