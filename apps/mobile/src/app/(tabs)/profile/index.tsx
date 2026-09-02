import { useAuth } from '@clerk/expo';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Fragment, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { AQUA_BODY, useAvatar } from '@/components/ui';
import { useApiClient, useMe } from '@/lib/api';

const C = {
  page: '#EEF5FA',
  card: '#F7FBFE',
  navy: '#0B2E4E',
  ink: '#0F3457',
  sub: '#4E6B85',
  teal: '#0F6E86',
  icon: '#10A0AE',
  chevron: '#3E5C7D',
  border: '#E1EEF9',
  sep: '#E4EDF5',
  pill: '#DEF4F8',
  pillInk: '#128799',
  red: '#F2564F',
  redCard: '#FDF6F6',
  redBorder: '#FBE7E8',
};

const CARD_SHADOW = {
  shadowColor: '#075A92',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.1,
  shadowRadius: 16,
} as const;

/** SF has no heart-with-pulse, so stack the two symbols the design draws. */
function HeartPulse() {
  return (
    <View className="h-[26px] w-[28px] items-center justify-center">
      <SymbolView name="heart" size={26} weight="medium" tintColor={C.icon} />
      <SymbolView
        name="waveform.path.ecg"
        size={13}
        weight="medium"
        tintColor={C.icon}
        style={{ position: 'absolute', top: 8 }}
      />
    </View>
  );
}

const icon = (name: SymbolViewProps['name'], tint = C.icon) => (
  <SymbolView name={name} size={24} weight="medium" tintColor={tint} style={{ width: 28 }} />
);

const MENU: { icon: ReactNode; label: string; href?: Href }[] = [
  { icon: icon('person'), label: 'Personal Details', href: '/profile/personal' },
  { icon: <HeartPulse />, label: 'Medical History', href: '/profile/medical' },
  { icon: icon('person.3'), label: 'Family Members' },
  { icon: icon('bell'), label: 'Notifications', href: '/profile/notifications' },
  { icon: icon('lock.shield'), label: 'Privacy & Data' },
  { icon: icon('headphones'), label: 'Help & Support' },
  // Dev-only: fires sample errors and log batches at Sentry so the dashboard
  // can be checked against real data rather than a guess.
  ...(__DEV__
    ? [
        { icon: icon('ladybug'), label: 'Sentry Test', href: '/sentry-test' as Href },
        { icon: icon('list.bullet.rectangle'), label: 'Sentry Logs', href: '/sentry-logs' as Href },
      ]
    : []),
];

