import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/core/ui';
import { useTheme } from '@/core/theme';
import type { ChatMessage } from '@/types/models';

const REACTIONS = ['❤️', '😂', '😮', '😍', '🔥'];

export interface SnapViewerProps {
  /** The snap to show, or null when closed. */
  message: ChatMessage | null;
  /** Fetch the snap's base64 image by its RTDB key. */
  loadSnap: (snapId: string) => Promise<string | null>;
  onReact: (messageId: string, emoji: string) => void;
  /** Called once when the snap is dismissed — deletes the ephemeral image. */
  onExpire: (snapId: string) => void;
  onClose: () => void;
}

/**
 * One-time fullscreen snap viewer. Loads the photo, counts down, lets the
 * recipient react, then disappears for good and deletes the ephemeral image.
 */
export function SnapViewer({ message, loadSnap, onReact, onExpire, onClose }: SnapViewerProps) {
  const theme = useTheme();
  const snap = message?.snap ?? null;

  const [uri, setUri] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [reacted, setReacted] = useState<string | null>(null);
  const dismissedRef = useRef(false);

  // Fetch the image (and reset state) each time a snap opens.
  useEffect(() => {
    if (!message || !snap) return;
    let active = true;
    dismissedRef.current = false;
    setUri(null);
    setReacted(snap.reaction);
    setRemaining(snap.viewSeconds);
    loadSnap(snap.snapId)
      .then((b64) => {
        if (!active) return;
        if (b64) setUri(`data:image/jpeg;base64,${b64}`);
        else dismiss(); // already gone → just close
      })
      .catch(() => active && dismiss());
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message?.id]);

  // Countdown only starts once the photo is on screen. The updater stays pure —
  // just decrements — so it never triggers a parent update mid-render.
  useEffect(() => {
    if (!uri || !message) return;
    const id = setInterval(() => {
      setRemaining((r) => (r <= 1 ? 0 : r - 1));
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri, message?.id]);

  // Dismiss as a side effect once the countdown reaches zero (after commit).
  useEffect(() => {
    if (uri && remaining === 0) dismiss();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri, remaining]);

  function dismiss() {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    if (snap) onExpire(snap.snapId);
    onClose();
  }

  return (
    <Modal visible={!!message} transparent animationType="fade" onRequestClose={dismiss}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {uri ? (
          <Image source={{ uri }} style={{ flex: 1 }} contentFit="contain" />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        )}

        {/* Countdown + close */}
        <View
          style={{
            position: 'absolute',
            top: 48,
            left: 16,
            right: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: theme.radius.pill,
              paddingHorizontal: 14,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>{remaining}s</Text>
          </View>
          <Pressable onPress={dismiss} hitSlop={12}>
            <Text style={{ color: '#fff', fontSize: 24 }}>✕</Text>
          </Pressable>
        </View>

        {/* Caption */}
        {message?.text ? (
          <View style={{ position: 'absolute', bottom: 120, left: 16, right: 16 }}>
            <Text center style={{ color: '#fff', fontSize: 16 }}>
              {message.text}
            </Text>
          </View>
        ) : null}

        {/* Reaction row */}
        {uri && message ? (
          <View
            style={{
              position: 'absolute',
              bottom: 48,
              left: 0,
              right: 0,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 14,
            }}
          >
            {REACTIONS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => {
                  setReacted(emoji);
                  onReact(message.id, emoji);
                }}
                style={{
                  transform: [{ scale: reacted === emoji ? 1.3 : 1 }],
                  opacity: reacted && reacted !== emoji ? 0.4 : 1,
                }}
              >
                <Text style={{ fontSize: 30 }}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
