import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { LaundryTagInfo, Order } from '../../utils/storage';

interface LaundryTagCardProps {
  tagInfo: LaundryTagInfo;
  order: Order;
  compact?: boolean;
}

export interface GarmentClothTag {
  orderIdNumeric: string;
  storeName: string;
  customerName: string;
  serviceCode: string;
  serviceLabel: string;
  clothIndex: number;
  totalClothes: number;
  packingType: 'Hanger Cover' | 'Fold & Pack';
  deliveryDateFormatted: string;
  clothName: string;
  tagId: string;
}

/**
 * Service Code Mapper
 * Dry Clean -> DC, Wash & Fold -> W&F, Wash & Iron -> W&I, Steam Iron -> IRON
 */
function getServiceCode(serviceType: string): { code: string; label: string } {
  const s = (serviceType || '').toLowerCase();
  if (s.includes('dry') || s === 'dc') return { code: 'DC', label: 'Dry Clean' };
  if (s.includes('fold') || s === 'wf') return { code: 'W&F', label: 'Wash & Fold' };
  if (s.includes('iron') && s.includes('wash')) return { code: 'W&I', label: 'Wash & Iron' };
  if (s.includes('iron')) return { code: 'IRON', label: 'Steam Press' };
  return { code: 'DC', label: 'Laundry Service' };
}

/**
 * Extracts a numeric Order ID matching the user reference photo (e.g. 8767)
 */
function getNumericOrderId(orderNumber: string): string {
  const digits = orderNumber.replace(/\D/g, '');
  if (digits.length >= 4) return digits.slice(-4);
  if (digits.length > 0) return digits;
  return orderNumber.slice(-4);
}

/**
 * Formats delivery date matching reference photo: "18 Mar, 19 Mon"
 */
function formatDeliveryDate(dateStr?: string, createdStr?: string): string {
  let d: Date;
  if (dateStr) {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      d = parsed;
    } else {
      const lower = dateStr.toLowerCase();
      if (lower.includes('today')) {
        d = new Date();
      } else if (lower.includes('tomorrow')) {
        d = new Date(Date.now() + 24 * 60 * 60 * 1000);
      } else {
        const base = createdStr ? new Date(createdStr) : new Date();
        const baseTime = !isNaN(base.getTime()) ? base.getTime() : Date.now();
        d = new Date(baseTime + 2 * 24 * 60 * 60 * 1000);
      }
    }
  } else {
    const base = createdStr ? new Date(createdStr) : new Date();
    const baseTime = !isNaN(base.getTime()) ? base.getTime() : Date.now();
    d = new Date(baseTime + 2 * 24 * 60 * 60 * 1000);
  }

  if (isNaN(d.getTime())) {
    d = new Date();
  }

  const day = d.getDate();
  const month = d.toLocaleString('en-IN', { month: 'short' });
  const weekday = d.toLocaleString('en-IN', { weekday: 'short' });
  const yearShort = String(d.getFullYear()).slice(-2);
  return `${day} ${month}, ${yearShort} ${weekday}`;
}

/**
 * Explodes an order's items into individual garment tags (e.g. 8 of 10)
 */
