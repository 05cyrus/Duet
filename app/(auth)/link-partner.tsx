import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Alert, Share } from 'react-native';
import { Screen, Text, Button, Card } from '@/core/ui';
import { useTheme } from '@/core/theme';
import { useSession } from '@/core/state/session';
import { coupleRepository } from '@/features/auth/data/coupleRepository';
import { authService } from '@/features/auth/application/authService';

/**
 * Couple linking. Either:
 *  - generate an invite code to share with your partner, OR
 *  - enter the code your partner shared with you.
 * On success the AuthGate routes to (tabs).
 */
export default function LinkPartner() {
  const theme = useTheme();
  const profile = useSession((s) => s.profile);
  const setStatus = useSession((s) => s.setStatus);
  const [code, setCode] = useState('');
  const [myCode, setMyCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!profile) {
      Alert.alert('Still loading', 'Your profile is still loading — try again in a moment.');
      return;
    }
    setLoading(true);
    try {
      const { code: c } = await coupleRepository.createCoupleWithInvite(profile);
      setMyCode(c);
    } catch (e) {
      Alert.alert('Could not create code', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const join = async () => {
    if (!profile) {
      Alert.alert('Still loading', 'Your profile is still loading — try again in a moment.');
      return;
    }
    setLoading(true);
    try {
      await coupleRepository.joinByCode(profile, code.trim());
      setStatus('ready'); // bootstrap listener will confirm
    } catch (e) {
      Alert.alert('Could not join', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Text variant="title">Link with your partner 💞</Text>
      <Text variant="body" color="textMuted" style={{ marginVertical: theme.spacing.md }}>
        Duet connects exactly two people. Share a code, or enter the one you received.
      </Text>

      <Card style={{ marginBottom: theme.spacing.lg }}>
        <Text variant="heading">Invite your partner</Text>
        {myCode ? (
          <>
            <Text variant="display" center color="primary" style={{ marginVertical: theme.spacing.md }}>
              {myCode}
            </Text>
            <Button
              title="Share code"
              variant="gradient"
              onPress={() => Share.share({ message: `Join me on Duet 💞 Code: ${myCode}` })}
            />
          </>
        ) : (
          <Button title="Generate invite code" onPress={generate} loading={loading} variant="gradient" />
        )}
      </Card>

      <Card>
        <Text variant="heading">Have a code?</Text>
        <TextInput
          placeholder="Enter 6-char code"
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize="characters"
          maxLength={6}
          value={code}
          onChangeText={setCode}
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
        />
        <Button title="Link partner" onPress={join} loading={loading} variant="primary" />
      </Card>

      <View style={{ height: theme.spacing.xl }} />
      <Button title="Sign out" onPress={() => authService.signOut()} variant="ghost" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 14, padding: 14, marginVertical: 12, fontSize: 18, letterSpacing: 4 },
});