export default function Profile() {
  const { me } = useMe();
  const avatar = useAvatar();
  const { signOut } = useAuth();
  const call = useApiClient();
  const [deleting, setDeleting] = useState(false);
  const self = me?.self;

  /**
   * Deletion is irreversible and takes the family's records with it, so it asks
   * twice: once for intent, once to confirm what actually goes.
   *
   * Sign-out comes AFTER the request, not before — the call needs the session
   * token, and by the time it returns the Clerk user is gone and the session is
   * already void. `signOut()` is what clears it from the device.
   */
  const onDelete = () => {
    if (deleting) return;
    Alert.alert(
      'Delete account?',
      self
        ? `This permanently deletes your profile, medical history, appointments and messages${
            (me?.family.length ?? 0) > 1 ? ', along with every family member on this account' : ''
          }. It cannot be undone.`
        : 'This permanently deletes your account. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await call('/api/me', { method: 'DELETE' });
              await signOut();
            } catch (err) {
              setDeleting(false);
              Alert.alert(
                'Could not delete your account',
                err instanceof Error ? err.message : 'Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View collapsable={false} style={{ flex: 1, backgroundColor: C.page }}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ paddingTop: 73, paddingHorizontal: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* header */}
        <View className="flex-row items-center px-[10px]">
          <Text className="flex-1 text-[26px] font-bold" style={{ color: C.navy }}>
            My Profile
          </Text>
          <SymbolView name="gearshape" size={27} weight="medium" tintColor={C.navy} />
        </View>

        {/* identity card */}
        <View
          className="mt-[28px] h-[181px] flex-row items-center overflow-hidden rounded-[28px] px-[22px]"
          style={[{ backgroundColor: C.card, borderWidth: 1, borderColor: C.border }, CARD_SHADOW]}
        >
          <Image
            source={require('@/assets/images/profile-tooth.png')}
            style={{ position: 'absolute', right: 2, bottom: 6, width: 116, height: 160 }}
            contentFit="contain"
          />

          {/* avatar + camera badge */}
          <View className="h-[112px] w-[112px] items-center justify-center">
            <View
              className="absolute h-[112px] w-[112px] rounded-full"
              style={{ borderWidth: 1.5, borderColor: '#8FD9EC' }}
            />
            <Image
              source={avatar}
              style={{ width: 96, height: 96, borderRadius: 48, transform: [{ scale: 1.12 }] }}
              contentFit="cover"
            />
            <LinearGradient
              colors={AQUA_BODY}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{
                position: 'absolute',
                right: -2,
                bottom: 5,
                height: 33,
                width: 33,
                borderRadius: 17,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SymbolView name="camera.fill" size={16} tintColor="#FFFFFF" />
            </LinearGradient>
          </View>

          <View className="ml-[16px] mr-[72px] flex-1" style={{ marginTop: 10 }}>
            <Text numberOfLines={1} className="text-[19.5px] font-bold" style={{ color: C.navy }}>
              {self ? `${self.firstName} ${self.lastName}` : '—'}
            </Text>
            <Text numberOfLines={1} className="mt-[10px] text-[13.5px]" style={{ color: C.sub }}>
              {me?.email ?? ''}
            </Text>
            <Text className="mt-[9px] text-[15px]" style={{ color: C.teal }}>
              {self?.phone ?? 'No phone number'}
            </Text>
            <View
              className="mt-[11px] h-[28px] flex-row items-center self-start rounded-[14px] pl-[11px] pr-[15px]"
              style={{ backgroundColor: C.pill }}
            >
              <SymbolView name="person.fill" size={14} tintColor={C.pillInk} />
              <Text className="ml-[8px] text-[13px]" style={{ color: C.pillInk }}>
                Primary account
              </Text>
            </View>
          </View>
        </View>

        {/* menu */}
        <View
          className="mt-[30px] overflow-hidden rounded-[28px]"
          style={[{ backgroundColor: C.card, borderWidth: 1, borderColor: C.border }, CARD_SHADOW]}
        >
          {MENU.map((m, i) => (
            <Fragment key={m.label}>
              {i > 0 ? (
                <View className="ml-[15px] mr-[13px] h-px" style={{ backgroundColor: C.sep }} />
              ) : null}
              <Pressable
                onPress={() => m.href && router.push(m.href)}
                className="h-[60px] flex-row items-center px-[22px]"
              >
                {m.icon}
                <Text className="ml-[15px] flex-1 text-[15.5px]" style={{ color: C.ink }}>
                  {m.label}
                </Text>
                <SymbolView name="chevron.right" size={19} weight="medium" tintColor={C.chevron} />
              </Pressable>
            </Fragment>
          ))}
        </View>

        {/* delete */}
        <Pressable
          onPress={onDelete}
          disabled={deleting}
          className="mt-[16px] h-[57px] flex-row items-center rounded-[22px] px-[22px]"
          style={{
            backgroundColor: C.redCard,
            borderWidth: 1,
            borderColor: C.redBorder,
            opacity: deleting ? 0.6 : 1,
          }}
        >
          {icon('trash', C.red)}
          <Text className="ml-[15px] flex-1 text-[15.5px]" style={{ color: C.red }}>
            {deleting ? 'Deleting account…' : 'Delete Account'}
          </Text>
          {deleting ? (
            <ActivityIndicator size="small" color={C.red} />
          ) : (
            <SymbolView name="chevron.right" size={19} weight="medium" tintColor={C.red} />
          )}
        </Pressable>

        {/* sign out */}
        <Pressable
          onPress={() => signOut()}
          disabled={deleting}
          className="mt-[20px] flex-row items-center justify-center"
        >
          <SymbolView
            name="rectangle.portrait.and.arrow.right"
            size={20}
            weight="medium"
            tintColor={C.pillInk}
            style={{ marginRight: 10 }}
          />
          <Text className="text-[15.5px] font-medium" style={{ color: C.pillInk }}>
            Sign Out
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
