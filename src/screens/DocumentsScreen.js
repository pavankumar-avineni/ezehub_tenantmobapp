import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Linking } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const FILE_ICONS = {
  pdf: 'document-text-outline',
  doc: 'document-outline',
  docx: 'document-outline',
  jpg: 'image-outline',
  jpeg: 'image-outline',
  png: 'image-outline',
  xls: 'grid-outline',
  xlsx: 'grid-outline',
};

export default function DocumentsScreen() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      console.log('📄 Fetching documents...');
      return (await api.get('/tenant/documents', { params: { limit: 50 } })).data;
    },
  });

  const items = data?.data || [];

  const getIcon = (name) => {
    const ext = name?.split('.').pop()?.toLowerCase();
    return FILE_ICONS[ext] || 'document-outline';
  };

  return (
    <FlatList
      style={styles.container}
      data={items}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#2563eb" />}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => item.url && Linking.openURL(item.url)}>
          <View style={styles.row}>
            <View style={styles.icon}>
              <Ionicons name={getIcon(item.name)} size={20} color="#2563eb" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.detail}>
                {item.category || 'Document'} • {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : '-'}
              </Text>
            </View>
            <Ionicons name="open-outline" size={16} color="#94a3b8" />
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={!isLoading && <Text style={styles.empty}>No documents uploaded</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f9ff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  name: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  detail: { fontSize: 12, color: '#64748b', marginTop: 2 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 14 },
});
