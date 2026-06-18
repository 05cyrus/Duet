import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { Text, EmptyState } from '@/core/ui';
import { useTheme } from '@/core/theme';
import { useChat } from '@/features/chat/application/useChat';
import { MessageBubble } from '@/features/chat/ui/MessageBubble';
import { SnapBubble } from '@/features/chat/ui/SnapBubble';
import { SnapViewer } from '@/features/chat/ui/SnapViewer';
import type { ChatMessage } from '@/types/models';

/** Free chatting space — text + instant snaps, all private to the couple. */
export default function ChatScreen() {
  const theme = useTheme();
  const { messages, send, sendSnap, viewSnap, reactSnap, resolveUrl, expireSnap, uid, loading } =
    useChat();
  const [draft, setDraft] = useState('');
  const [openSnap, setOpenSnap] = useState<ChatMessage | null>(null);

  const onSend = () => {
    const text = draft;
    setDraft(''); // clear immediately; the live listener echoes the message back
    send(text);
  };

  // Capture and send instantly — no preview step.
  const onCaptureSnap = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera needed', 'Allow camera access to send a snap.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (result.canceled) return;
    const uri = result.assets[0]?.uri;
    if (!uri) return;
    try {
      await sendSnap(uri);
    } catch (e) {
      const err = e as { code?: string; customData?: { serverResponse?: string }; message?: string };
      const server = err.customData?.serverResponse;
      console.error('[chat] snap upload failed', err.code, err.message, server);
      Alert.alert(
        'Couldn’t send snap',
        [err.code, err.message, server].filter(Boolean).join('\n\n') || 'Please try again.',
      );
    }
  };

  const onOpenSnap = (message: ChatMessage) => {
    viewSnap(message.id); // write the view receipt
    setOpenSnap(message);
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.bg }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: true, title: 'Chat 💬' }} />
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={messages}
          inverted={messages.length > 0}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) =>
            item.kind === 'snap' ? (
              <SnapBubble
                message={item}
                mine={item.senderId === uid}
                onOpen={() => onOpenSnap(item)}
              />
            ) : (
              <MessageBubble message={item} mine={item.senderId === uid} />
            )
          }
          contentContainerStyle={{ padding: theme.spacing.lg, flexGrow: 1 }}
          ListEmptyComponent={
            loading ? null : (
              <View style={styles.flex}>
                <EmptyState
                  emoji="💬"
                  title="Say hi 👋"
                  subtitle="This is your private space to talk. Send a message or tap 📷 for an instant snap."
                />
              </View>
            )
          }
          keyboardShouldPersistTaps="handled"
        />

        <View
          style={[
            styles.inputBar,
            { backgroundColor: theme.colors.bgElevated, borderTopColor: theme.colors.border },
          ]}
        >
          <Pressable
            onPress={onCaptureSnap}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: theme.colors.surfaceAlt, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={{ fontSize: 20 }}>📷</Text>
          </Pressable>

          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message…"
            placeholderTextColor={theme.colors.textMuted}
            multiline
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surfaceAlt,
                color: theme.colors.text,
                borderRadius: theme.radius.lg,
              },
            ]}
            onSubmitEditing={onSend}
          />
          <Pressable
            onPress={onSend}
            disabled={!draft.trim()}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: draft.trim() ? theme.colors.primary : theme.colors.surfaceAlt,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={{ fontSize: 20 }}>➤</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <SnapViewer
        message={openSnap}
        resolveUrl={resolveUrl}
        onReact={reactSnap}
        onExpire={expireSnap}
        onClose={() => setOpenSnap(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
