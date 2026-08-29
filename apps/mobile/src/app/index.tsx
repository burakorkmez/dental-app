import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function Index() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Dental App</ThemedText>
      <ThemedText themeColor="textSecondary">Phase 0 — scaffold running.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
});
