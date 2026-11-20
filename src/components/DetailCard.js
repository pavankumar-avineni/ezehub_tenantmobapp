import { View, Text, StyleSheet } from 'react-native';

export function DetailField({ label, value }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || '-'}</Text>
    </View>
  );
}

export function SectionTitle({ title }) {
  return <Text style={styles.section}>{title}</Text>;
}

const styles = StyleSheet.create({
  field: { marginBottom: 12 },
  label: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  value: { fontSize: 14, color: '#1e293b', fontWeight: '500' },
  section: { fontSize: 12, color: '#2563eb', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 16 },
});
