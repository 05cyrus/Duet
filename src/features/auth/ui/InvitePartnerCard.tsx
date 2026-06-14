import React, { useState } from 'react';
import { View, Share, Alert } from 'react-native';
import { Card, Text, Button } from '@/core/ui';
import { useTheme } from '@/core/theme';
import { useSession } from '@/core/state/session';
import { coupleRepository } from '../data/coupleRepository';

/**
 * Shown on the Profile tab ONLY while the couple is pending (partner not yet
 * linked). Surfaces the active invite code + a Share button, so the user can
 * always retrieve/share it after leaving the link screen, and can mint a fresh
 * one if needed.
 */
export function InvitePartnerCard() {
  const theme = useTheme();
  const { couple, profile } = useSession();
  const [code, setCode] = useState<string | null>(couple?.inviteCode ?? null);
  const [loading, setLoading] = useState(false);

  // Only relevant until the second partner joins.
  const pending = !!couple && couple.memberIds.length < 2;
  if (!pending) return null;

  const effectiveCode = code ?? couple?.inviteCode ?? null;

  const regenerate = async () => {
    if (!profile || !couple) return;
    setLoading(true);
    try {
      setCode(await coupleRepository.regenerateInvite(couple.id, profile));
    } catch (e) {
      Alert.alert('Could not create code', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const share = () => {
    if (!effectiveCode) return;
    Share.share({ message: `Join me on Duet 💞 Enter code: ${effectiveCode}` });
  };

  return (
    <Card style={{ marginBottom: theme.spacing.lg }}>
      <Text variant="heading">Invite your partner 💌</Text>
      <Text variant="caption" color="textMuted" style={{ marginTop: 4 }}>
        Waiting for your partner to join. Share this code with them.
      </Text>

      {effectiveCode ? (
        <>
          <Text
            variant="display"
            center
            color="primary"
            style={{ marginVertical: theme.spacing.md, letterSpacing: 6 }}
          >
            {effectiveCode}
          </Text>
          <Button title="Share code" onPress={share} variant="gradient" />
          <Button title="Generate a new code" onPress={regenerate} loading={loading} variant="ghost" />
        </>
      ) : (
        <View style={{ marginTop: theme.spacing.md }}>
          <Button title="Generate invite code" onPress={regenerate} loading={loading} variant="gradient" />
        </View>
      )}
    </Card>
  );
}
