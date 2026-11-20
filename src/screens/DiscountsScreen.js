import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useTheme } from '../theme/ThemeContext';

export default function DiscountsScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('FLAT');
  const [value, setValue] = useState('');
  const [startDate, setStartDate] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['discounts'],
    queryFn: async () => (await api.get('/tenant/discounts', { params: { limit: 50 } })).data.data,
  });

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/tenant/discounts', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['discounts'] }); setShowForm(false); setName(''); setValue(''); Alert.alert('Success', 'Discount created'); },
    onError: (err) => Alert.alert('Error', err.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/tenant/discounts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['discounts'] }),
  });

  const items = data || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => setShowForm(!showForm)}>
        <Ionicons name={showForm ? 'close' : 'add-circle'} size={18} color="#fff" />
        <Text style={styles.addText}>{showForm ? 'Cancel' : 'Create Discount'}</Text>
      </TouchableOpacity>

      {showForm && (
        <View style={[styles.form, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder="Discount Name" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
          <View style={styles.row}>
            <TouchableOpacity style={[styles.chip, type === 'FLAT' && { backgroundColor: colors.primary }]} onPress={() => setType('FLAT')}>
              <Text style={[styles.chipText, type === 'FLAT' && { color: '#fff' }]}>Flat ₹</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, type === 'PERCENTAGE' && { backgroundColor: colors.primary }]} onPress={() => setType('PERCENTAGE')}>
              <Text style={[styles.chipText, type === 'PERCENTAGE' && { color: '#fff' }]}>Percentage %</Text>
            </TouchableOpacity>
          </View>
          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder={type === 'FLAT' ? 'Amount (₹)' : 'Percentage (%)'} placeholderTextColor={colors.textMuted} keyboardType="numeric" value={value} onChangeText={setValue} />
          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={() => {
            if (!name || !value) return Alert.alert('Error', 'Fill all fields');
            createMutation.mutate({ name, type, value: parseFloat(value), scope: 'ALL_RESIDENTS', startDate: new Date().toISOString(), category: 'GENERAL' });
          }}>
            <Text style={styles.submitText}>{createMutation.isPending ? 'Creating...' : 'Create'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{item.scope?.replace(/_/g, ' ')} • {item.category}</Text>
              </View>
              <Text style={[styles.cardValue, { color: colors.primary }]}>{item.type === 'FLAT' ? `₹${item.value}` : `${item.value}%`}</Text>
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => Alert.alert('Delete', 'Remove this discount?', [{ text: 'No' }, { text: 'Yes', onPress: () => deleteMutation.mutate(item.id) }])}>
              <Ionicons name="trash-outline" size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={!isLoading && <Text style={[styles.empty, { color: colors.textMuted }]}>No discounts</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, borderRadius: 12, padding: 14 },
  addText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  form: { margin: 16, marginTop: 0, borderRadius: 14, padding: 16, borderWidth: 1 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f1f5f9' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  submitBtn: { borderRadius: 10, padding: 12, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  card: { borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '600' },
  cardSub: { fontSize: 11, marginTop: 2 },
  cardValue: { fontSize: 16, fontWeight: '800' },
  deleteBtn: { position: 'absolute', top: 12, right: 12 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
