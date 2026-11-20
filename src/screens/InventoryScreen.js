import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function InventoryScreen() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      console.log('📦 Fetching inventory...');
      return (await api.get('/tenant/inventory', { params: { limit: 50 } })).data;
    },
  });

  const items = data?.data || [];

  return (
    <FlatList
      style={styles.container}
      data={items}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#2563eb" />}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.icon, { backgroundColor: item.quantity <= (item.minQuantity || 5) ? '#fef2f2' : '#ecfdf5' }]}>
              <Ionicons name="cube-outline" size={18} color={item.quantity <= (item.minQuantity || 5) ? '#dc2626' : '#059669'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.detail}>{item.category || 'General'} • {item.location || '-'}</Text>
            </View>
            <View style={styles.qtyBox}>
              <Text style={[styles.qty, item.quantity <= (item.minQuantity || 5) && { color: '#dc2626' }]}>{item.quantity}</Text>
              <Text style={styles.qtyLabel}>{item.unit || 'pcs'}</Text>
            </View>
          </View>
        </View>
      )}
      ListEmptyComponent={!isLoading && <Text style={styles.empty}>No inventory items</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f9ff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  name: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  detail: { fontSize: 12, color: '#64748b', marginTop: 2 },
  qtyBox: { alignItems: 'center' },
  qty: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  qtyLabel: { fontSize: 10, color: '#94a3b8' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 14 },
});
