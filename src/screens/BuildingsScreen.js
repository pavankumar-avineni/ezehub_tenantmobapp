import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useTheme } from '../theme/ThemeContext';

export default function BuildingsScreen() {
  const { colors } = useTheme();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => (await api.get('/tenant/buildings', { params: { limit: 50 } })).data,
  });
  const items = data?.data || [];

  const handleCardPress = async (item) => {
    try {
      const res = await api.get(`/tenant/buildings/${item.id}/stats`);
      const stats = res.data.data || res.data;
      Alert.alert(
        item.name,
        `Address: ${item.address || 'N/A'}\nCity: ${item.city || 'N/A'}\n\nTotal Floors: ${stats.totalFloors ?? item._count?.floors ?? 0}\nTotal Rooms: ${stats.totalRooms ?? 0}\nTotal Beds: ${stats.totalBeds ?? 0}\nOccupied Beds: ${stats.occupiedBeds ?? 0}\nAvailable Beds: ${stats.availableBeds ?? 0}`,
        [{ text: 'Close' }]
      );
    } catch (err) {
      Alert.alert(
        item.name,
        `Address: ${item.address || 'N/A'}\nCity: ${item.city || 'N/A'}\nFloors: ${item._count?.floors ?? 0}\n\nCould not load detailed stats.`,
        [{ text: 'Close' }]
      );
    }
  };

  return (
    <FlatList
      style={[styles.container, { backgroundColor: colors.background }]}
      data={items} keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]} onPress={() => handleCardPress(item)} activeOpacity={0.7}>
          <View style={styles.row}>
            <View style={[styles.icon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="business-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.detail, { color: colors.textSecondary }]}>{item.code} • {item.city || 'No city'}</Text>
            </View>
            <Text style={[styles.floors, { color: colors.primary }]}>{item._count?.floors ?? 0} floors</Text>
          </View>
          <Text style={[styles.address, { color: colors.textMuted }]} numberOfLines={2}>{item.address || '-'}</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={!isLoading && <Text style={[styles.empty, { color: colors.textMuted }]}>No buildings</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  name: { fontSize: 14, fontWeight: '600' },
  detail: { fontSize: 12, marginTop: 2 },
  floors: { fontSize: 12, fontWeight: '600' },
  address: { fontSize: 11, marginTop: 8 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
