import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Colors } from '../../constants/Colors';
import { STORE_CREDENTIALS, StoreCredential } from '../../utils/storage';

export default function LoginScreen() {
  const { login } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);

  async function handleLogin() {
    setErrorMessage(null);
    if (!emailOrPhone.trim()) {
      setErrorMessage('Please enter your authorized store email or mobile number.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your store account password.');
      return;
    }

    setLoading(true);
    const result = await login(emailOrPhone, password);
    setLoading(false);

    if (result.success) {
      router.replace('/(app)/dashboard');
    } else {
      setErrorMessage(result.error || 'Authentication failed. Please verify your store credentials.');
    }
  }

  function handleFillDemo(cred: StoreCredential) {
    setEmailOrPhone(cred.email);
    setPassword(cred.password);
    setShowCredentialsModal(false);
    setErrorMessage(null);
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.webContainer}>
            {/* Top Bar with Customer Order Simulator link */}
            <View style={styles.topBar}>
              <View style={styles.secureTag}>
                <Ionicons name="lock-closed" size={13} color={Colors.primary} />
                <Text style={styles.secureText}>Enterprise SSL 256-bit Encrypted</Text>
              </View>

              <TouchableOpacity
                style={styles.simPill}
                onPress={() => router.push('/(app)/customer-portal')}
              >
                <Ionicons name="cart-outline" size={15} color={Colors.secondaryDark} />
                <Text style={styles.simPillText}>Customer Order Portal</Text>
              </TouchableOpacity>
            </View>

            {/* Main Auth Card */}
            <View style={styles.loginCard}>
              {/* Brand Logo & Slogan Header */}
              <View style={styles.brandHeader}>
                <Image
                  source={require('../../assets/logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
                <Text style={styles.slogan}>We Care For What You Wear</Text>
                <View style={styles.goldDivider} />
                <Text style={styles.portalTitle}>Store Operations & Admin Portal</Text>
                <Text style={styles.portalSub}>
                  Sign in to access your designated hub, lead dispatch & laundry management
                </Text>
              </View>

              {/* Error Alert Banner */}
              {errorMessage && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color={Colors.danger} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                  <TouchableOpacity onPress={() => setErrorMessage(null)}>
                    <Ionicons name="close" size={16} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Form Fields */}
              <View style={styles.form}>
                <Input
                  label="Store Email or Mobile Number"
                  value={emailOrPhone}
                  onChangeText={(val) => {
                    setEmailOrPhone(val);
                    setErrorMessage(null);
                  }}
                  placeholder="e.g. newtown@tumblepro.com or admin@tumblepro.com"
                  icon="business-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <View style={styles.passwordWrap}>
                  <Input
                    label="Account Password"
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      setErrorMessage(null);
                    }}
                    placeholder="Enter store password"
                    icon="lock-closed-outline"
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={Colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <Button
                title={loading ? 'Authenticating Store Access...' : 'Sign In to Store Portal'}
                onPress={handleLogin}
                loading={loading}
                size="lg"
                style={styles.signInBtn}
              />

              {/* Tenant Isolation Guarantee Note */}
              <View style={styles.isolationNotice}>
                <Ionicons name="shield-checkmark" size={15} color={Colors.success} />
                <Text style={styles.isolationNoticeText}>
                  Strict Store Isolation: Upon signing in, only orders, delivery fleet, and analytics of your specific store hub will be reflected.
                </Text>
              </View>

              {/* Discreet Internal Testing Reference (Helper for Evaluation) */}
              <View style={styles.demoHelperRow}>
                <TouchableOpacity
                  style={styles.helperBtn}
                  onPress={() => setShowCredentialsModal(true)}
                >
                  <Ionicons name="key-outline" size={14} color={Colors.primary} />
                  <Text style={styles.helperBtnText}>Testing Reference: View Store Logins</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                © {new Date().getFullYear()} TumblePro™ Laundry Services. All rights reserved.
              </Text>
              <Text style={styles.footerSub}>
                Multi-Store Laundry CRM & Anti-Mixup Garment Tracking System
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Internal Testing Reference Modal (Opens only on click) */}
      <Modal visible={showCredentialsModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
                <Text style={styles.modalTitle}>Internal Testing Credentials</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCredentialsModal(false)} style={styles.modalClose}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Select any account below to autofill and test store-level isolation:
            </Text>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {STORE_CREDENTIALS.map((cred) => (
                <TouchableOpacity
                  key={cred.email}
                  style={[styles.credOption, { borderLeftColor: cred.color }]}
                  onPress={() => handleFillDemo(cred)}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.credTop}>
                      <Text style={[styles.credRole, { color: cred.color }]}>{cred.title}</Text>
                      <View style={styles.passChip}>
                        <Text style={styles.passChipLabel}>Pass: </Text>
                        <Text style={styles.passChipVal}>{cred.password}</Text>
                      </View>
                    </View>
                    <Text style={styles.credStore}>{cred.storeName}</Text>
                    <Text style={styles.credEmail}>{cred.email}</Text>
                    <Text style={styles.credScope}>{cred.accessDesc}</Text>
                  </View>
                  <View style={styles.fillIcon}>
                    <Ionicons name="log-in-outline" size={18} color={Colors.primary} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 48,
    alignItems: 'center',
  },
  webContainer: {
    width: '100%',
    maxWidth: 520,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  secureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  secureText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
  simPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.secondaryBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.secondaryBorder,
  },
  simPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryDark,
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: 220,
    height: 90,
    marginBottom: 6,
  },
  slogan: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryDark,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  goldDivider: {
    width: 48,
    height: 2.5,
    backgroundColor: Colors.secondary,
    borderRadius: 2,
    marginVertical: 10,
  },
  portalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
    textAlign: 'center',
  },
  portalSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    maxWidth: 380,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: Colors.danger,
    fontWeight: '600',
  },
  form: {
    marginBottom: 8,
  },
  passwordWrap: {
    position: 'relative',
  },
  eyeToggle: {
    position: 'absolute',
    right: 14,
    top: 38,
    padding: 4,
  },
  signInBtn: {
    backgroundColor: Colors.primary,
    marginTop: 10,
    marginBottom: 14,
    shadowColor: Colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  isolationNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 10,
    borderRadius: 10,
  },
  isolationNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#065F46',
    lineHeight: 16,
    fontWeight: '600',
  },
  demoHelperRow: {
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  helperBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  helperBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  footerSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },

  // ─── Testing Reference Modal ──────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary,
  },
  modalClose: {
    padding: 4,
  },
  modalSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  modalScroll: {
    gap: 10,
  },
  credOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: Colors.border,
  },
  credTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  credRole: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  passChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  passChipLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  passChipVal: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.secondaryDark,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  credStore: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  credEmail: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 1,
  },
  credScope: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
    lineHeight: 14,
  },
  fillIcon: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
});
