import * as Sentry from '@sentry/react-native';
import { StatusBar } from 'expo-status-bar';
import { type SymbolViewProps } from 'expo-symbols';
import { Fragment, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';

import { Card, DetailRow, PAGE, PAGE_PAD, PageHeader, SectionLabel } from '@/components/ui';

/**
 * Structured-logging harness. Sibling of `sentry-test.tsx` — that screen sends
 * one error at a time to check the wiring; this one replays whole sessions so
 * the Logs view has something real to be queried against.
 *
 * Every row fires a BATCH, because a single log line proves nothing: the point
 * of structured logs is the query you run once there are thousands, and you
 * cannot demo a query against six rows. The volume rows at the bottom exist so
 * the answer is genuinely un-scrollable.
 *
 * Two rules hold everywhere below, and they are the same two the real call
 * sites follow (`lib/api.tsx`, `booking/confirm.tsx`):
 *
 *  1. Attributes are ids, counts, durations and enums. Never content. No name,
 *     no DOB, no medical field, no message body, no assistant prompt — the
 *     CLAUDE.md non-negotiable does not get an exception for a demo. The
 *     `beforeSendLog` in `_layout.tsx` is the second door.
 *  2. Every log carries `batch_id` and `scenario`, so one run can be isolated
 *     out of the pile with `batch_id:<id>`.
 *
 * Reached from Profile, behind `__DEV__`.
 */

type Batch = {
  icon: SymbolViewProps['name'];
  title: string;
  subtitle: string;
  /** Emits the logs and returns how many it sent. */
  run: (tag: Tag) => number;
};

/** Stamped onto every line in a run so the run can be filtered back out. */
type Tag = { batch_id: string; scenario: string };

const newBatchId = () => Math.random().toString(36).slice(2, 8);
const int = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];

// Opaque ids, the way the real API returns them. A dentist id is not PHI; a
// patient's name is, which is why nothing below is a name.
const DENTISTS = ['dnt_04a1', 'dnt_7b32', 'dnt_c910'] as const;
const SERVICES = ['cleaning', 'filling', 'whitening', 'root_canal', 'teleconsult'] as const;