export function buildGarmentTagsList(
  order: Order,
  customPacking?: 'Hanger Cover' | 'Fold & Pack'
): GarmentClothTag[] {
  const orderIdNumeric = getNumericOrderId(order.orderNumber);
  const storeName = order.storeName ? order.storeName.replace('TumblePro - ', '') : 'Hub';
  const customerName = order.customerName ? order.customerName.toUpperCase() : 'VALUED CUSTOMER';
  const { code: serviceCode, label: serviceLabel } = getServiceCode(order.serviceType);
  const deliveryDateFormatted = formatDeliveryDate(order.deliveryDate, order.createdAt);

  const tags: GarmentClothTag[] = [];

  // Expand items by their quantity
  const items = order.items && order.items.length > 0
    ? order.items
    : [{ itemId: 'item-1', itemName: 'Mixed Apparel', quantity: 1, unitPrice: order.totalAmount }];

  const totalClothes = items.reduce((sum, it) => sum + (it.quantity || 1), 0);

  let currentIndex = 1;
  for (const item of items) {
    const qty = item.quantity || 1;
    // Clean cloth name (e.g. "Saree", "Shirt", "Denim Jeans")
    const cleanClothName = item.itemName
      .replace(/\s*\(.*?\)\s*/g, '')
      .replace(/\s*\/\s*.*/, '')
      .trim();

    // Prioritize individual item-level packingType first!
    const packingType: 'Hanger Cover' | 'Fold & Pack' =
      item.packingType || customPacking || (order as any).packingType || 'Hanger Cover';

    for (let q = 0; q < qty; q++) {
      tags.push({
        orderIdNumeric,
        storeName,
        customerName,
        serviceCode,
        serviceLabel,
        clothIndex: currentIndex,
        totalClothes,
        packingType,
        deliveryDateFormatted,
        clothName: cleanClothName || 'Garment',
        tagId: `${order.tagInfo?.tagId || 'TAG'}-${currentIndex}`,
      });
      currentIndex++;
    }
  }

  return tags;
}

