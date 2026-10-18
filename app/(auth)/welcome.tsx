import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Spin + scale logo
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.loop(
        Animated.timing(rotateAnim, { toValue: 1, duration: 3000, useNativeDriver: true })
      ),
    ]).start();

    Animated.sequence([
      Animated.delay(400),
      Animated.timing(textOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(btnOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient colors={['#0A0A1A', '#0F0F2E', '#0A0A1A']} style={styles.container}>
      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      {/* Logo area */}
      <Animated.View
        style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.logoGradient}
        >
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="refresh-circle" size={52} color="#fff" />
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {/* Brand text */}
      <Animated.View style={{ opacity: textOpacity, alignItems: 'center', marginTop: 24 }}>
        <Text style={styles.brandName}>TumblePro</Text>
        <Text style={styles.tagline}>Smart Laundry Management</Text>

        <View style={styles.featureRow}>
          {['📦 Orders', '👥 Customers', '📊 Analytics'].map((f) => (
            <View key={f} style={styles.featureChip}>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Auth buttons */}
      <Animated.View style={[styles.btnArea, { opacity: btnOpacity }]}>
        <Text
          style={styles.primaryBtn}
          onPress={() => router.push('/(auth)/register')}
        >
          <Ionicons name="person-add-outline" size={16} /> {'  '}Get Started
        </Text>
        <Text
          style={styles.secondaryBtn}
          onPress={() => router.push('/(auth)/login')}
        >
          Already have an account?{'  '}
          <Text style={{ color: Colors.primary, fontWeight: '700' }}>Login</Text>
        </Text>
      </Animated.View>

      <Text style={styles.version}>v1.0 • Made for Indian Laundry Businesses</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  circle1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: Colors.primary + '08',
    top: -80,
    right: -80,
  },
  circle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primaryDark + '10',
    bottom: 80,
    left: -60,
  },
  logoContainer: {
    marginBottom: 8,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 16,
  },
  brandName: {
    fontSize: 38,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
  },
  featureChip: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  featureText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  btnArea: {
    width: '100%',
    marginTop: 48,
    gap: 16,
    alignItems: 'center',
  },
  primaryBtn: {
    width: '100%',
    textAlign: 'center',
    backgroundColor: Colors.primary,
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    paddingVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  version: {
    position: 'absolute',
    bottom: 32,
    fontSize: 11,
    color: Colors.textMuted,
  },
});
