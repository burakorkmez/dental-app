import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';

import {
  Button,
  Card,
  DetailRow,
  PAGE,
  PAGE_PAD,
  PageHeader,
  SectionLabel,
  serviceArt,
} from '@/components/ui';
import { useApi, useApiClient, type Appointment } from '@/lib/api';

/**
 * One appointment, plus its post-op instructions once the visit has happened
 * (PLAN.md phase 9). Cancelling is a PATCH — the 24-hour rule is the server's
 * call, and `canCancel` on the payload is what it decided.
 */
export default function AppointmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const call = useApiClient();
  const { data, loading, error, reload } = useApi<{ appointment: Appointment }>(
    `/api/appointments/${id}`
  );
  const [busy, setBusy] = useState(false);
  const a = data?.appointment;

  const cancel = () =>
    Alert.alert('Cancel this appointment?', 'The clinic will free up your slot.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel it',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await call(`/api/appointments/${id}`, {
              method: 'PATCH',
              body: { action: 'cancel' },
            });
            await reload();
          } catch (err) {
            Alert.alert(
              'Could not cancel',
              err instanceof Error ? err.message : 'Please call the clinic.'
            );
          } finally {
            setBusy(false);
          }
        },
      },
    ]);

  return (
    <View collapsable={false} style={{ flex: 1, backgroundColor: PAGE.bg }}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ paddingTop: 76, paddingHorizontal: PAGE_PAD, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          title={a?.service?.name ?? 'Appointment'}
          subtitle={a ? `${a.dateLabel} · ${a.timeLabel}` : 'Loading your appointment'}
        />

        {loading ? (
          <ActivityIndicator style={{ marginTop: 60 }} color={PAGE.icon} />
        ) : error || !a ? (
          <Text className="mt-[40px] text-center text-[15px]" style={{ color: PAGE.sub }}>
            {error ?? 'This appointment is no longer available.'}
          </Text>
        ) : (
          <>
            <Card style={{ marginTop: 24 }}>
              <View className="flex-row items-center px-[17px] pt-[19px]">
                <Image
                  source={serviceArt(a.service?.key)}
                  style={{ width: 52, height: 52 }}
                  contentFit="contain"
                />
                <View className="ml-[16px] flex-1">
                  <Text className="text-[16px] font-bold" style={{ color: PAGE.navy }}>
                    {a.status === 'booked' ? 'Booked' : a.status.replace('_', ' ')}
                  </Text>
                  <Text className="mt-[4px] text-[13px]" style={{ color: PAGE.sub }}>
                    {a.isTeleconsult ? 'Video consultation' : 'DentaCare Clinic'}
                  </Text>
                </View>
              </View>
              <DetailRow
                icon="person"
                title={a.dentist?.displayName ?? 'The clinic'}
                subtitle={a.dentist?.specialty ?? 'Your dentist'}
              />
              <View className="ml-[17px] mr-[17px] h-px" style={{ backgroundColor: PAGE.sep }} />
              <DetailRow
                icon="calendar"
                title={a.dateLabel}
                subtitle={`${a.timeLabel} · ${a.service?.durationMinutes ?? 0} min`}
              />
              <View className="ml-[17px] mr-[17px] h-px" style={{ backgroundColor: PAGE.sep }} />
              <DetailRow
                icon="figure.wave"
                title={
                  a.patient ? `${a.patient.firstName} ${a.patient.lastName}` : 'You'
                }
                subtitle="Who this is for"
              />
            </Card>

            {a.notes?.length ? (
              <>
                <SectionLabel style={{ marginTop: 28 }}>Post-op instructions</SectionLabel>
                {a.notes.map((n) => (
                  <Card key={n.id} style={{ marginTop: 10 }}>
                    <Text
                      className="px-[17px] py-[18px] text-[14px]"
                      style={{ color: PAGE.navy, lineHeight: 21 }}
                    >
                      {n.body}
                    </Text>
                  </Card>
                ))}
              </>
            ) : null}

            {a.canCancel ? (
              <View className="mt-[28px]">
                <Button
                  label={busy ? 'Cancelling…' : 'Cancel Appointment'}
                  variant="glass"
                  textColor="#C4453F"
                  disabled={busy}
                  onPress={cancel}
                />
              </View>
            ) : a.status === 'booked' ? (
              <Text
                className="mt-[24px] text-center text-[13px]"
                style={{ color: PAGE.sub, lineHeight: 19 }}
              >
                {'Changes close 24 hours before an appointment.\nPlease call the clinic.'}
              </Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}
