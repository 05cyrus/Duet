import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Alert } from 'react-native';
import { Screen, Text, Card, Avatar, Button } from '@/core/ui';
import { useTheme, useThemePref } from '@/core/theme';
import { useSession, usePartnerId } from '@/core/state/session';
import { authService } from '@/features/auth/application/authService';
import { coupleRepository } from '@/features/auth/data/coupleRepository';
import { InvitePartnerCard } from '@/features/auth/ui/InvitePartnerCard';

export default function Profile() {
  const theme = useTheme();
  const { profile, couple, uid } = useSession();
  const { mode, setMode } = useThemePref();
  const [unlinking, setUnlinking] = useState(false);

  const partnerId = usePartnerId() ?? '';
  const partnerName = couple?.members?.[partnerId]?.displayName ?? 'Partner';

  const confirmRemovePartner = () => {
    if (!couple || !uid) return;
    Alert.alert(
      'Remove partner?',
      'This permanently deletes ALL of your shared data — moods, notes, photos, ' +
        'games, timeline, everything — for BOTH of you. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove & delete',
          style: 'destructive',
          onPress: () =>
            // Second confirmation — this is irreversible.
            Alert.alert('Are you absolutely sure?', 'Last chance — everything will be erased.', [
              { text: 'Keep my data', style: 'cancel' },
              {
                text: 'Yes, delete everything',
                style: 'destructive',
                onPress: async () => {
                  setUnlinking(true);
                  try {
                    await coupleRepository.unlinkAndWipe(couple.id, uid);
                    // The bootstrap listener routes us back to link-partner.
                  } catch (e) {
                    Alert.alert('Could not remove', (e as Error).message);
                  } finally {
                    setUnlinking(false);
                  }
                },
              },
            ]),
        },
      ],
    );
  };

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

      {/* Danger zone — remove partner & wipe all shared data */}
      {couple ? (
        <Card style={{ marginBottom: theme.spacing.lg, borderColor: theme.colors.danger, borderWidth: 1 }}>
          <Text variant="heading" color="danger">
            Danger zone
          </Text>
          <Text variant="caption" color="textMuted" style={{ marginTop: 4, marginBottom: theme.spacing.md }}>
            Removing your partner deletes all shared data for both of you. This can’t be undone.
          </Text>
          <Button
            title={unlinking ? 'Removing…' : 'Remove partner & delete data'}
            onPress={confirmRemovePartner}
            loading={unlinking}
            variant="secondary"
          />
        </Card>
      ) : null}

      <Button title="Sign out" onPress={() => authService.signOut()} variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', gap: 8 },
  segmentItem: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
});
