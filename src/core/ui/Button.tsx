import React from 'react';
import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/core/theme';
import { Text } from './Text';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'gradient';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

/** Premium button with gradient option + haptic feedback. */
export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  fullWidth = true,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  const base: ViewStyle = {
    height: 52,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    width: fullWidth ? '100%' : undefined,
    opacity: isDisabled ? 0.5 : 1,
  };

  const content = loading ? (
    <ActivityIndicator color={variant === 'secondary' ? theme.colors.primary : theme.colors.onPrimary} />
  ) : (
    <Text
      variant="label"
      color={variant === 'secondary' || variant === 'ghost' ? 'primary' : 'onPrimary'}
    >
      {title}
    </Text>
  );

  if (variant === 'gradient') {
    return (
      <Pressable onPress={handlePress} disabled={isDisabled} style={[fullWidth && { width: '100%' }, style]}>
        <LinearGradient
          colors={theme.gradients.love}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={base}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  const bg =
    variant === 'primary'
      ? theme.colors.primary
      : variant === 'secondary'
        ? theme.colors.primaryMuted
        : 'transparent';

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={[base, { backgroundColor: bg }, variant === 'ghost' && styles.ghost, style]}
    >
      <View>{content}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ghost: { borderWidth: 0 },
});