const SCENARIOS: Batch[] = [
  {
    icon: 'checkmark.circle',
    title: 'Booking — happy path',
    subtitle: 'One patient books a cleaning. trace → info,\nthe baseline a broken run is compared to',
    run: (tag) => {
      const dentist = pick(DENTISTS);
      const lead = int(18, 96);
      Sentry.logger.trace('availability window expanded', { ...tag, days: 14 });
      Sentry.logger.debug('scheduling inputs loaded', {
        ...tag,
        dentist_count: 3,
        busy_intervals: int(8, 40),
        duration_ms: int(30, 90),
      });
      Sentry.logger.debug('slots computed', {
        ...tag,
        slot_count: int(20, 60),
        dentist_count: 3,
        duration_ms: int(4, 15),
      });
      Sentry.logger.info('slot selected', {
        ...tag,
        dentist_id: dentist,
        lead_time_hours: lead,
        service: 'cleaning',
      });
      Sentry.logger.debug('booking validated', { ...tag, duration_ms: int(40, 120) });
      Sentry.logger.info('appointment booked', {
        ...tag,
        dentist_id: dentist,
        lead_time_hours: lead,
        service: 'cleaning',
        is_teleconsult: false,
        for_dependent: false,
        attachments: 0,
        duration_ms: int(180, 420),
      });
      return 6;
    },
  },
  {
    icon: 'person.2.slash',
    title: 'Booking — lost the slot race',
    subtitle: 'Two patients, one slot. The Postgres exclusion\nconstraint firing, seen from the loser',
    run: (tag) => {
      const dentist = pick(DENTISTS);
      const lead = int(2, 20);
      Sentry.logger.info('slot selected', {
        ...tag,
        dentist_id: dentist,
        lead_time_hours: lead,
        service: 'filling',
      });
      Sentry.logger.debug('booking submitted', { ...tag, dentist_id: dentist });
      Sentry.logger.warn('booking lost the slot race', {
        ...tag,
        dentist_id: dentist,
        lead_time_hours: lead,
        error_code: 'slot_taken',
        status: 409,
        // The constraint, not application logic — that distinction is the
        // whole reason this is a 409 and not a double booking.
        rejected_by: 'exclusion_constraint',
        duration_ms: int(120, 300),
      });
      Sentry.logger.info('availability refetched after conflict', {
        ...tag,
        slot_count: int(3, 12),
      });
      return 4;
    },
  },
  {
    icon: 'bubble.left.and.text.bubble.right',
    title: 'Assistant session',
    subtitle: 'Three turns with tokens, cost and latency —\nand a triage short-circuit at the end',
    run: (tag) => {
      const conversation = `cnv_${newBatchId()}`;
      Sentry.logger.info('assistant thread opened', { ...tag, conversation_id: conversation });
      Sentry.logger.debug('history loaded', { ...tag, conversation_id: conversation, turns: 4 });

      let sent = 2;
      for (let turn = 1; turn <= 3; turn += 1) {
        const prompt = int(220, 900);
        const completion = int(90, 380);
        // Counts and cost, never the prompt or the reply — the patient's own
        // words about their own symptoms are exactly what stays inside.
        Sentry.logger.info('assistant turn completed', {
          ...tag,
          conversation_id: conversation,
          turn,
          model: 'gpt-4o-mini',
          prompt_tokens: prompt,
          completion_tokens: completion,
          cost_usd: Number(((prompt * 0.15 + completion * 0.6) / 1_000_000).toFixed(6)),
          duration_ms: int(900, 3200),
        });
        sent += 1;
      }

      // The one path that must never depend on the model being up.
      Sentry.logger.warn('emergency keywords matched, model bypassed', {
        ...tag,
        conversation_id: conversation,
        // What matched is not recorded. That it matched is the metric.
        rule: 'emergency_triage',
        served: 'static_reply',
      });
      return sent + 1;
    },
  },
  {
    icon: 'antenna.radiowaves.left.and.right.slash',
    title: 'Vendor degradation — Stream',
    subtitle: 'Chat slows, then drops, then a teleconsult\nfails to join. A cascade, not one error',
    run: (tag) => {
      const appointment = `apt_${newBatchId()}`;
      Sentry.logger.debug('stream token minted', { ...tag, ttl_seconds: 14400 });
      Sentry.logger.warn('stream connect slow', { ...tag, stage: 'socket', duration_ms: int(5200, 9000) });
      Sentry.logger.warn('stream unavailable, app running without messaging', {
        ...tag,
        stage: 'socket',
        reason: 'timeout',
        retries: 3,
      });
      Sentry.logger.error('teleconsult join failed', {
        ...tag,
        appointment_id: appointment,
        error_code: 'call_join_timeout',
        duration_ms: int(8000, 15000),
      });
      Sentry.logger.info('patient fell back to phone', { ...tag, appointment_id: appointment });
      return 5;
    },
  },
  {
    icon: 'trash.slash',
    title: 'Deletion left PHI behind',
    subtitle: 'Our rows are gone, the vendor copies are not.\nThe fatal here is worth an alert',
    run: (tag) => {
      Sentry.logger.info('account deletion requested', { ...tag, family_size: int(1, 4) });
      Sentry.logger.debug('imagekit folder deleted', { ...tag, folder: 'assistant' });
      // Best-effort cleanup that failed — invisible today, because the real
      // call sites in `api/me/route.ts` only `console.error` this.
      Sentry.logger.error('imagekit cleanup failed', {
        ...tag,
        folder: 'attachments',
        status: 500,
        orphaned: true,
      });
      Sentry.logger.error('stream cleanup failed', {
        ...tag,
        stage: 'delete_channels',
        channels: int(1, 3),
        orphaned: true,
      });
      Sentry.logger.info('database rows deleted', { ...tag, cascade_tables: 7 });
      Sentry.logger.info('clerk identity deleted', { ...tag });
      Sentry.logger.fatal('account deleted with vendor data orphaned', {
        ...tag,
        vendors: 'imagekit,stream',
        requires_manual_cleanup: true,
      });
      return 7;
    },
  },
  {
    icon: 'lock.shield',
    title: 'PHI scrub check',
    subtitle: 'Sets a name and an email on the user, then logs.\nConfirm both are gone in Sentry',
    run: (tag) => {
      // Seeded fake patient (PLAN.md A15). `beforeSend` does not run on logs,
      // so `beforeSendLog` in `_layout.tsx` is the only thing between this and
      // a patient name in Sentry. This row is the proof it works.
      Sentry.setUser({
        id: 'user_2xFAKEclerkid',
        email: 'not.a.real.patient@example.com',
        username: 'Jordan Reyes',
      });
      Sentry.logger.info('medical history opened', { ...tag, section: 'allergies' });
      return 1;
    },
  },
];

