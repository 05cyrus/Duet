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
  resolveUrl: (storagePath: string) => Promise<string>;
  onReact: (messageId: string, emoji: string) => void;
  /** Called once when the snap is dismissed — deletes the Storage object. */
  onExpire: (storagePath: string) => void;
  onClose: () => void;
}

/**
 * One-time fullscreen snap viewer. Loads the photo, counts down, lets the
 * recipient react, then disappears for good and best-effort deletes the media.
 */
export function SnapViewer({ message, resolveUrl, onReact, onExpire, onClose }: SnapViewerProps) {
  const theme = useTheme();
  const snap = message?.snap ?? null;

  const [url, setUrl] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [reacted, setReacted] = useState<string | null>(null);
  const dismissedRef = useRef(false);

  // Resolve the download URL when a snap opens.
  useEffect(() => {
    if (!message || !snap) return;
    let active = true;
    dismissedRef.current = false;
    setUrl(null);
    setReacted(snap.reaction);
    setRemaining(snap.viewSeconds);
    resolveUrl(snap.media.storagePath)
      .then((u) => active && setUrl(u))
      .catch(() => active && dismiss()); // media already gone → just close
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message?.id]);

  // Countdown only starts once the photo is on screen.
  useEffect(() => {
    if (!url || !message) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          dismiss();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, message?.id]);

  function dismiss() {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    if (snap) onExpire(snap.media.storagePath);
    onClose();
  }

  return (
    <Modal visible={!!message} transparent animationType="fade" onRequestClose={dismiss}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {url ? (
          <Image source={{ uri: url }} style={{ flex: 1 }} contentFit="contain" />
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
        {url && message ? (
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
