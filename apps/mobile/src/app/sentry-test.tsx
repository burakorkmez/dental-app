import * as Sentry from '@sentry/react-native';
import { StatusBar } from 'expo-status-bar';
import { type SymbolViewProps } from 'expo-symbols';
import { Fragment, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { Card, DetailRow, PAGE, PAGE_PAD, PageHeader, SectionLabel } from '@/components/ui';
import { useApiClient } from '@/lib/api';

/**
 * Dev-only harness for the Sentry wiring in `_layout.tsx`. Each row throws a
 * different shape of failure so the dashboard can be checked against a real
 * event rather than a guess: grouping, stack frames (source maps), breadcrumbs,
 * tags, and — the one that matters here — whether `beforeSend` actually stripped
 * the patient data before the event left the device (PLAN.md §5 HIPAA spot-check).
 *
 * Reached from Profile, behind `__DEV__`. Drop that guard to test a release build.
 */

type Test = {
  icon: SymbolViewProps['name'];
  title: string;
  subtitle: string;
  /** Returns the Sentry event id when there is one to show. */
  run: () => Promise<string | void> | string | void;
  /** Kills the app, so it asks first. */
  destructive?: boolean;
};

export default function SentryTest() {
  const api = useApiClient();
  const [last, setLast] = useState<string | null>(null);
  const [crashRender, setCrashRender] = useState(false);

  // Not a top-level export in the RN SDK — it hangs off the integration.
  const replayId = Sentry.getClient()
    ?.getIntegrationByName<{ name: string; getReplayId: () => string | null }>('MobileReplay')
    ?.getReplayId();

  // Caught by the ErrorBoundary inside `Sentry.wrap()` — the closest thing to a
  // real screen blowing up on bad data from the API.
  if (crashRender) {
    throw new Error('Appointment detail crashed: cannot read startsAt of undefined');
  }

  const logTests: Test[] = [
    {
      icon: 'list.bullet.rectangle',
      title: 'One log per level',
      subtitle: 'trace → fatal, so Logs can be filtered\nby severity end to end',
      run: () => {
        Sentry.logger.trace('availability window expanded', { days: 14 });
        Sentry.logger.debug('slots returned', { count: 37, dentist_count: 3 });
        Sentry.logger.info('appointment booked', { lead_time_hours: 26, for_dependent: false });
        Sentry.logger.warn('stream unavailable, app running without messaging', {
          stage: 'socket',
          reason: 'timeout',
        });
        Sentry.logger.error('api request failed', {
          path: '/api/appointments',
          method: 'POST',
          status: 409,
          error_code: 'slot_taken',
        });
        Sentry.logger.fatal('token refresh failed, signing out', { provider: 'clerk' });
      },
    },
    {
      icon: 'text.magnifyingglass',
      title: 'Templated log',
      subtitle: 'logger.fmt — the parameters become\nsearchable columns in Logs',
      run: () => {
        const status = 409;
        Sentry.logger.warn(Sentry.logger.fmt`booking rejected with status ${status}`);
      },
    },
    {
      icon: 'lock.shield',
      title: 'Log PHI scrub check',
      subtitle: 'Logs auto-carry user.name/email —\nconfirm beforeSendLog strips both',
      run: () => {
        // Fake patient (A15). `beforeSend` does not run on logs, which is why
        // `beforeSendLog` exists — this is the row that proves it works.
        Sentry.setUser({
          id: 'user_2xFAKEclerkid',
          email: 'not.a.real.patient@example.com',
          username: 'Jordan Reyes',
        });
        Sentry.logger.info('medical history opened');
      },
    },
  ];

  const tests: Test[] = [
    {
      icon: 'exclamationmark.bubble',
      title: 'Handled exception',
      subtitle: 'try/catch → captureException, with tags\nand a breadcrumb trail',
      run: () => {
        Sentry.addBreadcrumb({ category: 'booking', message: 'slot selected', level: 'info' });
        Sentry.addBreadcrumb({ category: 'booking', message: 'confirm pressed', level: 'info' });
        return Sentry.withScope((scope) => {
          scope.setTag('feature', 'booking');
          scope.setTag('api_code', 'slot_taken');
          scope.setLevel('error');
          return Sentry.captureException(new Error('Booking failed: that time was just taken'));
        });
      },
    },
    {
      icon: 'wifi.exclamationmark',
      title: 'Failed API call',
      subtitle: 'A real request through the real client,\nreported the way a screen would',
      run: async () => {
        try {
          await api('/api/appointments/00000000-0000-0000-0000-000000000000');
        } catch (err) {
          return Sentry.withScope((scope) => {
            scope.setTag('feature', 'appointments');
            scope.setContext('request', {
              path: '/api/appointments/:id',
              base: process.env.EXPO_PUBLIC_API_URL,
            });
            return Sentry.captureException(err);
          });
        }
        Alert.alert('No error', 'The API answered 200 — nothing was sent to Sentry.');
      },
    },
    {
      icon: 'text.bubble',
      title: 'Warning message',
      subtitle: 'captureMessage at warning level — no\nstack, groups on the text',
      run: () => Sentry.captureMessage('Stream chat connect took over 5s', 'warning'),
    },
    {
      icon: 'hourglass',
      title: 'Unhandled promise rejection',
      subtitle: 'No catch anywhere. Sentry picks it up\nfrom the global handler',
      run: () => {
        Promise.reject(new Error('Stream token refresh rejected with no handler'));
      },
    },
    {
      icon: 'bolt',
      title: 'Unhandled JS error',
      subtitle: 'Thrown outside React, off the call\nstack — global error handler',
      run: () => {
        setTimeout(() => {
          throw new Error('Reminder poll threw outside the render tree');
        }, 0);
      },
    },
    {
      icon: 'lock.shield',
      title: 'PHI scrub check',
      subtitle: 'Loads a fake patient the way a screen\ndoes, then throws. See what survived',
      run: () => {
        // Fake patient — the seeded kind (A15). Never run this with real data.
        Sentry.setUser({
          id: 'user_2xFAKEclerkid',
          email: 'not.a.real.patient@example.com',
          username: 'Jordan Reyes',
        });
        Sentry.setContext('patient', {
          name: 'Jordan Reyes',
          dateOfBirth: '1988-04-02',
          allergies: ['penicillin'],
        });
        Sentry.addBreadcrumb({ category: 'ui', message: 'opened medical history', level: 'info' });
        return Sentry.captureException(new Error('Medical history failed to render'));
      },
    },
    {
      icon: 'xmark.octagon',
      title: 'Render crash',
      subtitle: 'Throws during render. Caught by the\nErrorBoundary in Sentry.wrap()',
      run: () => setCrashRender(true),
      destructive: true,
    },
    {
      icon: 'iphone.slash',
      title: 'Native crash',
      subtitle: 'Hard crash. The app dies and reports\non next launch — not in Expo Go',
      run: () => Sentry.nativeCrash(),
      destructive: true,
    },
  ];

  const press = (t: Test) => {
    const go = async () => {
      try {
        const id = await t.run();
        if (typeof id === 'string') setLast(id);
      } catch (err) {
        Alert.alert('Test failed to run', String(err));
      }
    };
    if (!t.destructive) return void go();
    Alert.alert(t.title, 'This ends the current session. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Do it', style: 'destructive', onPress: () => void go() },
    ]);
  };

  return (
    <View collapsable={false} style={{ flex: 1, backgroundColor: PAGE.bg }}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ paddingTop: 76, paddingHorizontal: PAGE_PAD, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader title="Sentry Test" subtitle="Send sample errors and check the dashboard" />

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

        {([['Errors', tests], ['Logs', logTests]] as const).map(([section, rows]) => (
          <Fragment key={section}>
            <SectionLabel style={{ marginTop: 28, marginBottom: 12 }}>{section}</SectionLabel>
            <Card>
              {rows.map((t, i) => (
                <Fragment key={t.title}>
                  {i > 0 ? (
                    <View
                      className="ml-[17px] mr-[17px] h-px"
                      style={{ backgroundColor: PAGE.sep }}
                    />
                  ) : null}
                  <DetailRow
                    icon={t.icon}
                    title={t.title}
                    subtitle={t.subtitle}
                    onPress={() => press(t)}
                  />
                </Fragment>
              ))}
            </Card>
          </Fragment>
        ))}

        <Card style={{ marginTop: 16 }}>
          <View className="px-[17px] py-[16px]">
            <Text className="text-[12.5px] font-bold" style={{ color: PAGE.label }}>
              LAST EVENT ID
            </Text>
            <Text className="mt-[6px] text-[13px]" style={{ color: PAGE.navy }}>
              {last ?? '—'}
            </Text>
            <Text className="mt-[16px] text-[12.5px] font-bold" style={{ color: PAGE.label }}>
              REPLAY ID
            </Text>
            <Text className="mt-[6px] text-[13px]" style={{ color: PAGE.navy }}>
              {replayId ?? '—'}
            </Text>
            <Text className="mt-[10px] text-[12.5px]" style={{ color: PAGE.sub, lineHeight: 18 }}>
              Paste either into the Sentry search bar to jump straight to the event or the replay.
              Crashes report on the next launch, so they have no event id here.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
