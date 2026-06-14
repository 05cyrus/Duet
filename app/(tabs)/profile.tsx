import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Screen, Text, Card, Avatar, Button } from '@/core/ui';
import { useTheme, useThemePref } from '@/core/theme';
import { useSession } from '@/core/state/session';
import { authService } from '@/features/auth/application/authService';
import { InvitePartnerCard } from '@/features/auth/ui/InvitePartnerCard';

export default function Profile() {
  const theme = useTheme();
  const { profile, couple } = useSession();
  const { mode, setMode } = useThemePref();

  const partnerId = profile?.partnerId ?? '';
  const partnerName = couple?.members?.[partnerId]?.displayName ?? 'Partner';

  return (
    <Screen scroll>
      <Text variant="display" style={{ marginBottom: theme.spacing.lg }}>
        Profile 👤
      </Text>

      <Card style={{ marginBottom: theme.spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
          <Avatar uri={profile?.avatarUrl} name={profile?.displayName} size={64} />
          <View style={{ flex: 1 }}>
            <Text variant="heading">{profile?.displayName ?? 'Me'}</Text>
            <Text variant="caption" color="textMuted">
              {profile?.email}
            </Text>
          </View>
        </View>
      </Card>

      <Card style={{ marginBottom: theme.spacing.lg }}>
        <Text variant="label" color="textMuted">
          Relationship
        </Text>
        <Text variant="heading" style={{ marginTop: 4 }}>
          You & {partnerName}
        </Text>
        <Text variant="caption" color="textMuted">
          {couple?.status ?? 'dating'}
          {couple?.anniversary ? ` · since ${couple.anniversary}` : ''}
        </Text>
      </Card>

      {/* Invite partner — only while waiting for the partner to link */}
      <InvitePartnerCard />

      {/* Theme mode */}
      <Card style={{ marginBottom: theme.spacing.lg }}>
        <Text variant="heading" style={{ marginBottom: theme.spacing.md }}>
          Appearance
        </Text>
        <View style={styles.segment}>
          {(['system', 'light', 'dark'] as const).map((m) => {
            const active = mode === m;
            return (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={[
                  styles.segmentItem,
                  {
                    backgroundColor: active ? theme.colors.primary : theme.colors.surfaceAlt,
                  },
                ]}
              >
                <Text variant="label" color={active ? 'onPrimary' : 'text'} style={{ textTransform: 'capitalize' }}>
                  {m}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={{ marginBottom: theme.spacing.lg }}>
        <Text variant="heading" style={{ marginBottom: theme.spacing.sm }}>
          Geofences & Location
        </Text>
        <Text variant="caption" color="textMuted">
          Home · Office · Gym · Custom — significant-change updates to save battery.
        </Text>
      </Card>

      <Button title="Sign out" onPress={() => authService.signOut()} variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', gap: 8 },
  segmentItem: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
});
