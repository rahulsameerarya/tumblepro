import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Order } from '../../utils/storage';

interface InvoiceModalProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
}

export default function InvoiceModal({ visible, order, onClose }: InvoiceModalProps) {
  if (!order) return null;

  const invoiceNumber = `INV-${(order.storeName.slice(0, 3) || 'HUB').toUpperCase()}-2026-${order.orderNumber}`;
  const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const deliveryDue = order.deliveryDate
    ? new Date(order.deliveryDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Pending Scheduling';

  // Compute subtotal and taxes
  const rawSubtotal = (order.items || []).reduce(
    (sum, it) => sum + (it.quantity || 1) * (it.unitPrice || 0),
    0
  );
  const subtotal = rawSubtotal > 0 ? rawSubtotal : order.totalAmount || 0;
  const isGstApplicable = subtotal > 0;
  const cgst = isGstApplicable ? Math.round(subtotal * 0.025 * 10) / 10 : 0;
  const sgst = isGstApplicable ? Math.round(subtotal * 0.025 * 10) / 10 : 0;
  const totalAmount = Math.round((subtotal + cgst + sgst) * 10) / 10;
  const totalQuantity = (order.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0);

  const handlePrint = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.modalSheet}>
          {/* Action Bar (Hidden on print) */}
          <View style={styles.actionBar}>
            <View style={styles.actionBarLeft}>
              <Ionicons name="document-text" size={20} color={Colors.primary} />
              <Text style={styles.actionBarTitle}>Tax Invoice Preview</Text>
            </View>
            <View style={styles.actionBarRight}>
              <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
                <Ionicons name="print" size={16} color="#FFFFFF" />
                <Text style={styles.printBtnText}>Print / Save PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={20} color="#0F2C59" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Printable Invoice Container */}
          <ScrollView contentContainerStyle={styles.invoiceScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.invoiceSheet}>
              {/* Top Invoice Header */}
              <View style={styles.topHeaderRow}>
                <View style={styles.companyWrap}>
                  <View style={styles.logoPill}>
                    <Text style={styles.logoText}>TUMBLE<Text style={{ color: '#C59A27' }}>PRO</Text></Text>
                  </View>
                  <Text style={styles.companySub}>PREMIUM FABRIC & LAUNDRY CARE</Text>
                  <Text style={styles.hubDetailsText}>
                    {order.storeName.replace('TumblePro - ', '')} Hub
                  </Text>
                  <Text style={styles.hubSubText}>GSTIN: 19AAACT8765A1Z5 • FSSAI/MSME Regd.</Text>
                  <Text style={styles.hubSubText}>Support: +91 98301 11001 • care@tumblepro.com</Text>
                </View>

                <View style={styles.invoiceMetaWrap}>
                  <View style={styles.invoiceBadge}>
                    <Text style={styles.invoiceBadgeText}>TAX INVOICE</Text>
                  </View>
                  <Text style={styles.metaRowText}>
                    <Text style={styles.metaLabel}>Invoice No: </Text>
                    <Text style={styles.metaValue}>{invoiceNumber}</Text>
                  </Text>
                  <Text style={styles.metaRowText}>
                    <Text style={styles.metaLabel}>Date: </Text>
                    <Text style={styles.metaValue}>{invoiceDate}</Text>
                  </Text>
                  <Text style={styles.metaRowText}>
                    <Text style={styles.metaLabel}>Order Ref: </Text>
                    <Text style={styles.metaValue}>#{order.orderNumber}</Text>
                  </Text>
                  <Text style={styles.metaRowText}>
                    <Text style={styles.metaLabel}>Delivery Due: </Text>
                    <Text style={styles.metaValue}>{deliveryDue}</Text>
                  </Text>
                </View>
              </View>

              <View style={styles.dividerLine} />

              {/* Billed To Customer Details */}
              <View style={styles.customerSection}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionHeader}>BILLED TO (CUSTOMER):</Text>
                  <Text style={styles.customerName}>{order.customerName}</Text>
                  <Text style={styles.customerContact}>Phone: {order.customerPhone}</Text>
                  <Text style={styles.customerAddress} numberOfLines={3}>
                    {order.customerAddress} (PIN: {order.pincode})
                  </Text>
                </View>

                <View style={styles.orderSummaryBox}>
                  <Text style={styles.sectionHeader}>LOGISTICS INFO:</Text>
                  <Text style={styles.summaryInfoText}>
                    • Service: <Text style={{ fontWeight: '800' }}>{order.serviceType.toUpperCase().replace('_', ' ')}</Text>
                  </Text>
                  <Text style={styles.summaryInfoText}>
                    • Mode: <Text style={{ fontWeight: '800' }}>{order.deliveryMode === 'walkin' ? 'Store Walk-in' : 'Doorstep Pickup & Delivery'}</Text>
                  </Text>
                  <Text style={styles.summaryInfoText}>
                    • Bag Tag: <Text style={{ fontWeight: '800', color: Colors.primary }}>{order.bagTagNumber || order.tagInfo?.tagId || 'N/A'}</Text>
                  </Text>
                </View>
              </View>

              {/* Itemized Table */}
              <View style={styles.table}>
                {/* Table Header */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.thText, { width: 32 }]}>#</Text>
                  <Text style={[styles.thText, { flex: 2 }]}>Item Description</Text>
                  <Text style={[styles.thText, { flex: 1 }]}>Packaging</Text>
                  <Text style={[styles.thText, { width: 44, textAlign: 'center' }]}>Qty</Text>
                  <Text style={[styles.thText, { width: 70, textAlign: 'right' }]}>Rate (₹)</Text>
                  <Text style={[styles.thText, { width: 80, textAlign: 'right' }]}>Amount (₹)</Text>
                </View>

                {/* Table Rows */}
                {(order.items && order.items.length > 0 ? order.items : []).map((it, idx) => {
                  const qty = it.quantity || 1;
                  const rate = it.unitPrice || 0;
                  const lineTotal = qty * rate;
                  const packing = it.packingType || order.packingType || 'Fold & Pack';

                  return (
                    <View key={idx} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                      <Text style={[styles.tdText, { width: 32 }]}>{idx + 1}</Text>
                      <Text style={[styles.tdText, { flex: 2, fontWeight: '700' }]}>{it.itemName}</Text>
                      <Text style={[styles.tdText, { flex: 1, color: '#64748B' }]}>{packing}</Text>
                      <Text style={[styles.tdText, { width: 44, textAlign: 'center', fontWeight: '800' }]}>
                        {qty}
                      </Text>
                      <Text style={[styles.tdText, { width: 70, textAlign: 'right' }]}>
                        {rate > 0 ? `₹${rate}` : 'Included'}
                      </Text>
                      <Text style={[styles.tdText, { width: 80, textAlign: 'right', fontWeight: '800' }]}>
                        {lineTotal > 0 ? `₹${lineTotal}` : '—'}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Invoice Calculations & Payment Stamp */}
              <View style={styles.bottomTotalsRow}>
                {/* Left: Payment Stamp & Guarantees */}
                <View style={styles.stampColumn}>
                  <View
                    style={[
                      styles.paymentStamp,
                      order.paymentStatus === 'Paid' ? styles.stampPaid : styles.stampUnpaid,
                    ]}
                  >
                    <Ionicons
                      name={order.paymentStatus === 'Paid' ? 'checkmark-circle' : 'time-outline'}
                      size={20}
                      color={order.paymentStatus === 'Paid' ? '#15803D' : '#B45309'}
                    />
                    <View>
                      <Text
                        style={[
                          styles.stampStatusText,
                          order.paymentStatus === 'Paid' ? { color: '#15803D' } : { color: '#B45309' },
                        ]}
                      >
                        {order.paymentStatus === 'Paid' ? 'PAID IN FULL' : 'PAYMENT DUE ON DELIVERY'}
                      </Text>
                      <Text style={styles.stampMethodText}>
                        {order.paymentStatus === 'Paid'
                          ? `Method: ${order.paymentMethod || 'UPI / Cash'}`
                          : 'Accepted: UPI QR Code / Cash / Card'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.guaranteeBox}>
                    <Text style={styles.guaranteeTitle}>🔒 TumblePro Fabric Care Guarantee</Text>
                    <Text style={styles.guaranteeText}>
                      • Pre-conditioned water & German wash chemistry.{'\n'}
                      • Clothes sealed with individual barcode anti-mixup tags.{'\n'}
                      • Full insurance against fabric damage or misplacement.
                    </Text>
                  </View>
                </View>

                {/* Right: Subtotal, Taxes, Grand Total */}
                <View style={styles.totalsColumn}>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Total Quantity:</Text>
                    <Text style={styles.calcVal}>{totalQuantity} pcs</Text>
                  </View>

                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Item Subtotal:</Text>
                    <Text style={styles.calcVal}>₹{subtotal.toLocaleString('en-IN')}</Text>
                  </View>

                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>CGST (2.5%):</Text>
                    <Text style={styles.calcVal}>₹{cgst.toFixed(2)}</Text>
                  </View>

                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>SGST (2.5%):</Text>
                    <Text style={styles.calcVal}>₹{sgst.toFixed(2)}</Text>
                  </View>

                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Doorstep Pickup & Delivery:</Text>
                    <Text style={[styles.calcVal, { color: '#15803D' }]}>FREE</Text>
                  </View>

                  <View style={styles.calcDivider} />

                  <View style={styles.grandTotalRow}>
                    <Text style={styles.grandTotalLabel}>TOTAL AMOUNT:</Text>
                    <Text style={styles.grandTotalVal}>₹{totalAmount.toLocaleString('en-IN')}</Text>
                  </View>
                </View>
              </View>

              {/* Invoice Footer */}
              <View style={styles.invoiceFooter}>
                <Text style={styles.footerNote}>
                  This is a computer generated tax invoice and does not require a physical signature.
                  Thank you for choosing TumblePro Laundry Services!
                </Text>
                <Text style={styles.footerPowered}>www.tumblepro.com • Kolkata • Itanagar • Tinsukia</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 44, 89, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 820,
    maxHeight: '94%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  actionBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBarTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F2C59',
  },
  actionBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  printBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceScroll: {
    padding: 20,
  },
  invoiceSheet: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 24,
  },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 20,
    flexWrap: 'wrap',
  },
  companyWrap: {
    flex: 1,
    minWidth: 260,
  },
  logoPill: {
    backgroundColor: '#0F2C59',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  companySub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  hubDetailsText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F2C59',
  },
  hubSubText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    fontWeight: '600',
  },
  invoiceMetaWrap: {
    alignItems: 'flex-end',
    minWidth: 200,
  },
  invoiceBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 8,
  },
  invoiceBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  metaRowText: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 3,
  },
  metaLabel: {
    fontWeight: '600',
    color: '#64748B',
  },
  metaValue: {
    fontWeight: '800',
    color: '#0F2C59',
  },
  dividerLine: {
    height: 1.5,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  customerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F2C59',
  },
  customerContact: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
    marginTop: 2,
  },
  customerAddress: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    lineHeight: 17,
  },
  orderSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 240,
  },
  summaryInfoText: {
    fontSize: 12,
    color: '#334155',
    marginVertical: 2,
  },
  table: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#CBD5E1',
  },
  thText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F2C59',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  tdText: {
    fontSize: 12,
    color: '#0F2C59',
  },
  bottomTotalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  stampColumn: {
    flex: 1,
    minWidth: 260,
  },
  paymentStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  stampPaid: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  stampUnpaid: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  stampStatusText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  stampMethodText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    fontWeight: '600',
  },
  guaranteeBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  guaranteeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F2C59',
    marginBottom: 4,
  },
  guaranteeText: {
    fontSize: 10,
    color: '#64748B',
    lineHeight: 15,
  },
  totalsColumn: {
    width: 260,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  calcLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  calcVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F2C59',
  },
  calcDivider: {
    height: 1,
    backgroundColor: '#CBD5E1',
    marginVertical: 8,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  grandTotalLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F2C59',
  },
  grandTotalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#15803D',
  },
  invoiceFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
    alignItems: 'center',
  },
  footerNote: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 14,
  },
  footerPowered: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 4,
  },
});
