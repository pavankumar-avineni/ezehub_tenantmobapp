import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert, TextInput } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { useTheme } from '../theme/ThemeContext';

export default function VisitorsScreen() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { colors } = useTheme();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['visitors', search],
    queryFn: async () => (await api.get('/tenant/visitors', { params: { search, limit: 50 } })).data,
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action, body }) => api.post(`/tenant/visitors/${id}/${action}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['visitors'] }),
    onError: (err) => Alert.alert('Error', err.response?.data?.message || 'Action failed'),
  });

  const visitors = data?.data || [];

  const handleAction = (visitor) => {
    if (visitor.status === 'OTP_SENT') {
      Alert.prompt('Verify OTP', 'Enter the 6-digit OTP', (otp) => {
        if (otp) actionMutation.mutate({ id: visitor.id, action: 'verify-otp', body: { otp } });
      });
    } else if (['VERIFIED', 'REGISTERED'].includes(visitor.status)) {
      actionMutation.mutate({ id: visitor.id, action: 'check-in' });
    } else if (visitor.status === 'CHECKED_IN') {
      actionMutation.mutate({ id: visitor.id, action: 'check-out' });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.inputBorder }]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput style={[styles.searchInput, { color: colors.text }]} placeholder="Search visitors..." value={search} onChangeText={setSearch} placeholderTextColor={colors.textMuted} />
      </View>
      <FlatList
        data={visitors}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={styles.cardRow}>
              <View>
                <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.detail, { color: colors.textSecondary }]}>{item.phone} • {item.purpose}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>
            {['OTP_SENT', 'VERIFIED', 'REGISTERED', 'CHECKED_IN'].includes(item.status) && (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '30' }]} onPress={() => handleAction(item)}>
                <Text style={[styles.actionText, { color: colors.primary }]}>
                  {item.status === 'OTP_SENT' ? 'Verify OTP' : item.status === 'CHECKED_IN' ? 'Check Out' : 'Check In'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={!isLoading && <Text style={[styles.empty, { color: colors.textMuted }]}>No visitors</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 0, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1 },
  searchInput: { flex: 1, padding: 12, fontSize: 14 },
  card: { borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 14, fontWeight: '600' },
  detail: { fontSize: 12, marginTop: 2 },
  actionBtn: { marginTop: 10, borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1 },
  actionText: { fontWeight: '600', fontSize: 13 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
