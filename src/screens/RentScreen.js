import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { useTheme } from '../theme/ThemeContext';

export default function RentScreen({ navigation }) {
  const queryClient = useQueryClient();
  const now = new Date();
  const { colors } = useTheme();

  const { data: outstanding } = useQuery({
    queryKey: ['rent-outstanding'],
    queryFn: async () => {
      console.log('💰 Fetching rent outstanding summary...');
      return (await api.get('/tenant/rent/outstanding')).data.data;
    },
  });

  const { data: charges, isLoading, refetch } = useQuery({
    queryKey: ['rent-charges'],
    queryFn: async () => {
      console.log('💰 Fetching rent charges list...');
      const result = (await api.get('/tenant/rent/charges', { params: { limit: 50 } })).data;
      console.log(`💰 Rent charges fetched: ${result?.data?.length || 0} items`);
      return result;
    },
    
  });

  const generateMutation = useMutation({
    mutationFn: () => {
      console.log(`🔄 Generating rent for ${now.getMonth() + 1}/${now.getFullYear()}`);
      return api.post('/tenant/rent/generate', { month: now.getMonth() + 1, year: now.getFullYear() });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['rent-charges'] });
      queryClient.invalidateQueries({ queryKey: ['rent-outstanding'] });
      Alert.alert('Success', `Generated ${res.data.data.generated} rent charges`);
    },
    onError: (err) => Alert.alert('Error', err.response?.data?.message || 'Failed to generate rent'),
  });

  const items = charges?.data || [];

  const renderItem = ({ item }) => {
    const totalAmount = Number(item.totalAmount || 0);
    const paidAmount = Number(item.paidAmount || 0);
    const pendingAmount = totalAmount - paidAmount;
    const isPaid = item.status === 'PAID';

    return (
      <TouchableOpacity style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]} onPress={() => navigation.navigate('RentDetail', { id: item.id })} activeOpacity={0.7}>
        <View style={styles.cardRow}>
          <View style={styles.residentInfo}>
            <View style={[styles.avatar, { backgroundColor: colors.avatarBg, borderColor: colors.avatarBorder }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{item.resident?.firstName?.[0]}{item.resident?.lastName?.[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.residentName, { color: colors.text }]}>{item.resident?.firstName} {item.resident?.lastName}</Text>
              <Text style={[styles.detail, { color: colors.textSecondary }]}>{item.month}/{item.year}</Text>
            </View>
          </View>
          <StatusBadge status={item.status} />
        </View>
        <View style={styles.amountRow}>
          <View style={styles.amountItem}>
            <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Total</Text>
            <Text style={[styles.amountValue, { color: colors.text }]}>₹{totalAmount.toLocaleString('en-IN')}</Text>
          </View>
          {!isPaid && pendingAmount > 0 && (
            <View style={[styles.amountItem, styles.pendingItem]}>
              <Text style={[styles.amountLabel, { color: '#dc2626' }]}>Pending</Text>
              <Text style={[styles.amountValue, { color: '#dc2626', fontWeight: '700' }]}>₹{pendingAmount.toLocaleString('en-IN')}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {outstanding && (
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Outstanding</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>₹{Number(outstanding.totalOutstanding || 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Ionicons name="time-outline" size={18} color={colors.error} />
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Overdue</Text>
            <Text style={[styles.summaryValue, { color: colors.error }]}>₹{Number(outstanding.overdueAmount || 0).toLocaleString('en-IN')}</Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={[styles.generateBtn, { backgroundColor: colors.primary }]} onPress={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
        <Ionicons name="add-circle-outline" size={18} color="#fff" />
        <Text style={styles.generateText}>{generateMutation.isPending ? 'Generating...' : `Generate ${now.toLocaleString('en-IN', { month: 'long' })} Rent`}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.proofsBtn, { backgroundColor: colors.warning + '18', borderColor: colors.warning + '40' }]} onPress={() => navigation.navigate('PaymentProofs')}>
        <Ionicons name="time" size={18} color={colors.warning} />
        <Text style={[styles.proofsBtnText, { color: colors.warning }]}>Review Payment Proofs</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.warning} />
      </TouchableOpacity>

      <FlatList data={items} keyExtractor={(item) => item.id} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }} renderItem={renderItem} ListEmptyComponent={!isLoading && <Text style={[styles.empty, { color: colors.textMuted }]}>No rent charges yet</Text>} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summaryRow: { flexDirection: 'row', padding: 16, gap: 12 },
  summaryCard: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1 },
  summaryLabel: { fontSize: 11, textTransform: 'uppercase', marginTop: 6 },
  summaryValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, borderRadius: 12, padding: 14, marginBottom: 12 },
  generateText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  proofsBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1 },
  proofsBtnText: { fontSize: 14, fontWeight: '600', flex: 1 },
  card: { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  residentInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { fontSize: 12, fontWeight: '700' },
  residentName: { fontSize: 14, fontWeight: '600' },
  detail: { fontSize: 11, marginTop: 2 },
  amountRow: { flexDirection: 'row', marginTop: 10, gap: 12 },
  amountItem: { flex: 1 },
  amountLabel: { fontSize: 10, textTransform: 'uppercase' },
  amountValue: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  pendingItem: { backgroundColor: '#dc262610', borderRadius: 8, padding: 6 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
