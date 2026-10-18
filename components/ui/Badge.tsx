import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, StatusColors, StatusBgColors } from '../../constants/Colors';

interface BadgeProps {
  label: string;
  variant?: 'status' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export default function Badge({ label, variant = 'neutral', size = 'md', style }: BadgeProps) {
  const isStatus = StatusColors[label] !== undefined;
  const bgColor = isStatus ? StatusBgColors[label] : variantBg[variant];
  const textColor = isStatus ? StatusColors[label] : variantText[variant];

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }, sizes[size], style]}>
      {isStatus && <View style={[styles.dot, { backgroundColor: textColor }]} />}
      <Text style={[styles.text, { color: textColor }, size === 'sm' && styles.textSm]}>
        {label}
      </Text>
    </View>
  );
}

const variantBg: Record<string, string> = {
  success: Colors.successBg,
  warning: Colors.warningBg,
  danger: Colors.dangerBg,
  info: Colors.infoBg,
  neutral: Colors.card,
};

const variantText: Record<string, string> = {
  success: Colors.success,
  warning: Colors.warning,
  danger: Colors.danger,
  info: Colors.info,
  neutral: Colors.textSecondary,
};

const sizes = {
  sm: StyleSheet.create({ s: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 } }).s,
  md: StyleSheet.create({ s: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 } }).s,
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  textSm: {
    fontSize: 11,
  },
});
