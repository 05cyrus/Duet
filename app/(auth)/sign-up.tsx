import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Button, Card } from '@/core/ui';
import { useTheme } from '@/core/theme';
import { authService } from '@/features/auth/application/authService';

export default function SignUp() {
  const theme = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSignUp = async () => {
    if (password.length < 6) return Alert.alert('Password too short', 'Use at least 6 characters.');
    setLoading(true);
    try {
      await authService.signUpEmail(email.trim(), password, name.trim() || 'Me');
      // AuthGate will route to link-partner automatically.
    } catch (e) {
      Alert.alert('Sign up failed', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Text variant="title" style={{ marginBottom: theme.spacing.lg }}>
        Create your account
      </Text>
      <Card>
        {[
          { ph: 'Your name', v: name, set: setName, secure: false, cap: 'words' as const },
          { ph: 'Email', v: email, set: setEmail, secure: false, cap: 'none' as const },
          { ph: 'Password', v: password, set: setPassword, secure: true, cap: 'none' as const },
        ].map((f) => (
          <TextInput
            key={f.ph}
            placeholder={f.ph}
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry={f.secure}
            autoCapitalize={f.cap}
            value={f.v}
            onChangeText={f.set}
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          />
        ))}
        <View style={{ height: theme.spacing.md }} />
        <Button title="Create account" onPress={onSignUp} loading={loading} variant="gradient" />
        <Button title="Back" onPress={() => router.back()} variant="ghost" />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 12 },
});
