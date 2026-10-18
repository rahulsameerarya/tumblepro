import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Order } from '../../utils/storage';
import Button from '../ui/Button';

interface PaymentModalProps {
  visible: boolean;
  order: Order;
  onClose: () => void;
  onSuccess: (paymentMethod: string) => Promise<void> | void;
}

type PaymentMethodType = 'cash' | 'upi_qr' | 'online_gateway';

export default function PaymentModal({ visible, order, onClose, onSuccess }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('upi_qr');
  const [loading, setLoading] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [cashTendered, setCashTendered] = useState(String(order.totalAmount));
  const [gatewaySubMethod, setGatewaySubMethod] = useState<'card' | 'netbanking' | 'wallet'>('card');
  const [cardNumber, setCardNumber] = useState('4532 8920 1192 4892');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('883');
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  const upiId = 'tumblepro@okaxis';
  const upiPayee = 'TumblePro Laundry';
  const upiIntent = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiPayee)}&am=${order.totalAmount}&cu=INR&tn=Order-${order.orderNumber}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiIntent)}`;

  const total = order.totalAmount || 0;
  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeToReturn = Math.max(0, tenderedNum - total);

  const handleCopyUpi = () => {
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleOpenUpiApp = () => {
    Linking.openURL(upiIntent).catch(() => {
      // In web browser or if no UPI app installed
      alert(`UPI Intent: ${upiIntent}\nYou can scan the QR code with any UPI app.`);
    });
  };

  const handleProcessCash = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setPaymentSuccessMsg(`Cash payment of ₹${total.toLocaleString('en-IN')} confirmed! Change returned: ₹${changeToReturn.toLocaleString('en-IN')}`);
    await onSuccess('Cash');
    setLoading(false);
    setTimeout(() => {
      setPaymentSuccessMsg(null);
      onClose();
    }, 1400);
  };

  const handleProcessUpi = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    const txnId = `UPI${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    setPaymentSuccessMsg(`UPI Payment Verified! Ref: ${txnId}`);
    await onSuccess('UPI');
    setLoading(false);
    setTimeout(() => {
      setPaymentSuccessMsg(null);
      onClose();
    }, 1400);
  };

  const handleProcessGateway = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const txnId = `TXN_TP_${Date.now().toString().slice(-8)}`;
    setPaymentSuccessMsg(`Online Payment Approved! Txn ID: ${txnId}`);
    await onSuccess('Online Gateway');
    setLoading(false);
    setTimeout(() => {
      setPaymentSuccessMsg(null);
      onClose();
    }, 1400);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="card" size={20} color={Colors.primary} />
                <Text style={styles.title}>Payment Checkout</Text>
              </View>
              <Text style={styles.subTitle}>
                Order #{order.orderNumber} • {order.customerName}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Amount Due Banner */}
          <View style={styles.amountBanner}>
            <Text style={styles.amountLabel}>Total Payable Amount:</Text>
            <Text style={styles.amountValue}>₹{total.toLocaleString('en-IN')}</Text>
          </View>

          {paymentSuccessMsg ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={54} color={Colors.success} />
              <Text style={styles.successTitle}>Payment Successful!</Text>
              <Text style={styles.successDesc}>{paymentSuccessMsg}</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
              {/* Payment Mode Selector Tabs */}
              <View style={styles.methodTabs}>
                <TouchableOpacity
                  style={[styles.methodTab, selectedMethod === 'upi_qr' && styles.methodTabActive]}
                  onPress={() => setSelectedMethod('upi_qr')}
                >
                  <Ionicons
                    name="qr-code-outline"
                    size={16}
                    color={selectedMethod === 'upi_qr' ? '#FFFFFF' : Colors.primary}
                  />
                  <Text style={[styles.methodTabText, selectedMethod === 'upi_qr' && styles.methodTabTextActive]}>
                    UPI QR Code
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.methodTab, selectedMethod === 'cash' && styles.methodTabActive]}
                  onPress={() => setSelectedMethod('cash')}
                >
                  <Ionicons
                    name="cash-outline"
                    size={16}
                    color={selectedMethod === 'cash' ? '#FFFFFF' : Colors.primary}
                  />
                  <Text style={[styles.methodTabText, selectedMethod === 'cash' && styles.methodTabTextActive]}>
                    Cash on Hand
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.methodTab, selectedMethod === 'online_gateway' && styles.methodTabActive]}
                  onPress={() => setSelectedMethod('online_gateway')}
                >
                  <Ionicons
                    name="card-outline"
                    size={16}
                    color={selectedMethod === 'online_gateway' ? '#FFFFFF' : Colors.primary}
                  />
                  <Text style={[styles.methodTabText, selectedMethod === 'online_gateway' && styles.methodTabTextActive]}>
                    Free Gateway
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 1. UPI QR Code Method */}
              {selectedMethod === 'upi_qr' && (
                <View style={styles.upiContainer}>
                  <View style={styles.qrCard}>
                    <Text style={styles.qrHint}>Scan with any UPI App to Pay</Text>
                    <Image source={{ uri: qrImageUrl }} style={styles.qrImage} resizeMode="contain" />
                    <View style={styles.upiAppsRow}>
                      <Text style={styles.upiAppBadge}>GPay</Text>
                      <Text style={styles.upiAppBadge}>PhonePe</Text>
                      <Text style={styles.upiAppBadge}>Paytm</Text>
                      <Text style={styles.upiAppBadge}>BHIM</Text>
                    </View>
                  </View>

                  <View style={styles.upiDetailsBox}>
                    <View style={styles.upiDetailRow}>
                      <Text style={styles.upiDetailLabel}>UPI ID:</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.upiDetailVal}>{upiId}</Text>
                        <TouchableOpacity onPress={handleCopyUpi} style={styles.copyBtn}>
                          <Ionicons name={copiedUpi ? 'checkmark' : 'copy-outline'} size={14} color={Colors.primary} />
                          <Text style={styles.copyText}>{copiedUpi ? 'Copied' : 'Copy'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.upiDetailRow}>
                      <Text style={styles.upiDetailLabel}>Payee Name:</Text>
                      <Text style={styles.upiDetailVal}>{upiPayee}</Text>
                    </View>

                    <View style={styles.upiDetailRow}>
                      <Text style={styles.upiDetailLabel}>Order Note:</Text>
                      <Text style={styles.upiDetailVal}>Order #{order.orderNumber}</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.openUpiBtn} onPress={handleOpenUpiApp}>
                    <Ionicons name="open-outline" size={16} color={Colors.primary} />
                    <Text style={styles.openUpiText}>Open in UPI App on this Device</Text>
                  </TouchableOpacity>

                  <Button
                    title={`✓ Confirm UPI Received (₹${total.toLocaleString('en-IN')})`}
                    onPress={handleProcessUpi}
                    loading={loading}
                    size="md"
                    style={{ marginTop: 14 }}
                  />
                </View>
              )}

              {/* 2. Cash Payment Method */}
              {selectedMethod === 'cash' && (
                <View style={styles.cashContainer}>
                  <View style={styles.cashNotice}>
                    <Ionicons name="cash" size={24} color={Colors.success} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cashNoticeTitle}>Doorstep / Counter Cash Collection</Text>
                      <Text style={styles.cashNoticeSub}>
                        Collect cash directly from customer at delivery or pickup. Calculate exact change below:
                      </Text>
                    </View>
                  </View>

                  <View style={styles.calcBox}>
                    <View style={styles.calcRow}>
                      <Text style={styles.calcLabel}>Amount Due:</Text>
                      <Text style={styles.calcVal}>₹{total.toLocaleString('en-IN')}</Text>
                    </View>

                    <View style={styles.tenderRow}>
                      <Text style={styles.tenderLabel}>Cash Tendered (₹):</Text>
                      <TextInput
                        value={cashTendered}
                        onChangeText={setCashTendered}
                        keyboardType="numeric"
                        placeholder="e.g. 500"
                        style={styles.tenderInput}
                      />
                    </View>

                    <View style={styles.changeRow}>
                      <Text style={styles.changeLabel}>Change to Return:</Text>
                      <Text style={styles.changeVal}>₹{changeToReturn.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>

                  {/* Quick Tender Shortcuts */}
                  <View style={styles.quickShortcuts}>
                    {[total, 500, 1000, 2000].map((amt) => {
                      if (amt < total && amt !== total) return null;
                      return (
                        <TouchableOpacity
                          key={amt}
                          style={styles.shortcutBtn}
                          onPress={() => setCashTendered(String(amt))}
                        >
                          <Text style={styles.shortcutText}>₹{amt}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Button
                    title={`✓ Confirm Cash Received (₹${total.toLocaleString('en-IN')})`}
                    onPress={handleProcessCash}
                    loading={loading}
                    size="md"
                    style={{ marginTop: 14 }}
                  />
                </View>
              )}

              {/* 3. Free Online Gateway Simulator */}
              {selectedMethod === 'online_gateway' && (
                <View style={styles.gatewayContainer}>
                  <View style={styles.gatewayBadge}>
                    <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
                    <Text style={styles.gatewayBadgeText}>Instant Sandbox Gateway (Zero Fees)</Text>
                  </View>

                  {/* Sub-Methods */}
                  <View style={styles.gwSubRow}>
                    <TouchableOpacity
                      style={[styles.gwSubBtn, gatewaySubMethod === 'card' && styles.gwSubBtnActive]}
                      onPress={() => setGatewaySubMethod('card')}
                    >
                      <Text style={[styles.gwSubText, gatewaySubMethod === 'card' && styles.gwSubTextActive]}>
                        💳 Cards
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.gwSubBtn, gatewaySubMethod === 'netbanking' && styles.gwSubBtnActive]}
                      onPress={() => setGatewaySubMethod('netbanking')}
                    >
                      <Text style={[styles.gwSubText, gatewaySubMethod === 'netbanking' && styles.gwSubTextActive]}>
                        🏦 Net Banking
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.gwSubBtn, gatewaySubMethod === 'wallet' && styles.gwSubBtnActive]}
                      onPress={() => setGatewaySubMethod('wallet')}
                    >
                      <Text style={[styles.gwSubText, gatewaySubMethod === 'wallet' && styles.gwSubTextActive]}>
                        ⚡ Wallets
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {gatewaySubMethod === 'card' && (
                    <View style={styles.cardForm}>
                      <Text style={styles.fieldLabel}>Card Number</Text>
                      <TextInput
                        value={cardNumber}
                        onChangeText={setCardNumber}
                        placeholder="4532 8920 1192 4892"
                        style={styles.cardInput}
                      />

                      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fieldLabel}>Valid Thru</Text>
                          <TextInput
                            value={cardExpiry}
                            onChangeText={setCardExpiry}
                            placeholder="MM/YY"
                            style={styles.cardInput}
                          />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={styles.fieldLabel}>CVV</Text>
                          <TextInput
                            value={cardCvv}
                            onChangeText={setCardCvv}
                            placeholder="123"
                            secureTextEntry
                            style={styles.cardInput}
                          />
                        </View>
                      </View>
                    </View>
                  )}

                  {gatewaySubMethod === 'netbanking' && (
                    <View style={styles.banksGrid}>
                      {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'Punjab National'].map(
                        (bank, idx) => (
                          <TouchableOpacity key={idx} style={[styles.bankChip, idx === 0 && styles.bankChipActive]}>
                            <Ionicons name="business-outline" size={14} color={idx === 0 ? Colors.primary : Colors.textSecondary} />
                            <Text style={[styles.bankChipText, idx === 0 && styles.bankChipTextActive]}>{bank}</Text>
                          </TouchableOpacity>
                        )
                      )}
                    </View>
                  )}

                  {gatewaySubMethod === 'wallet' && (
                    <View style={styles.banksGrid}>
                      {['Paytm Wallet', 'Amazon Pay', 'Mobikwik', 'Freecharge'].map((w, idx) => (
                        <TouchableOpacity key={idx} style={[styles.bankChip, idx === 0 && styles.bankChipActive]}>
                          <Ionicons name="wallet-outline" size={14} color={idx === 0 ? Colors.primary : Colors.textSecondary} />
                          <Text style={[styles.bankChipText, idx === 0 && styles.bankChipTextActive]}>{w}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <Button
                    title={`Pay Now ₹${total.toLocaleString('en-IN')} (Free Gateway)`}
                    onPress={handleProcessGateway}
                    loading={loading}
                    size="md"
                    style={{ marginTop: 14 }}
                  />
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  subTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primarySubtle,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
    marginBottom: 14,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primary,
  },
  scroll: {
    paddingBottom: 24,
  },
  methodTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginBottom: 16,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  methodTabActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  methodTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  methodTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  upiContainer: {
    alignItems: 'center',
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  qrHint: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  qrImage: {
    width: 200,
    height: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  upiAppsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  upiAppBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  upiDetailsBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  upiDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upiDetailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  upiDetailVal: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  copyText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  openUpiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  openUpiText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  cashContainer: {},
  cashNotice: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#ECFDF5',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 14,
  },
  cashNoticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.success,
  },
  cashNoticeSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  calcBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  calcVal: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  tenderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tenderLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  tenderInput: {
    width: 120,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 15,
    fontWeight: '900',
    color: Colors.primary,
    textAlign: 'right',
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  changeLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.success,
  },
  changeVal: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.success,
  },
  quickShortcuts: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  shortcutBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shortcutText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  gatewayContainer: {},
  gatewayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primarySubtle,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  gatewayBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  gwSubRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  gwSubBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gwSubBtnActive: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.primary,
  },
  gwSubText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  gwSubTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  cardForm: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  cardInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  banksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '48%',
  },
  bankChipActive: {
    backgroundColor: Colors.primarySubtle,
    borderColor: Colors.primary,
  },
  bankChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  bankChipTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  successBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 10,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.success,
  },
  successDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
