import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, TextInput, Alert, Linking } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useTheme } from '../theme/ThemeContext';

export default function PromotionsScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('FOOD');
  const [contactPhone, setContactPhone] = useState('');
  const [offerText, setOfferText] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['promotions'],
    queryFn: async () => (await api.get('/tenant/promotions', { params: { limit: 50 } })).data.data,
  });

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/tenant/promotions', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['promotions'] }); setShowForm(false); Alert.alert('Success', 'Promotion added'); },
    onError: (err) => Alert.alert('Error', err.response?.data?.message || 'Failed'),
  });

  const items = data || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => setShowForm(!showForm)}>
        <Ionicons name={showForm ? 'close' : 'add-circle'} size={18} color="#fff" />
        <Text style={styles.addText}>{showForm ? 'Cancel' : 'Add Promotion'}</Text>
      </TouchableOpacity>

      {showForm && (
        <View style={[styles.form, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder="Business Name" placeholderTextColor={colors.textMuted} value={businessName} onChangeText={setBusinessName} />
          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder="Contact Phone" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" value={contactPhone} onChangeText={setContactPhone} />
          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder="Offer Text (e.g. 20% off for residents)" placeholderTextColor={colors.textMuted} value={offerText} onChangeText={setOfferText} />
          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={() => {
            if (!businessName) return Alert.alert('Error', 'Enter business name');
            createMutation.mutate({ businessName, category, contactPhone, offerText, startDate: new Date().toISOString() });
          }}>
            <Text style={styles.submitText}>{createMutation.isPending ? 'Adding...' : 'Add'}</Text>
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
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.businessName}</Text>
            <Text style={[styles.badge, { color: colors.primary, backgroundColor: colors.primaryLight }]}>{item.category}</Text>
            {item.offerText && <Text style={[styles.offer, { color: colors.success }]}>🎁 {item.offerText}</Text>}
            {item.contactPhone && (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.contactPhone}`)}>
                <Text style={[styles.phone, { color: colors.textSecondary }]}>📞 {item.contactPhone}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={!isLoading && <Text style={[styles.empty, { color: colors.textMuted }]}>No promotions</Text>}
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
  submitBtn: { borderRadius: 10, padding: 12, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  card: { borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  badge: { fontSize: 10, fontWeight: '600', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  offer: { fontSize: 13, fontWeight: '600', marginTop: 6 },
  phone: { fontSize: 12, marginTop: 4 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
