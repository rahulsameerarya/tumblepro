import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Colors } from '../../constants/Colors';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Full name is required';
    if (!emailOrPhone.trim()) e.emailOrPhone = 'Email or mobile number is required';
    if (password.length < 6) e.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    const result = await register(name, emailOrPhone, password);
    setLoading(false);
    if (result.success) {
      router.replace('/(app)/dashboard');
    } else {
      Alert.alert('Registration Failed', result.error);
    }
  }

  return (
    <LinearGradient colors={['#0A0A1A', '#0F0F2E']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>

          {/* Header */}
          <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.iconWrap}>
            <Ionicons name="person-add" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join TumblePro to manage your laundry business</Text>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Rahul Sharma"
              icon="person-outline"
              autoCapitalize="words"
              error={errors.name}
            />
            <Input
              label="Email or Mobile Number"
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              placeholder="email@example.com or 9876543210"
              icon="mail-outline"
              keyboardType="email-address"
              error={errors.emailOrPhone}
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Minimum 6 characters"
              icon="lock-closed-outline"
              secureTextEntry
              error={errors.password}
            />
            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password"
              icon="shield-checkmark-outline"
              secureTextEntry
              error={errors.confirmPassword}
            />
          </View>

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            size="lg"
            style={{ marginBottom: 20 }}
          />

          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.loginLink}>
            <Text style={styles.loginText}>
              Already have an account?{' '}
              <Text style={{ color: Colors.primary, fontWeight: '700' }}>Login</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 32,
    lineHeight: 20,
  },
  form: { marginBottom: 8 },
  loginLink: { alignItems: 'center' },
  loginText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
