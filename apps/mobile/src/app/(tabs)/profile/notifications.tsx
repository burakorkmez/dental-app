import { StatusBar } from 'expo-status-bar';
import { type SymbolViewProps } from 'expo-symbols';
import { Fragment, useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';

import { Card, DetailRow, PAGE, PAGE_PAD, PageHeader, UI } from '@/components/ui';

const PREFS: { key: string; icon: SymbolViewProps['name']; title: string; subtitle: string; on: boolean }[] = [
  {
    key: 'appointments',
    icon: 'bell.badge',
    title: 'Appointment Reminders',
    subtitle: 'Get reminded about upcoming\nappointments',
    on: true,
  },
  {
    key: 'treatments',
    icon: 'exclamationmark.shield',
    title: 'Treatment Reminders',
    subtitle: 'Reminders for pending\ntreatments',
    on: true,
  },
  {
    key: 'promotions',
    icon: 'tag',
    title: 'Promotions & Offers',
    subtitle: 'Special offers and promotions',
    on: true,
  },
  {
    key: 'billing',
    icon: 'creditcard',
    title: 'Billing & Payments',
    subtitle: 'Payment updates and\nbilling notifications',
    on: true,
  },
  {
    key: 'updates',
    icon: 'arrow.triangle.2.circlepath',
    title: 'App Updates',
    subtitle: 'New features and app updates',
    on: false,
  },
  {
    key: 'marketing',
    icon: 'envelope',
    title: 'Marketing Emails',
    subtitle: 'Newsletters and marketing\ncommunications',
    on: false,
  },
];

export default function Notifications() {
  const [on, setOn] = useState(() => Object.fromEntries(PREFS.map((p) => [p.key, p.on])));

  return (
    <View collapsable={false} style={{ flex: 1, backgroundColor: PAGE.bg }}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ paddingTop: 76, paddingHorizontal: PAGE_PAD, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader title="Notifications" subtitle="Manage your notification preferences" />

        <Card style={{ marginTop: 31 }}>
          {PREFS.map((p, i) => (
            <Fragment key={p.key}>
              {i > 0 ? (
                <View className="ml-[17px] mr-[17px] h-px" style={{ backgroundColor: PAGE.sep }} />
              ) : null}
              <DetailRow
                icon={p.icon}
                title={p.title}
                subtitle={p.subtitle}
                trailing={
                  <Switch
                    value={on[p.key]}
                    onValueChange={(v) => setOn((s) => ({ ...s, [p.key]: v }))}
                    trackColor={{ true: UI.aquaTo, false: '#DFE7EE' }}
                    style={{ transform: [{ scale: 0.9 }] }}
                  />
                }
              />
            </Fragment>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}
