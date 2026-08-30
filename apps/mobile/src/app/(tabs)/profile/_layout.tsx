import { Stack } from 'expo-router';

// A stack inside the tab so the detail screens keep the tab bar (design/profile-detail-screen-design.png).
export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#EEF5FA' } }} />
  );
}
