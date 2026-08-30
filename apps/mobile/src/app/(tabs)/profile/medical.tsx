import { StatusBar } from 'expo-status-bar';
import { type SymbolViewProps } from 'expo-symbols';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { Card, DetailRow, PAGE, PAGE_PAD, PageHeader, SectionLabel } from '@/components/ui';
import { useApi, useMe, type Appointment, type MedicalHistory as History } from '@/lib/api';

/**
 * The patient's own record. A patient reading their own history is not audited
 * — only staff reads are, and those go through the dashboard.
 *
 * An empty list is shown as "None reported" only when the intake was actually
 * filled in; a skipped intake has no row at all and says so, because "not
 * asked" and "no allergies" are not the same answer.
 */
const list = (values: string[] | undefined, empty: string) =>
  values && values.length ? values.join(', ') : empty;

export default function MedicalHistory() {
  const { me } = useMe();
  const self = me?.self;

  const { data, loading } = useApi<{ medicalHistory: History | null }>(
    self ? `/api/patients/${self.id}/medical-history` : null
  );
  const { data: past } = useApi<{ appointments: Appointment[] }>('/api/appointments?scope=past');

  const history = data?.medicalHistory;
  const missing = !loading && !history;
  const procedures = (past?.appointments ?? []).filter((a) => a.status === 'completed').length;

  const rows: { icon: SymbolViewProps['name']; title: string; subtitle: string }[] = [
    {
      icon: 'allergens',
      title: 'Allergies',
      subtitle: missing ? 'Not provided yet' : list(history?.allergies, 'No known allergies'),
    },
    {
      icon: 'heart.text.square',
      title: 'Medical Conditions',
      subtitle: missing ? 'Not provided yet' : list(history?.conditions, 'None reported'),
    },
    {
      icon: 'cross.case',
      title: 'Medications',
      subtitle: missing ? 'Not provided yet' : list(history?.medications, 'None reported'),
    },
    {
      icon: 'bandage',
      title: 'Past Procedures',
      subtitle: procedures === 1 ? '1 procedure' : `${procedures} procedures`,
    },
  ];

  return (
    <View collapsable={false} style={{ flex: 1, backgroundColor: PAGE.bg }}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ paddingTop: 76, paddingHorizontal: PAGE_PAD, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader title="Medical History" subtitle="View your medical records and history" />

        <SectionLabel style={{ marginTop: 19 }}>Dental History</SectionLabel>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={PAGE.icon} />
        ) : (
          <>
            {rows.map((h, i) => (
              <Card key={h.title} style={{ marginTop: i === 0 ? 12 : 9 }}>
                <DetailRow {...h} />
              </Card>
            ))}

            {history?.notes ? (
              <>
                <SectionLabel style={{ marginTop: 26 }}>Your notes</SectionLabel>
                <Card style={{ marginTop: 10 }}>
                  <Text
                    className="px-[17px] py-[18px] text-[13px]"
                    style={{ color: PAGE.navy, lineHeight: 19 }}
                  >
                    {history.notes}
                  </Text>
                </Card>
              </>
            ) : null}

            {missing ? (
              <Text
                className="mt-[24px] text-center text-[13px]"
                style={{ color: PAGE.sub, lineHeight: 19 }}
              >
                {'You skipped the medical intake.\nThe clinic will ask before your first visit.'}
              </Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}
