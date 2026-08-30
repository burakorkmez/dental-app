import { StatusBar } from 'expo-status-bar';
import { type SymbolViewProps } from 'expo-symbols';
import { ScrollView, View } from 'react-native';

import { Card, DetailRow, PAGE, PAGE_PAD, PageHeader, SectionLabel } from '@/components/ui';

const HISTORY: { icon: SymbolViewProps['name']; title: string; subtitle: string }[] = [
  { icon: 'allergens', title: 'Allergies', subtitle: 'No known allergies' },
  { icon: 'heart.text.square', title: 'Medical Conditions', subtitle: 'None reported' },
  { icon: 'cross.case', title: 'Medications', subtitle: 'None reported' },
  { icon: 'bandage', title: 'Past Procedures', subtitle: '2 procedures' },
  { icon: 'photo', title: 'X-Rays & Images', subtitle: '5 images' },
];

export default function MedicalHistory() {
  return (
    <View collapsable={false} style={{ flex: 1, backgroundColor: PAGE.bg }}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ paddingTop: 76, paddingHorizontal: PAGE_PAD, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader title="Medical History" subtitle="View your medical records and history" />

        <SectionLabel style={{ marginTop: 19 }}>Dental History</SectionLabel>

        {HISTORY.map((h, i) => (
          <Card key={h.title} style={{ marginTop: i === 0 ? 12 : 9 }}>
            <DetailRow {...h} onPress={() => {}} />
          </Card>
        ))}

        <Card style={{ marginTop: 33 }}>
          <DetailRow
            icon="list.clipboard"
            title="Full Medical Records"
            subtitle={'View your complete medical\nrecords and reports'}
            onPress={() => {}}
          />
        </Card>
      </ScrollView>
    </View>
  );
}