export default function LaundryTagCard({ tagInfo, order, compact = false }: LaundryTagCardProps) {
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [tagFilter, setTagFilter] = useState<'All' | 'Hanger Cover' | 'Fold & Pack'>('All');
  const [printFilter, setPrintFilter] = useState<'All' | 'Hanger Cover' | 'Fold & Pack'>('All');
  const [selectedTagIndex, setSelectedTagIndex] = useState(0);

  const allGarmentTags = React.useMemo(() => buildGarmentTagsList(order), [order]);

  const hangerTags = React.useMemo(
    () => allGarmentTags.filter((t) => t.packingType === 'Hanger Cover'),
    [allGarmentTags]
  );
  const foldTags = React.useMemo(
    () => allGarmentTags.filter((t) => t.packingType === 'Fold & Pack'),
    [allGarmentTags]
  );

  const activeFilteredTags = React.useMemo(() => {
    if (tagFilter === 'Hanger Cover') return hangerTags;
    if (tagFilter === 'Fold & Pack') return foldTags;
    return allGarmentTags;
  }, [tagFilter, hangerTags, foldTags, allGarmentTags]);

  const printableTags = React.useMemo(() => {
    if (printFilter === 'Hanger Cover') return hangerTags;
    if (printFilter === 'Fold & Pack') return foldTags;
    return allGarmentTags;
  }, [printFilter, hangerTags, foldTags, allGarmentTags]);

  const safeIndex = Math.min(selectedTagIndex, Math.max(0, activeFilteredTags.length - 1));
  const activeTag = activeFilteredTags[safeIndex] || allGarmentTags[0];
  const totalClothes = allGarmentTags.length;

  const handleTriggerPrint = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
    }
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactRow}>
          <View style={styles.compactTagBadge}>
            <Text style={styles.compactTagOrder}>#{activeTag?.orderIdNumeric || order.orderNumber}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.compactCustomer}>{activeTag?.customerName || order.customerName}</Text>
            <Text style={styles.compactMeta}>
              {activeTag?.storeName || 'Store'} • ⭕ {activeTag?.serviceCode || 'SVC'} • {totalClothes} Tags ({hangerTags.length} 🧥 / {foldTags.length} 📦)
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowPrintModal(true)} style={styles.compactPrintBtn}>
            <Ionicons name="pricetag" size={16} color={Colors.primary} />
            <Text style={styles.compactPrintText}>Tags ({totalClothes})</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.cardWrapper}>
      {/* Top Controls Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerTitleRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="pricetag" size={16} color="#fff" />
          </View>
          <View>
            <Text style={styles.mainTitle}>Garment Attachment Tags</Text>
            <Text style={styles.mainSubtitle}>
              {hangerTags.length > 0 && foldTags.length > 0
                ? `Split Packaging: ${hangerTags.length} on Hanger Cover • ${foldTags.length} on Fold & Pack (${totalClothes} Total)`
                : `Formatted to Print, Cut & Pin to Each Cloth (${totalClothes} Total Pcs)`}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.printAllBtn} onPress={() => setShowPrintModal(true)}>
          <Ionicons name="print-outline" size={16} color="#fff" />
          <Text style={styles.printAllBtnText}>Print Tags ({totalClothes})</Text>
        </TouchableOpacity>
      </View>

      {/* Two Sets of Tags Switcher (All vs Hanger Cover vs Fold & Pack) */}
      <View style={styles.packingSwitcherRow}>
        <Text style={styles.packingLabel}>Tag Sets:</Text>
        <TouchableOpacity
          style={[styles.packPill, tagFilter === 'All' && styles.packPillActive]}
          onPress={() => {
            setTagFilter('All');
            setSelectedTagIndex(0);
          }}
        >
          <Ionicons
            name="pricetags"
            size={14}
            color={tagFilter === 'All' ? '#fff' : Colors.primary}
          />
          <Text
            style={[
              styles.packPillText,
              tagFilter === 'All' && styles.packPillTextActive,
            ]}
          >
            All Tags ({allGarmentTags.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.packPill, tagFilter === 'Hanger Cover' && styles.packPillActive]}
          onPress={() => {
            setTagFilter('Hanger Cover');
            setSelectedTagIndex(0);
          }}
        >
          <Ionicons
            name="shirt-outline"
            size={14}
            color={tagFilter === 'Hanger Cover' ? '#fff' : Colors.primary}
          />
          <Text
            style={[
              styles.packPillText,
              tagFilter === 'Hanger Cover' && styles.packPillTextActive,
            ]}
          >
            🧥 Hanger Cover ({hangerTags.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.packPill, tagFilter === 'Fold & Pack' && styles.packPillActive]}
          onPress={() => {
            setTagFilter('Fold & Pack');
            setSelectedTagIndex(0);
          }}
        >
          <Ionicons
            name="cube-outline"
            size={14}
            color={tagFilter === 'Fold & Pack' ? '#fff' : Colors.primary}
          />
          <Text
            style={[
              styles.packPillText,
              tagFilter === 'Fold & Pack' && styles.packPillTextActive,
            ]}
          >
            📦 Fold & Pack ({foldTags.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tag Slider / Carousel Controls */}
      <View style={styles.tagCarouselBar}>
        <Text style={styles.carouselText}>
          Previewing <Text style={{ fontWeight: '900', color: Colors.primary }}>{safeIndex + 1}</Text> of {activeFilteredTags.length}: <Text style={{ color: Colors.secondaryDark, fontWeight: '800' }}>{activeTag?.clothName}</Text> ({activeTag?.packingType})
        </Text>
        <View style={styles.arrowRow}>
          <TouchableOpacity
            style={[styles.arrowBtn, safeIndex === 0 && styles.arrowDisabled]}
            disabled={safeIndex === 0}
            onPress={() => setSelectedTagIndex((prev) => Math.max(0, prev - 1))}
          >
            <Ionicons name="chevron-back" size={16} color={safeIndex === 0 ? '#CBD5E1' : Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.arrowBtn, safeIndex === activeFilteredTags.length - 1 && styles.arrowDisabled]}
            disabled={safeIndex === activeFilteredTags.length - 1}
            onPress={() => setSelectedTagIndex((prev) => Math.min(activeFilteredTags.length - 1, prev + 1))}
          >
            <Ionicons name="chevron-forward" size={16} color={safeIndex === activeFilteredTags.length - 1 ? '#CBD5E1' : Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Physical Garment Tag Preview (Exact Match to User Image) */}
      <View style={styles.tagCanvas}>
        <View style={styles.scissorsCutLine}>
          <Ionicons name="cut-outline" size={14} color="#64748B" />
          <Text style={styles.cutText}>✂ - - - - - - - - - - - - - - - - - - CUT ALONG DOTTED LINE - - - - - - - - - - - - - - - - - - ✂</Text>
        </View>

        {activeTag && <PhysicalClothTag tag={activeTag} />}

        <View style={styles.scissorsCutLine}>
          <Ionicons name="cut-outline" size={14} color="#64748B" />
          <Text style={styles.cutText}>✂ - - - - - - - - - - - - - - - - - - CUT ALONG DOTTED LINE - - - - - - - - - - - - - - - - - - ✂</Text>
        </View>
      </View>

      {/* Quick Cloth Thumbnails Strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbStrip}>
        {activeFilteredTags.map((gt, idx) => {
          const isSelected = safeIndex === idx;
          return (
            <TouchableOpacity
              key={idx}
              style={[styles.thumbPill, isSelected && styles.thumbPillActive]}
              onPress={() => setSelectedTagIndex(idx)}
            >
              <Text style={[styles.thumbIndex, isSelected && styles.thumbIndexActive]}>
                #{gt.clothIndex}
              </Text>
              <Text style={[styles.thumbName, isSelected && styles.thumbNameActive]} numberOfLines={1}>
                {gt.clothName}
              </Text>
              <Text style={{ fontSize: 9, color: isSelected ? Colors.primary : Colors.textMuted }}>
                {gt.packingType === 'Hanger Cover' ? '🧥' : '📦'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Print Sheet Modal (Print All or Filtered Tag Sets) */}
      <Modal visible={showPrintModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalSheetHeader}>
              <View>
                <Text style={styles.modalSheetTitle}>
                  Print Garment Tags Batch ({printableTags.length} Clothes)
                </Text>
                <Text style={styles.modalSheetSub}>
                  Order #{activeTag?.orderIdNumeric || order.orderNumber} • {activeTag?.customerName} • {activeTag?.storeName}
                </Text>
              </View>

              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.printActionBtn} onPress={handleTriggerPrint}>
                  <Ionicons name="print" size={18} color="#fff" />
                  <Text style={styles.printActionText}>Print Batch ({printableTags.length})</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setShowPrintModal(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Print Batch Selector Tabs */}
            <View style={styles.printFilterBar}>
              <Text style={styles.printFilterLabel}>Print Batch:</Text>
              <TouchableOpacity
                style={[styles.printFilterChip, printFilter === 'All' && styles.printFilterChipActive]}
                onPress={() => setPrintFilter('All')}
              >
                <Text style={[styles.printFilterChipText, printFilter === 'All' && styles.printFilterChipTextActive]}>
                  All Sets ({allGarmentTags.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.printFilterChip, printFilter === 'Hanger Cover' && styles.printFilterChipActive]}
                onPress={() => setPrintFilter('Hanger Cover')}
              >
                <Text style={[styles.printFilterChipText, printFilter === 'Hanger Cover' && styles.printFilterChipTextActive]}>
                  🧥 Hanger Only ({hangerTags.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.printFilterChip, printFilter === 'Fold & Pack' && styles.printFilterChipActive]}
                onPress={() => setPrintFilter('Fold & Pack')}
              >
                <Text style={[styles.printFilterChipText, printFilter === 'Fold & Pack' && styles.printFilterChipTextActive]}>
                  📦 Fold & Pack Only ({foldTags.length})
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.printGridScroll}>
              <View style={styles.printInstructions}>
                <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
                <Text style={styles.instructionsText}>
                  Printing {printableTags.length} tags. Each garment tag includes Order ID, customer uppercase name, cloth number ({printableTags[0]?.clothIndex || 1}/{totalClothes}), exact packaging type ({printFilter === 'All' ? 'mixed' : printFilter}), and garment name.
                </Text>
              </View>

              <View style={styles.printGrid}>
                {printableTags.map((tag, idx) => (
                  <View key={idx} style={styles.printGridCell}>
                    <View style={styles.cutHeader}>
                      <Text style={styles.cutMini}>✂ Cut Here</Text>
                      <Text style={styles.cutMini}>Pin to: {tag.clothName} ({tag.packingType === 'Hanger Cover' ? '🧥' : '📦'})</Text>
                    </View>
                    <PhysicalClothTag tag={tag} />
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/**
 * Renders the exact physical cloth tag matching the reference photo
 */
function PhysicalClothTag({ tag }: { tag: GarmentClothTag }) {
  return (
    <View style={styles.tagSlip}>
      {/* Top Staple Pin Area & Store ID */}
      <View style={styles.tagTopRow}>
        <View style={styles.stapleHole}>
          <View style={styles.stapleDot} />
        </View>
        <Text style={styles.tagStoreId}>{tag.storeName}</Text>
        <View style={styles.stapleHole}>
          <View style={styles.stapleDot} />
        </View>
      </View>

      {/* Large Bold Numeric Order ID */}
      <Text style={styles.tagOrderId}>{tag.orderIdNumeric}</Text>

      {/* Customer Name in Bold Uppercase */}
      <Text style={styles.tagCustomerName}>{tag.customerName}</Text>

      {/* Service Type (Circle + Code) & Cloth Count */}
      <View style={styles.tagServiceCountRow}>
        <View style={styles.serviceTypeWrap}>
          <View style={styles.circleIcon} />
          <Text style={styles.serviceCodeText}>{tag.serviceCode}</Text>
        </View>

        <Text style={styles.clothCountText}>
          {tag.clothIndex}/{tag.totalClothes}
        </Text>
      </View>

      {/* Packing Type (Hanger Cover / Fold & Pack) */}
      <Text style={styles.tagPackingType}>{tag.packingType}</Text>

      {/* Estimated Delivery Date */}
      <Text style={styles.tagDeliveryDate}>{tag.deliveryDateFormatted}</Text>

      {/* Cloth Name at Bottom (e.g. Saree, Shirt, Trousers) */}
      <Text style={styles.tagClothName}>{tag.clothName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginVertical: 12,
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.primary,
  },
  mainSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  printAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  printAllBtnText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },
  packingSwitcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  packingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  packPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  packPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  packPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  packPillTextActive: {
    color: '#FFFFFF',
  },
  tagCarouselBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 8,
  },
  carouselText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  arrowRow: {
    flexDirection: 'row',
    gap: 6,
  },
  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: {
    opacity: 0.4,
  },
  tagCanvas: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scissorsCutLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  cutText: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  thumbStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
  },
  thumbPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumbPillActive: {
    backgroundColor: Colors.primarySubtle,
    borderColor: Colors.primary,
  },
  thumbIndex: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  thumbIndexActive: {
    color: Colors.primary,
  },
  thumbName: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
    maxWidth: 90,
  },
  thumbNameActive: {
    color: Colors.primary,
    fontWeight: '800',
  },

  // ─── Physical Cloth Tag Styles (Exact Visual Replica) ──────────────
  tagSlip: {
    width: 220,
    minHeight: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#0F172A',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
    marginVertical: 8,
  },
  tagTopRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stapleHole: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stapleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  tagStoreId: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  tagOrderId: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 1.5,
    marginVertical: 2,
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-Bold' : 'sans-serif-black',
  },
  tagCustomerName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tagServiceCountRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  serviceTypeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  circleIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  serviceCodeText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.4,
  },
  clothCountText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  tagPackingType: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  tagDeliveryDate: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  tagClothName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: 2,
  },

  // ─── Compact Props ────────────────────────────────────────────────
  compactContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
    marginVertical: 4,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compactTagBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  compactTagOrder: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  compactCustomer: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  compactMeta: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  compactPrintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
  },
  compactPrintText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },

  // ─── Print Sheet Modal ────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 960,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  modalSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#F8FAFC',
  },
  modalSheetTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary,
  },
  modalSheetSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  printActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  printActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  printGridScroll: {
    padding: 20,
  },
  printInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accentCyanBg,
    borderWidth: 1,
    borderColor: Colors.accentCyanLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  instructionsText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  printGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
  },
  printGridCell: {
    alignItems: 'center',
  },
  cutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 220,
    paddingBottom: 4,
  },
  cutMini: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
  printFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
    flexWrap: 'wrap',
  },
  printFilterLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    marginRight: 4,
  },
  printFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  printFilterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  printFilterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  printFilterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
