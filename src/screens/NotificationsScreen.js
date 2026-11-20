import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useTheme } from '../theme/ThemeContext';

const NOTIF_ICONS = {
  RENT: 'wallet-outline',
  COMPLAINT: 'chatbubble-outline',
  VISITOR: 'person-add-outline',
  MAINTENANCE: 'construct-outline',
  GENERAL: 'notifications-outline',
};

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const { colors } = useTheme();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      console.log('🔔 Fetching notifications...');
      return (await api.get('/tenant/notifications', { params: { limit: 50 } })).data.data;
    },
    
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => api.put(`/tenant/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.put('/tenant/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const items = data || [];
  const unreadCount = items.filter(n => !n.readAt).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {unreadCount > 0 && (
        <TouchableOpacity style={[styles.markAllBtn, { backgroundColor: colors.primaryLight }]} onPress={() => markAllReadMutation.mutate()}>
          <Ionicons name="checkmark-done-outline" size={16} color={colors.primary} />
          <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all as read ({unreadCount})</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.cardBg }, !item.readAt && styles.unreadCard, !item.readAt && { borderLeftColor: colors.primary }]}
            onPress={() => !item.readAt && markReadMutation.mutate(item.id)}
          >
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: colors.divider }, !item.readAt && { backgroundColor: colors.primaryLight }]}>
                <Ionicons name={NOTIF_ICONS[item.type] || NOTIF_ICONS.GENERAL} size={18} color={!item.readAt ? colors.primary : colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.textSecondary }, !item.readAt && { color: colors.text, fontWeight: '700' }]}>{item.title}</Text>
                <Text style={[styles.body, { color: colors.textSecondary }]} numberOfLines={2}>{item.message || item.body}</Text>
                <Text style={[styles.time, { color: colors.textMuted }]}>
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                </Text>
              </View>
              {!item.readAt && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={!isLoading && <Text style={[styles.empty, { color: colors.textMuted }]}>No notifications</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, margin: 16, marginBottom: 0, borderRadius: 10 },
  markAllText: { fontSize: 13, fontWeight: '600' },
  card: { borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  unreadCard: { borderLeftWidth: 3 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  icon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  title: { fontSize: 13, fontWeight: '600' },
  body: { fontSize: 12, marginTop: 3, lineHeight: 16 },
  time: { fontSize: 11, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
