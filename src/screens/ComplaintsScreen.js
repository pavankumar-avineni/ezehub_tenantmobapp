import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { useTheme } from '../theme/ThemeContext';

export default function ComplaintsScreen() {
  const { colors } = useTheme();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['complaints'],
    queryFn: async () => (await api.get('/tenant/complaints', { params: { limit: 50 } })).data,
    
  });
  const items = data?.data || [];

  const showDetail = (item) => {
    Alert.alert(
      item.title,
      `Description: ${item.description || 'N/A'}\nCategory: ${item.category || 'N/A'}\nPriority: ${item.priority || 'N/A'}\nStatus: ${item.status || 'N/A'}\nCreated: ${item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}`,
      [{ text: 'Close' }]
    );
  };

  return (
    <FlatList
      style={[styles.container, { backgroundColor: colors.background }]}
      data={items} keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]} onPress={() => showDetail(item)} activeOpacity={0.7}>
          <View style={styles.row}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
            <StatusBadge status={item.status} />
          </View>
          <View style={styles.row}>
            <Text style={[styles.detail, { color: colors.textSecondary }]}>{item.category}</Text>
            <StatusBadge status={item.priority} />
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={!isLoading && <Text style={[styles.empty, { color: colors.textMuted }]}>No complaints</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { fontSize: 14, fontWeight: '600', flex: 1, marginRight: 8 },
  detail: { fontSize: 12 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
