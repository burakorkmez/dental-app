import { DefaultTheme, Redirect, ThemeProvider } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useMe } from '@/lib/api';

export default function TabsLayout() {
  const { me } = useMe();
  // Role comes from Clerk publicMetadata, mirrored onto users.role and served
  // by /api/me. Staff run the same binary as patients; only the tabs differ.
  const isStaff = me?.role === 'staff' || me?.role === 'dentist';

  // One gate for every tab: a half-onboarded patient has no `self` record, so
  // each screen underneath would otherwise render empty fields and no-op saves.
  // Staff never onboard — they have no patient row and never will.
  if (me && !isStaff && !me.hasOnboarded) return <Redirect href="/onboarding/step1" />;

  return (
    <ThemeProvider value={DefaultTheme}>
      <NativeTabs tintColor="#159FC6" labelStyle={{ color: '#5D7C93' }}>
        {/* Booking and the patient's own schedule are patient surfaces; staff
            run the clinic's calendar from the web dashboard. */}
        <NativeTabs.Trigger name="home" hidden={isStaff} disableAutomaticContentInsets>
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="appointments" hidden={isStaff} disableAutomaticContentInsets>
          <NativeTabs.Trigger.Label>Appointments</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'calendar', selected: 'calendar' }}
            md="calendar_month"
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="messages">
          <NativeTabs.Trigger.Label>{isStaff ? 'Inbox' : 'Messages'}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'message', selected: 'message.fill' }}
            md="chat_bubble"
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile" disableAutomaticContentInsets>
          <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'person', selected: 'person.fill' }}
            md="person"
          />
        </NativeTabs.Trigger>
      </NativeTabs>
    </ThemeProvider>
  );
}
