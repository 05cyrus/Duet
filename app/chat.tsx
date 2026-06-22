import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { isSameDay } from 'date-fns';
import { Text, EmptyState } from '@/core/ui';
import { useTheme } from '@/core/theme';
import { useChat } from '@/features/chat/application/useChat';
import { DateSeparator } from '@/features/chat/ui/DateSeparator';
import { MessageBubble } from '@/features/chat/ui/MessageBubble';
import { SnapBubble } from '@/features/chat/ui/SnapBubble';
import { SnapViewer } from '@/features/chat/ui/SnapViewer';
import type { ChatMessage } from '@/types/models';

// iOS reports a keyboard height that already includes the bottom safe-area inset,
// so it needs no extra lift. Android edge-to-edge under-reports it, so add a bit.
const KB_EXTRA_LIFT = Platform.OS === 'android' ? 40 : 0;

/** Free chatting space — text + instant snaps, all private to the couple. */
export default function ChatScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { messages, send, sendSnap, viewSnap, reactSnap, loadSnap, expireSnap, uid, loading } =
    useChat();
  const [draft, setDraft] = useState('');
  const [openSnap, setOpenSnap] = useState<ChatMessage | null>(null);
  const [keyboardUp, setKeyboardUp] = useState(false);
  // We drive keyboard avoidance ourselves instead of KeyboardAvoidingView, which
  // is unreliable on Android edge-to-edge (over-measures, doesn't reset on hide).
  // `kbLift` is the exact space to reserve below the content so the input bar
  // rests on top of the keyboard, and it always animates back to 0 on hide.
  const kbLift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvt, (e) => {
      setKeyboardUp(true);
      Animated.timing(kbLift, {
        toValue: e.endCoordinates.height + KB_EXTRA_LIFT,
        duration: e.duration || 250,
        useNativeDriver: false,
      }).start();
    });
    const hide = Keyboard.addListener(hideEvt, (e) => {
      setKeyboardUp(false);
      Animated.timing(kbLift, {
        toValue: 0,
        duration: e?.duration || 200,
        useNativeDriver: false,
      }).start();
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [kbLift]);

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
    // Compress hard and request base64 directly — the image goes into RTDB, so
    // smaller is cheaper and faster. quality 0.4 keeps a phone photo well under
    // the free-tier comfort zone while still looking fine for a quick snap.
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.4,
      base64: true,
    });
    if (result.canceled) return;
    const base64 = result.assets[0]?.base64;
    if (!base64) return;
    try {
      await sendSnap(base64);
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
      <Animated.View style={[styles.flex, { paddingBottom: kbLift }]}>
        <FlatList
          data={messages}
          inverted={messages.length > 0}
          keyExtractor={(m) => m.id}
          renderItem={({ item, index }) => {
            // List is inverted & newest-first, so the chronologically older
            // neighbour is the NEXT index. Show the day label above the first
            // message of each day (i.e. when the older neighbour is a different
            // day, or this is the oldest message).
            const ts = item.createdAt ?? Date.now();
            const older = messages[index + 1];
            const showDate = !older || !isSameDay(ts, older.createdAt ?? Date.now());
            const bubble =
              item.kind === 'snap' ? (
                <SnapBubble
                  message={item}
                  mine={item.senderId === uid}
                  onOpen={() => onOpenSnap(item)}
                />
              ) : (
                <MessageBubble message={item} mine={item.senderId === uid} />
              );
            return (
              <>
                {showDate ? <DateSeparator millis={ts} /> : null}
                {bubble}
              </>
            );
          }}
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
            {
              backgroundColor: theme.colors.bgElevated,
              borderTopColor: theme.colors.border,
              paddingBottom: keyboardUp ? 8 : insets.bottom + 8,
            },
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
      </Animated.View>

      <SnapViewer
        message={openSnap}
        loadSnap={loadSnap}
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
