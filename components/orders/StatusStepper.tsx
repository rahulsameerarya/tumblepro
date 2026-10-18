import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, StatusColors } from '../../constants/Colors';
import { ORDER_STATUSES, LEGACY_STATUS_MAP } from '../../constants/Orders';

interface StatusStepperProps {
  currentStatus: string;
}

export default function StatusStepper({ currentStatus }: StatusStepperProps) {
  // Normalize legacy status if any
  const normalizedStatus = LEGACY_STATUS_MAP[currentStatus] || currentStatus;
  const currentIdx = ORDER_STATUSES.indexOf(normalizedStatus as any);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {ORDER_STATUSES.map((status, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const color = isCurrent
          ? StatusColors[status] || Colors.primary
          : isCompleted
          ? Colors.success
          : Colors.border;

        return (
          <React.Fragment key={status}>
            <View style={styles.step}>
              <View
                style={[
                  styles.circle,
                  {
                    borderColor: color,
                    backgroundColor: isCurrent
                      ? color + '22'
                      : isCompleted
                      ? Colors.success + '22'
                      : '#101026',
                  },
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={14} color={Colors.success} />
                ) : (
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: isCurrent ? color : Colors.border },
                    ]}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  isCurrent && { color: color, fontWeight: '800' },
                  isCompleted && { color: Colors.success, fontWeight: '600' },
                  !isCurrent && !isCompleted && { color: Colors.textMuted },
                ]}
                numberOfLines={2}
              >
                {status}
              </Text>
            </View>

            {idx < ORDER_STATUSES.length - 1 && (
              <View
                style={[
                  styles.line,
                  { backgroundColor: isCompleted ? Colors.success : Colors.border },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  step: {
    alignItems: 'center',
    gap: 6,
    width: 78,
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 13,
  },
  line: {
    width: 24,
    height: 2,
    marginTop: 14,
    borderRadius: 1,
  },
});