const VOLUME: Batch[] = [
  {
    icon: 'magnifyingglass',
    title: 'Needle in a haystack',
    subtitle: '150 routine lines with one fatal buried inside.\nScrolling will not find it — a query will',
    run: (tag) => {
      const total = 150;
      const needle = int(30, total - 20);
      for (let i = 0; i < total; i += 1) {
        if (i === needle) {
          Sentry.logger.fatal('token refresh failed, signing out', {
            ...tag,
            provider: 'clerk',
            session_age_minutes: int(240, 900),
          });
          continue;
        }
        // Deliberately dull. This is what production actually looks like.
        const noise = pick([
          () =>
            Sentry.logger.debug('slots computed', {
              ...tag,
              slot_count: int(0, 60),
              duration_ms: int(4, 20),
            }),
          () =>
            Sentry.logger.trace('availability window expanded', { ...tag, days: pick([7, 14, 30]) }),
          () => Sentry.logger.debug('stream token minted', { ...tag, ttl_seconds: 14400 }),
          () =>
            Sentry.logger.info('screen viewed', {
              ...tag,
              screen: pick(['home', 'booking', 'profile', 'appointments', 'assistant']),
            }),
          () =>
            Sentry.logger.debug('api request', {
              ...tag,
              path: pick(['/api/appointments', '/api/availability', '/api/me', '/api/services']),
              status: 200,
              duration_ms: int(40, 260),
            }),
        ]);
        noise();
      }
      return total;
    },
  },
  {
    icon: 'chart.bar',
    title: 'Morning rush — 60 bookings',
    subtitle: 'Mixed outcomes across 3 dentists. Enough rows\nto group by error_code or filter lead time',
    run: (tag) => {
      const total = 60;
      for (let i = 0; i < total; i += 1) {
        const dentist = pick(DENTISTS);
        const service = pick(SERVICES);
        const lead = int(1, 240);
        const roll = Math.random();

        if (roll < 0.72) {
          Sentry.logger.info('appointment booked', {
            ...tag,
            dentist_id: dentist,
            service,
            lead_time_hours: lead,
            is_teleconsult: service === 'teleconsult',
            for_dependent: Math.random() < 0.3,
            attachments: int(0, 3),
            duration_ms: int(150, 600),
          });
        } else if (roll < 0.88) {
          Sentry.logger.warn('booking lost the slot race', {
            ...tag,
            dentist_id: dentist,
            service,
            lead_time_hours: lead,
            error_code: 'slot_taken',
            status: 409,
            rejected_by: 'exclusion_constraint',
            duration_ms: int(120, 300),
          });
        } else if (roll < 0.96) {
          // The client asked for a time `/api/availability` never offered —
          // either the two engines drifted, or somebody is poking the API.
          Sentry.logger.warn('slot rejected as unbookable', {
            ...tag,
            dentist_id: dentist,
            service,
            lead_time_hours: lead,
            error_code: 'slot_invalid',
            status: 400,
          });
        } else {
          Sentry.logger.error('api request failed', {
            ...tag,
            path: '/api/appointments',
            method: 'POST',
            status: 500,
            error_code: 'unreachable',
            duration_ms: int(9000, 12000),
          });
        }
      }
      return total;
    },
  },
  {
    icon: 'tortoise',
    title: 'Slow availability queries',
    subtitle: '40 queries, a few of them awful. Filter on\nduration_ms to find the tail',
    run: (tag) => {
      const total = 40;
      for (let i = 0; i < total; i += 1) {
        // One in six is a cold, wide range — the tail worth alerting on.
        const slow = Math.random() < 0.17;
        const duration = slow ? int(2400, 6000) : int(40, 320);
        const slots = slow ? int(0, 4) : int(12, 70);
        const attrs = {
          ...tag,
          days: slow ? 30 : pick([1, 7, 14]),
          dentist_count: int(1, 3),
          slot_count: slots,
          duration_ms: duration,
          // A zero-slot answer is the "nothing available" screen nobody sees.
          empty: slots === 0,
        };
        if (slow) Sentry.logger.warn('availability computed', attrs);
        else Sentry.logger.debug('availability computed', attrs);
      }
      return total;
    },
  },
];

