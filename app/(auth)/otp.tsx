import React, { useState } from 'react';
import { TextInput, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Button, Card } from '@/core/ui';
import { useTheme } from '@/core/theme';

/**
 * Email OTP (free) — Firebase phone/SMS OTP is intentionally avoided because
 * SMS is billed. Flow: enter email → server (Cloudflare Worker) emails a 6-digit
 * code via a free email API → verify → sign in with a custom token.
 * UI scaffold below; wire to /otp/request and /otp/verify on the worker.
 */
export default function Otp() {
  const theme = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);

  const request = async () => {
    // await fetch(`${env.aiProxyUrl}/otp/request`, {...})  // free email send
    setSent(true);
    Alert.alert('Code sent', 'Check your email for a 6-digit code (demo scaffold).');
  };
  const verify = async () => {
    // const { token } = await fetch(`${env.aiProxyUrl}/otp/verify`, {...})
    // await signInWithCustomToken(firebaseAuth, token)
    Alert.alert('Verify', `Would verify code ${code} (demo scaffold).`);
  };

  return (
    <Screen>
      <Text variant="title" style={{ marginBottom: theme.spacing.lg }}>
        Sign in with email code
      </Text>
      <Card>
        <TextInput
          placeholder="Email"
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
        />
        {sent ? (
          <TextInput
            placeholder="6-digit code"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          />
        ) : null}
        {!sent ? (
          <Button title="Send code" onPress={request} variant="gradient" />
        ) : (
          <Button title="Verify & sign in" onPress={verify} variant="gradient" />
        )}
        <Button title="Back" onPress={() => router.back()} variant="ghost" />
      </Card>
      <Text variant="caption" color="textMuted" center style={{ marginTop: theme.spacing.lg }}>
        Free path: email OTP via Cloudflare Worker + Resend free tier. No SMS billing.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
});
