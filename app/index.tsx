import { Redirect } from 'expo-router';

// Entry point — the AuthGate in _layout handles real routing once session
// resolves. Default to the tabs; gate will bounce to auth if needed.
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
