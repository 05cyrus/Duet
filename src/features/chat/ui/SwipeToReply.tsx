import React from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from '@/core/ui';

const TRIGGER = 56; // px drag that fires a reply
const MAX = 80; // px the row can travel

export interface SwipeToReplyProps {
  onReply: () => void;
  children: React.ReactNode;
}

/**
 * Drag a message row to the right to reply (WhatsApp-style). A reply arrow
 * fades in as you drag; crossing the threshold fires once with a haptic, and
 * the row springs back. Vertical scrolling still wins, and taps pass through.
 */
export function SwipeToReply({ onReply, children }: SwipeToReplyProps) {
  const tx = useSharedValue(0);
  const fired = useSharedValue(false);

  const fire = () => {
    Haptics.selectionAsync().catch(() => {});
    onReply();
  };

  const pan = Gesture.Pan()
    .activeOffsetX(12) // only activate on a rightward drag
    .failOffsetY([-12, 12]) // let the list scroll vertically
    .onUpdate((e) => {
      tx.value = Math.max(0, Math.min(e.translationX, MAX));
      if (tx.value >= TRIGGER && !fired.value) {
        fired.value = true;
        runOnJS(fire)();
      }
    })
    .onEnd(() => {
      tx.value = withSpring(0, { damping: 18, stiffness: 220 });
      fired.value = false;
    });

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));
  const iconStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, tx.value / TRIGGER),
    transform: [{ scale: Math.min(1, tx.value / TRIGGER) }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View>
        <Animated.View
          style={[
            { position: 'absolute', left: 10, top: 0, bottom: 0, justifyContent: 'center' },
            iconStyle,
          ]}
        >
          <Text style={{ fontSize: 20 }}>↩️</Text>
        </Animated.View>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </View>
    </GestureDetector>
  );
}
