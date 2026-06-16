import React, { useRef } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { formatDistanceToNow } from 'date-fns';
import { Screen, Text, Card, Button } from '@/core/ui';
import { useTheme } from '@/core/theme';
import { useWheel, REWARDS } from '@/features/wheel/application/useWheel';

const SIZE = 300;
const R = SIZE / 2;
const SEG = 360 / REWARDS.length;
const SLICE_COLORS = ['#FF6F91', '#9B8CFF', '#FF7E67', '#6C4AB6', '#FF8FA3', '#5AC8FA'];

// Point on the circle, with 0° at the top (12 o'clock), increasing clockwise.
function polar(angleDeg: number, radius: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: R + radius * Math.cos(a), y: R + radius * Math.sin(a) };
}

function slicePath(startDeg: number, endDeg: number) {
  const p1 = polar(startDeg, R);
  const p2 = polar(endDeg, R);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${R} ${R} L ${p1.x} ${p1.y} A ${R} ${R} 0 ${largeArc} 1 ${p2.x} ${p2.y} Z`;
}

export default function WheelScreen() {
  const theme = useTheme();
  const { spinning, result, beginSpin, finishSpin, history } = useWheel();
  const rotation = useSharedValue(0);
  const turns = useRef(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const onSpin = () => {
    if (spinning) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const index = beginSpin();
    const segCenter = index * SEG + SEG / 2;
    turns.current += 5; // full rotations for drama
    const target = turns.current * 360 + (360 - segCenter);
    rotation.value = withTiming(
      target,
      { duration: 3600, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(finishSpin)(index);
      },
    );
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ headerShown: true, title: 'Couple Wheel' }} />
      <Text variant="body" color="textMuted" center style={{ marginBottom: theme.spacing.lg }}>
        Spin to see what you owe each other 💞
      </Text>

      <View style={styles.wheelWrap}>
        {/* fixed pointer at top */}
        <View style={[styles.pointer, { borderTopColor: theme.colors.text }]} />
        <Animated.View style={animatedStyle}>
          <Svg width={SIZE} height={SIZE}>
            <G>
              {REWARDS.map((reward, i) => {
                const start = i * SEG;
                const labelPos = polar(start + SEG / 2, R * 0.6);
                return (
                  <G key={reward.id}>
                    <Path d={slicePath(start, start + SEG)} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
                    <SvgText
                      x={labelPos.x}
                      y={labelPos.y}
                      fontSize={22}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                    >
                      {reward.emoji}
                    </SvgText>
                  </G>
                );
              })}
            </G>
            <Circle cx={R} cy={R} r={26} fill={theme.colors.surface} />
          </Svg>
        </Animated.View>
      </View>

      {result ? (
        <Animated.View entering={FadeIn} key={result.id}>
          <Card style={{ alignItems: 'center', marginTop: theme.spacing.lg, backgroundColor: theme.colors.primaryMuted }}>
            <Text style={{ fontSize: 40 }}>{result.emoji}</Text>
            <Text variant="heading" color="primary">
              {result.label}
            </Text>
          </Card>
        </Animated.View>
      ) : null}

      <View style={{ height: theme.spacing.lg }} />
      <Button title={spinning ? 'Spinning…' : '🎡 Spin the wheel'} onPress={onSpin} loading={spinning} variant="gradient" />

      {history.spins.length ? (
        <View style={{ marginTop: theme.spacing.xl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="heading">Recent spins</Text>
            <Pressable onPress={history.clear}>
              <Text variant="caption" color="textMuted">
                Clear
              </Text>
            </Pressable>
          </View>
          {history.spins.slice(0, 8).map((s, i) => (
            <Card key={`${s.at}-${i}`} style={{ marginTop: theme.spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text variant="label">{s.label}</Text>
                  <Text variant="caption" color="textMuted">
                    {formatDistanceToNow(s.at, { addSuffix: true })}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wheelWrap: { alignItems: 'center', justifyContent: 'center' },
  pointer: {
    position: 'absolute',
    top: -6,
    zIndex: 10,
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 22,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
