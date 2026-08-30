import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Chip,
  draft,
  Label,
  PrimaryButton,
  resetDraft,
  SHADOW,
  StepHeader,
  T,
} from '@/components/onboarding';
import { useApiClient, useMe, type Patient } from '@/lib/api';

const TIMES = ['Morning', 'Afternoon', 'Evening'];
// ponytail: tapping the row cycles the options — a real picker can wait.
const SOURCES = ['Friend / Family', 'Google search', 'Insurance', 'Instagram', 'Other'];

export default function Step4() {
  const insets = useSafeAreaInsets();
  const call = useApiClient();
  const { refresh } = useMe();
  const [time, setTime] = useState(draft.preferredTime);
  const [heardAbout, setHeardAbout] = useState(draft.heardAbout);
  const [extraNotes, setExtraNotes] = useState(draft.extraNotes);
  const [saving, setSaving] = useState(false);

  /**
   * The whole draft lands here in two calls: the profile, then the medical
   * history if step 2 was actually filled in. `refresh()` before navigating so
   * home sees `hasOnboarded` and doesn't bounce straight back.
   */
  const onFinish = async () => {
    if (saving) return;
    Object.assign(draft, { preferredTime: time, heardAbout, extraNotes });
    setSaving(true);
    try {
      const { patient } = await call<{ patient: Patient }>('/api/patients', {
        method: 'POST',
        body: {
          isSelf: true,
          firstName: draft.firstName.trim(),
          lastName: draft.lastName.trim(),
          dateOfBirth: draft.dob || null,
          phone: draft.phone.trim() || null,
          gender: draft.gender,
          primaryConcern:
            draft.services.map((s) => s.name).join(', ').slice(0, 120) || null,
          referralSource: draft.heardAbout,
        },
      });

      if (draft.medicalDone) {
        await call(`/api/patients/${patient.id}/medical-history`, {
          method: 'PUT',
          body: {
            allergies: draft.allergies,
            medications: draft.medications,
            conditions: [],
            isSmoker: draft.smokes,
            isPregnant: draft.pregnant,
            anxietyLevel: draft.anxiety,
            notes: [draft.notes, draft.extraNotes].map((n) => n.trim()).filter(Boolean).join('\n\n') || null,
          },
        });
      }

      resetDraft();
      await refresh();
      router.replace('/home');
    } catch (err) {
      Alert.alert(
        'Could not save your profile',
        err instanceof Error ? err.message : 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: '#EAF4FC' }}>
      <StatusBar style="dark" />
      <Image
        source={require('@/assets/images/onboarding-bg.png')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: 30 }}
        className="px-[22px]"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <StepHeader step={4} skip onSkip={onFinish} />

        <Text className="mt-[24px] text-[31px] font-bold" style={{ color: T.headline }}>
          Almost done!
        </Text>
        <Text className="mt-[8px] text-[17px]" style={{ color: T.secondary }}>
          A few more preferences.
        </Text>

        <View className="mt-[24px]">
          <Label>Preferred appointment time</Label>
          <View className="flex-row" style={{ gap: 12 }}>
            {TIMES.map((t) => (
              <Chip
                key={t}
                label={t}
                grow
                selected={time === t}
                onPress={() => setTime(t)}
              />
            ))}
          </View>
        </View>

        <View className="mt-[26px]">
          <Label>How did you hear about us?</Label>
          <Pressable
            onPress={() =>
              setHeardAbout(SOURCES[(SOURCES.indexOf(heardAbout) + 1) % SOURCES.length])
            }
            className="h-[62px] flex-row items-center justify-between rounded-[18px] px-[20px]"
            style={[{ backgroundColor: T.surface, borderWidth: 1, borderColor: T.border }, SHADOW]}
          >
            <Text className="text-[17px]" style={{ color: T.headline }}>
              {heardAbout}
            </Text>
            <SymbolView name="chevron.down" size={18} tintColor={T.secondary} />
          </Pressable>
        </View>

        <View className="mt-[26px]">
          <Label>Anything else we should know?</Label>
          <View
            className="h-[128px] rounded-[20px] px-[18px] pt-[14px]"
            style={{ backgroundColor: T.surface, borderWidth: 1, borderColor: T.border }}
          >
            <TextInput
              value={extraNotes}
              onChangeText={setExtraNotes}
              maxLength={500}
              multiline
              placeholder="Type here..."
              placeholderTextColor={T.placeholder}
              className="flex-1 text-[17px]"
              style={{ color: T.navy }}
            />
          </View>
        </View>

        <View
          className="mt-[24px] flex-row items-center rounded-[20px] px-[18px] py-[18px]"
          style={{ backgroundColor: '#E7F2FC', borderWidth: 1, borderColor: '#CFE4F5' }}
        >
          <SymbolView name="lock.shield" size={38} tintColor="#2E9BE0" />
          <Text className="ml-[16px] flex-1 text-[16px]" style={{ color: T.link, lineHeight: 23 }}>
            Your information is private and secure. You can update it anytime.
          </Text>
        </View>

        <View className="mt-[26px]">
          <PrimaryButton
            label={saving ? 'Saving…' : 'Finish'}
            arrow
            disabled={saving}
            onPress={onFinish}
          />
        </View>
      </ScrollView>
    </View>
  );
}
