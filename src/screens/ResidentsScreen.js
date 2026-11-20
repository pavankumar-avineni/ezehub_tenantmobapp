import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { useTheme } from '../theme/ThemeContext';

export default function ResidentsScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const { colors } = useTheme();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['residents', search],
    queryFn: async () => {
      console.log('📋 Fetching residents list, search:', search || '(none)');
      const result = (await api.get('/tenant/residents', { params: { search, limit: 50 } })).data;
      console.log(`📋 Residents fetched: ${result?.data?.length || 0} items`);
      return result;
    },
  });

  const residents = data?.data || [];

  const renderItem = ({ item }) => (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]} onPress={() => navigation.navigate('ResidentDetail', { id: item.id })}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.avatarBg, borderColor: colors.avatarBorder }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>{item.firstName?.[0]}{item.lastName?.[0]}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.name, { color: colors.text }]}>{item.firstName} {item.lastName}</Text>
          <Text style={[styles.phone, { color: colors.textSecondary }]}>{item.phone}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>
      {item.bed && (
        <Text style={[styles.location, { color: colors.primary }]}>{item.bed.room?.floor?.building?.name} → {item.bed.room?.name} ({item.bed.label})</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.inputBorder }]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput style={[styles.searchInput, { color: colors.text }]} placeholder="Search residents..." value={search} onChangeText={setSearch} placeholderTextColor={colors.textMuted} />
      </View>
      <FlatList
        data={residents}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={!isLoading && <Text style={[styles.empty, { color: colors.textMuted }]}>No residents found</Text>}
      />
      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('AddResident')}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 0, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1 },
  searchInput: { flex: 1, padding: 12, fontSize: 14 },
  card: { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 14, fontWeight: '700' },
  cardInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600' },
  phone: { fontSize: 12, marginTop: 2 },
  location: { fontSize: 12, marginTop: 8, fontWeight: '500' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 6 },
});
