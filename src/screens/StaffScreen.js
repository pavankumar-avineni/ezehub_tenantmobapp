import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { useTheme } from '../theme/ThemeContext';

export default function StaffScreen() {
  const { colors } = useTheme();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => (await api.get('/tenant/staff', { params: { limit: 50 } })).data,
  });
  const items = data?.data || [];

  return (
    <FlatList
      style={[styles.container, { backgroundColor: colors.background }]}
      data={items} keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.row}>
            <View style={[styles.avatar, { borderColor: colors.avatarBorder }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{item.firstName?.[0]}{item.lastName?.[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.text }]}>{item.firstName} {item.lastName}</Text>
              <Text style={[styles.detail, { color: colors.textSecondary }]}>{item.designation || 'Staff'} • {item.department}</Text>
            </View>
            <StatusBadge status={item.status} />
          </View>
        </View>
      )}
      ListEmptyComponent={!isLoading && <Text style={[styles.empty, { color: colors.textMuted }]}>No staff members</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 12, fontWeight: '700' },
  name: { fontSize: 14, fontWeight: '600' },
  detail: { fontSize: 12, marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
