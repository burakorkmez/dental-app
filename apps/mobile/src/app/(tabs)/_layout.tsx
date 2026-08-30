import { DefaultTheme, ThemeProvider } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabsLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <NativeTabs tintColor="#159FC6" labelStyle={{ color: '#5D7C93' }}>
        <NativeTabs.Trigger name="home" disableAutomaticContentInsets>
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="appointments" disableAutomaticContentInsets>
          <NativeTabs.Trigger.Label>Appointments</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'calendar', selected: 'calendar' }}
            md="calendar_month"
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="messages">
          <NativeTabs.Trigger.Label>Messages</NativeTabs.Trigger.Label>
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
