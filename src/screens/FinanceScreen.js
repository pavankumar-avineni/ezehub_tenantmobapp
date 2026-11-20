import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function FinanceScreen() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: async () => {
      console.log('💰 Fetching finance summary...');
      return (await api.get('/tenant/finance/summary')).data.data;
    },
  });

  const { data: txns, isLoading: txnLoading } = useQuery({
    queryKey: ['finance-transactions'],
    queryFn: async () => {
      console.log('💰 Fetching transactions...');
      return (await api.get('/tenant/finance/transactions', { params: { limit: 30 } })).data;
    },
  });

  const transactions = txns?.data || [];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#2563eb" />}>
      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.card}>
          <Ionicons name="trending-up-outline" size={20} color="#059669" />
          <Text style={styles.cardLabel}>Total Income</Text>
          <Text style={[styles.cardValue, { color: '#059669' }]}>₹{Number(data?.totalIncome || 0).toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="trending-down-outline" size={20} color="#dc2626" />
          <Text style={styles.cardLabel}>Total Expense</Text>
          <Text style={[styles.cardValue, { color: '#dc2626' }]}>₹{Number(data?.totalExpense || 0).toLocaleString('en-IN')}</Text>
        </View>
      </View>
      <View style={styles.summaryRow}>
        <View style={styles.card}>
          <Ionicons name="wallet-outline" size={20} color="#2563eb" />
          <Text style={styles.cardLabel}>Net Balance</Text>
          <Text style={styles.cardValue}>₹{Number(data?.netBalance || 0).toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="alert-circle-outline" size={20} color="#d97706" />
          <Text style={styles.cardLabel}>Pending Dues</Text>
          <Text style={[styles.cardValue, { color: '#d97706' }]}>₹{Number(data?.pendingDues || 0).toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* Recent Transactions */}
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      {transactions.length === 0 && !txnLoading && (
        <Text style={styles.empty}>No transactions yet</Text>
      )}
      {transactions.map((txn) => (
        <View key={txn.id} style={styles.txnCard}>
          <View style={styles.txnRow}>
            <View style={[styles.txnIcon, { backgroundColor: txn.type === 'INCOME' ? '#ecfdf5' : '#fef2f2' }]}>
              <Ionicons name={txn.type === 'INCOME' ? 'arrow-down' : 'arrow-up'} size={16} color={txn.type === 'INCOME' ? '#059669' : '#dc2626'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.txnTitle}>{txn.description || txn.category}</Text>
              <Text style={styles.txnDate}>{txn.date ? new Date(txn.date).toLocaleDateString('en-IN') : '-'}</Text>
            </View>
            <Text style={[styles.txnAmount, { color: txn.type === 'INCOME' ? '#059669' : '#dc2626' }]}>
              {txn.type === 'INCOME' ? '+' : '-'}₹{Number(txn.amount || 0).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      ))}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f9ff', padding: 16 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardLabel: { fontSize: 11, color: '#64748b', marginTop: 6, textTransform: 'uppercase' },
  cardValue: { fontSize: 17, fontWeight: '700', color: '#1e293b', marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', marginTop: 16, marginBottom: 10 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 20, fontSize: 13 },
  txnCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  txnRow: { flexDirection: 'row', alignItems: 'center' },
  txnIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  txnTitle: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  txnDate: { fontSize: 11, color: '#64748b', marginTop: 2 },
  txnAmount: { fontSize: 14, fontWeight: '700' },
});
