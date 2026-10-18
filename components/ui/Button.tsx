import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const sizeStyle = sizes[size];
  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.wrapper, sizeStyle.wrapper, isDisabled && styles.disabled, style]}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={isDisabled ? ['#444', '#333'] : [Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, sizeStyle.inner]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              {icon}
              <Text style={[styles.text, sizeStyle.text, textStyle]}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyle = variants[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.wrapper, sizeStyle.wrapper, variantStyle.wrapper, isDisabled && styles.disabled, style]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.textColor} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, sizeStyle.text, { color: variantStyle.textColor }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.5,
  },
});

const sizes = {
  sm: {
    wrapper: { height: 38 } as ViewStyle,
    inner: { paddingHorizontal: 16, height: 38 } as ViewStyle,
    text: { fontSize: 13 } as TextStyle,
  },
  md: {
    wrapper: { height: 50 } as ViewStyle,
    inner: { paddingHorizontal: 24, height: 50 } as ViewStyle,
    text: { fontSize: 15 } as TextStyle,
  },
  lg: {
    wrapper: { height: 58 } as ViewStyle,
    inner: { paddingHorizontal: 28, height: 58 } as ViewStyle,
    text: { fontSize: 17 } as TextStyle,
  },
};

const variants = {
  secondary: {
    wrapper: {
      backgroundColor: Colors.card,
      borderWidth: 1,
      borderColor: Colors.border,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: 20,
      gap: 8,
    },
    textColor: Colors.textPrimary,
  },
  danger: {
    wrapper: {
      backgroundColor: Colors.dangerBg,
      borderWidth: 1,
      borderColor: Colors.danger,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: 20,
      gap: 8,
    },
    textColor: Colors.danger,
  },
  ghost: {
    wrapper: {
      backgroundColor: 'transparent',
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: 20,
      gap: 8,
    },
    textColor: Colors.primary,
  },
};
