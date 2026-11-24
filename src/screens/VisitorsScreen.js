import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert, TextInput } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VISITORS_ENDPOINT, VISITORS_PAGE_LIMIT } from '@env';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { useTheme } from '../theme/ThemeContext';
import { logAction, logError } from '../utils/logger';

if (!VISITORS_ENDPOINT || !VISITORS_PAGE_LIMIT) {
  throw new Error('Missing VISITORS_ENDPOINT or VISITORS_PAGE_LIMIT in .env');
}

export default function VisitorsScreen() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['visitors', search],
    queryFn: async () => {
      logAction('VISITORS', 'Fetching visitors list from API', { search, limit: Number(VISITORS_PAGE_LIMIT) });
      const res = await api.get(VISITORS_ENDPOINT, {
        params: { search, limit: Number(VISITORS_PAGE_LIMIT) },
      });
      return res.data;
    },
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action, body }) => {
      logAction('VISITORS_ACTION', `Executing visitor action: ${action}`, { visitorId: id, body });
      return api.post(`${VISITORS_ENDPOINT}/${id}/${action}`, body);
    },
    onSuccess: (_, variables) => {
      logAction('VISITORS_ACTION', `Visitor action succeeded: ${variables.action}`, { visitorId: variables.id });
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
    },
    onError: (err, variables) => {
      logError('VISITORS_ACTION', `Visitor action failed: ${variables.action}`, err);
      Alert.alert('Error', err.response?.data?.message || err.message);
    },
  });

  const visitors = data?.data || [];

  const handleSearchChange = (text) => {
    logAction('VISITORS_SEARCH', 'Updated visitor search query', { query: text });
    setSearch(text);
  };

  const handleAction = (visitor) => {
    logAction('VISITORS_TAP', `Tapped visitor action button for status: ${visitor.status}`, { visitorId: visitor.id, name: visitor.name });
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
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Visitors</Text>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.inputBorder }]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search visitors..."
          value={search}
          onChangeText={handleSearchChange}
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <FlatList
        data={visitors}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              logAction('VISITORS', 'Manual pull-to-refresh triggered on Visitors');
              refetch();
            }}
            tintColor={colors.primary}
          />
        }
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
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '30' }]}
                onPress={() => handleAction(item)}
              >
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  searchInput: { flex: 1, padding: 12, fontSize: 14 },
  card: { borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 14, fontWeight: '600' },
  detail: { fontSize: 12, marginTop: 2 },
  actionBtn: { marginTop: 10, borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1 },
  actionText: { fontWeight: '600', fontSize: 13 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
