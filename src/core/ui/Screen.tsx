import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/core/theme';

export interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  padded?: boolean;
}

/** Standard screen wrapper: safe area + themed bg + optional scroll. */
export function Screen({ children, scroll, edges = ['top'], padded = true }: ScreenProps) {
  const theme = useTheme();
  const Inner = scroll ? ScrollView : View;
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.bg }]} edges={edges}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <Inner
        style={styles.flex}
        contentContainerStyle={
          scroll ? { padding: padded ? theme.spacing.lg : 0, paddingBottom: theme.spacing['3xl'] } : undefined
        }
      >
        <View style={[styles.flex, !scroll && padded && { padding: theme.spacing.lg }]}>{children}</View>
      </Inner>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
