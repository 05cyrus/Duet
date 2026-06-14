import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Alert } from 'react-native';
import { Link } from 'expo-router';
import { Screen, Text, Button, Card, GradientBackground } from '@/core/ui';
import { useTheme } from '@/core/theme';
import { authService } from '@/features/auth/application/authService';
import { useGoogleAuth } from '@/features/auth/application/useGoogleAuth';

export default function SignIn() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const google = useGoogleAuth((msg) => Alert.alert('Google sign-in failed', msg));

  const onSignIn = async () => {
    setLoading(true);
    try {
      await authService.signInEmail(email.trim(), password);
    } catch (e) {
      Alert.alert('Sign in failed', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen padded={false}>
      <GradientBackground name="love" />
      <View style={styles.container}>
        <Text variant="display" color="onPrimary" center>
          Duet
        </Text>
        <Text variant="body" color="onPrimary" center style={{ opacity: 0.9, marginBottom: theme.spacing['2xl'] }}>
          Just the two of you 💞
        </Text>
        <Card>
          <Text variant="heading">Welcome back</Text>
          <TextInput
            placeholder="Email"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          />
          <Button title="Sign In" onPress={onSignIn} loading={loading} variant="gradient" />
          <View style={{ height: theme.spacing.sm }} />
          <Button
            title="Continue with Google"
            onPress={google.signIn}
            loading={google.loading}
            disabled={!google.ready}
            variant="secondary"
          />
          <View style={{ height: theme.spacing.sm }} />
          <Link href="/(auth)/otp" asChild>
            <Button title="Use email code instead" onPress={() => {}} variant="ghost" />
          </Link>
          <Link href="/(auth)/sign-up" asChild>
            <Button title="Create an account" onPress={() => {}} variant="secondary" />
          </Link>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 8 },
  input: { borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 12 },
});
