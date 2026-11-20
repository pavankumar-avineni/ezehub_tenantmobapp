import { View, Text, StyleSheet } from 'react-native';

const COLORS = {
  ACTIVE: { bg: '#ecfdf5', text: '#059669' },
  PENDING: { bg: '#fffbeb', text: '#d97706' },
  SUSPENDED: { bg: '#fef2f2', text: '#dc2626' },
  OPEN: { bg: '#eff6ff', text: '#2563eb' },
  RESOLVED: { bg: '#ecfdf5', text: '#059669' },
  IN_PROGRESS: { bg: '#f5f3ff', text: '#7c3aed' },
  PAID: { bg: '#ecfdf5', text: '#059669' },
  OVERDUE: { bg: '#fef2f2', text: '#dc2626' },
  OCCUPIED: { bg: '#f5f3ff', text: '#7c3aed' },
  AVAILABLE: { bg: '#ecfdf5', text: '#059669' },
  COMPLETED: { bg: '#ecfdf5', text: '#059669' },
  CHECKED_IN: { bg: '#ecfdf5', text: '#059669' },
  CHECKED_OUT: { bg: '#f1f5f9', text: '#64748b' },
};

export function StatusBadge({ status }) {
  const color = COLORS[status] || { bg: '#f1f5f9', text: '#64748b' };
  return (
    <View style={[styles.badge, { backgroundColor: color.bg }]}>
      <Text style={[styles.text, { color: color.text }]}>{status?.replace(/_/g, ' ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  text: { fontSize: 10, fontWeight: '700' },
});
