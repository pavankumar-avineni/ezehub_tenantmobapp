import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

export default function MaintenanceScreen() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      console.log('🔧 Fetching maintenance requests...');
      return (await api.get('/tenant/maintenance', { params: { limit: 50 } })).data;
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
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>{item.title || item.description}</Text>
            <StatusBadge status={item.status} />
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={12} color="#64748b" />
            <Text style={styles.detail}>{item.building?.name || item.location || '-'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={12} color="#64748b" />
            <Text style={styles.detail}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : '-'}</Text>
            {item.assignedTo && (
              <>
                <Ionicons name="person-outline" size={12} color="#64748b" style={{ marginLeft: 12 }} />
                <Text style={styles.detail}>{item.assignedTo.firstName || item.assignedTo}</Text>
              </>
            )}
          </View>
          {item.priority && (
            <View style={styles.detailRow}>
              <StatusBadge status={item.priority} />
            </View>
          )}
        </View>
      )}
      ListEmptyComponent={!isLoading && <Text style={styles.empty}>No maintenance requests</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f9ff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 14, fontWeight: '600', color: '#1e293b', flex: 1, marginRight: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  detail: { fontSize: 12, color: '#64748b' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 14 },
});
