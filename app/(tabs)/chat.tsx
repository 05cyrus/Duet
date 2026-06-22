import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SnapCamera } from '@/features/chat/ui/SnapCamera';
import { isSameDay } from 'date-fns';
import { Text, EmptyState } from '@/core/ui';
import { useTheme } from '@/core/theme';
import { useChat } from '@/features/chat/application/useChat';
import { DateSeparator } from '@/features/chat/ui/DateSeparator';
import { MessageBubble } from '@/features/chat/ui/MessageBubble';
import { ReplyQuote } from '@/features/chat/ui/ReplyQuote';
import { SnapBubble } from '@/features/chat/ui/SnapBubble';
import { SnapViewer } from '@/features/chat/ui/SnapViewer';
import { SwipeToReply } from '@/features/chat/ui/SwipeToReply';
import type { ChatMessage, ReplyPreview } from '@/types/models';

// iOS reports a keyboard height that already includes the bottom safe-area inset,
// so it needs no extra lift. Android edge-to-edge under-reports it, so add a bit.
const KB_EXTRA_LIFT = Platform.OS === 'android' ? 40 : 0;

/** Snapshot a message into the lightweight preview stored on a reply. */
function toReplyPreview(m: ChatMessage): ReplyPreview {
  return { id: m.id, senderId: m.senderId, kind: m.kind, text: m.kind === 'snap' ? '' : m.text };
}

/** Free chatting space — text + instant snaps, all private to the couple. */
export default function ChatScreen() {
  const theme = useTheme();
  // The chat lives inside the tab navigator, so the tab bar already reserves the
  // bottom safe-area space. We offset the keyboard lift by its height so the
  // input bar rests exactly on top of the keyboard rather than above it.
  const tabBarHeight = useBottomTabBarHeight();
  const { messages, send, sendSnap, viewSnap, reactSnap, loadSnap, expireSnap, uid, loading } =
    useChat();
  const [draft, setDraft] = useState('');
  const [openSnap, setOpenSnap] = useState<ChatMessage | null>(null);
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [keyboardUp, setKeyboardUp] = useState(false);
  const inputRef = useRef<TextInput>(null);
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
        toValue: Math.max(e.endCoordinates.height - tabBarHeight, 0) + KB_EXTRA_LIFT,
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
  }, [kbLift, tabBarHeight]);

  const onReply = (message: ChatMessage) => {
    setReplyTarget(message);
    inputRef.current?.focus();
  };

  const onSend = () => {
    const text = draft;
    const replyTo = replyTarget ? toReplyPreview(replyTarget) : null;
    setDraft(''); // clear immediately; the live listener echoes the message back
    setReplyTarget(null);
    send(text, replyTo);
  };

  // Upload + post a captured snap, surfacing any failure.
  const deliverSnap = useCallback(
    async (base64: string, replyTo: ReplyPreview | null) => {
      try {
        await sendSnap(base64, undefined, replyTo);
      } catch (e) {
        const err = e as {
          code?: string;
          customData?: { serverResponse?: string };
          message?: string;
        };
        const server = err.customData?.serverResponse;
        console.error('[chat] snap upload failed', err.code, err.message, server);
        Alert.alert(
          'Couldn’t send snap',
          [err.code, err.message, server].filter(Boolean).join('\n\n') || 'Please try again.',
        );
      }
    },
    [sendSnap],
  );

  // Open the in-app camera. Capturing inside our own activity (vs. launching the
  // system camera) is what stops Android from destroying & reloading the app.
  const onCaptureSnap = () => setCameraOpen(true);

  const onSnapCaptured = async (base64: string) => {
    const replyTo = replyTarget ? toReplyPreview(replyTarget) : null;
    setReplyTarget(null);
    setCameraOpen(false);
    await deliverSnap(base64, replyTo);
  };

  const onOpenSnap = (message: ChatMessage) => {
    viewSnap(message.id); // write the view receipt
    setOpenSnap(message);
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.bg }]} edges={[]}>
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
                  uid={uid}
                  onOpen={() => onOpenSnap(item)}
                />
              ) : (
                <MessageBubble message={item} mine={item.senderId === uid} uid={uid} />
              );
            return (
              <>
                {showDate ? <DateSeparator millis={ts} /> : null}
                <SwipeToReply onReply={() => onReply(item)}>{bubble}</SwipeToReply>
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

        {replyTarget ? (
          <View
            style={[
              styles.replyBanner,
              { backgroundColor: theme.colors.bgElevated, borderTopColor: theme.colors.border },
            ]}
          >
            <View style={styles.flex}>
              <ReplyQuote
                preview={toReplyPreview(replyTarget)}
                fromMe={replyTarget.senderId === uid}
              />
            </View>
            <Pressable onPress={() => setReplyTarget(null)} hitSlop={10} style={{ padding: 6 }}>
              <Text color="textMuted" style={{ fontSize: 18 }}>
                ✕
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: theme.colors.bgElevated,
              borderTopColor: theme.colors.border,
              paddingBottom: 8,
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
            ref={inputRef}
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

      <SnapCamera
        visible={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={onSnapCaptured}
      />

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
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
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