export default function SentryLogs() {
  const [busy, setBusy] = useState<string | null>(null);
  const [last, setLast] = useState<{ id: string; scenario: string; count: number } | null>(null);
  const [total, setTotal] = useState(0);

  const press = async (b: Batch) => {
    if (busy) return;
    setBusy(b.title);
    const tag: Tag = { batch_id: newBatchId(), scenario: b.title };
    try {
      const count = b.run(tag);
      // Logs are buffered and flushed on a timer. On camera that wait is dead
      // air, so force it — and it also proves the batch left the device.
      // The RN `flush()` takes no timeout, unlike the browser and node ones.
      await Sentry.flush();
      setLast({ id: tag.batch_id, scenario: b.title, count });
      setTotal((n) => n + count);
    } catch (err) {
      Alert.alert('Batch failed to run', String(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <View collapsable={false} style={{ flex: 1, backgroundColor: PAGE.bg }}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ paddingTop: 76, paddingHorizontal: PAGE_PAD, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader title="Sentry Logs" subtitle="Replay real sessions, then query them" />

        {process.env.EXPO_PUBLIC_SENTRY_DSN ? null : (
          <Card style={{ marginTop: 24, borderColor: '#F3C9C4', backgroundColor: '#FEF4F3' }}>
            <View className="px-[17px] py-[16px]">
              <Text className="text-[14px] font-bold" style={{ color: '#B3261E' }}>
                Sentry is disabled
              </Text>
              <Text className="mt-[5px] text-[13px]" style={{ color: '#8A5A55', lineHeight: 19 }}>
                EXPO_PUBLIC_SENTRY_DSN is empty. Set it in apps/mobile/.env and restart the
                bundler — every button below is a no-op until then.
              </Text>
            </View>
          </Card>
        )}

        {([['Scenarios', SCENARIOS], ['Volume', VOLUME]] as const).map(([section, rows]) => (
          <Fragment key={section}>
            <SectionLabel style={{ marginTop: 28, marginBottom: 12 }}>{section}</SectionLabel>
            <Card>
              {rows.map((b, i) => (
                <Fragment key={b.title}>
                  {i > 0 ? (
                    <View
                      className="ml-[17px] mr-[17px] h-px"
                      style={{ backgroundColor: PAGE.sep }}
                    />
                  ) : null}
                  <DetailRow
                    icon={b.icon}
                    title={b.title}
                    subtitle={b.subtitle}
                    onPress={() => void press(b)}
                    trailing={
                      busy === b.title ? <ActivityIndicator size="small" color={PAGE.icon} /> : undefined
                    }
                  />
                </Fragment>
              ))}
            </Card>
          </Fragment>
        ))}

        <Card style={{ marginTop: 16 }}>
          <View className="px-[17px] py-[16px]">
            <Text className="text-[12.5px] font-bold" style={{ color: PAGE.label }}>
              LAST BATCH
            </Text>
            <Text className="mt-[6px] text-[13px]" style={{ color: PAGE.navy }}>
              {last ? `batch_id:${last.id}` : '—'}
            </Text>
            <Text className="mt-[4px] text-[13px]" style={{ color: PAGE.sub }}>
              {last ? `${last.scenario} · ${last.count} logs` : ' '}
            </Text>

            <Text className="mt-[16px] text-[12.5px] font-bold" style={{ color: PAGE.label }}>
              SENT THIS SESSION
            </Text>
            <Text className="mt-[6px] text-[13px]" style={{ color: PAGE.navy }}>
              {total} logs
            </Text>

            <Text className="mt-[16px] text-[12.5px]" style={{ color: PAGE.sub, lineHeight: 18 }}>
              Paste the batch_id into the Logs search bar to isolate one run. Every line also
              carries a scenario, so `scenario:&quot;Morning rush — 60 bookings&quot;` pulls back a
              whole rush across runs.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
