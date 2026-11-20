import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useTheme } from '../theme/ThemeContext';

export default function LoginOtpsScreen() {
  const { colors } = useTheme();

  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['login-otps'],
    queryFn: async () => {
      console.log('🔑 [OTP] Fetching login OTP notifications...');
      const res = (await api.get('/tenant/notifications')).data.data;
      const allNotifs = res?.notifications || res || [];
      const now = new Date();
      // Filter OTP notifications that are still valid (less than 5 min old)
      const otpNotifs = allNotifs.filter(n => {
        if (!n.title?.includes('Login OTP')) return false;
        const created = new Date(n.createdAt);
        return (now - created) < 5 * 60 * 1000;
      });
      console.log('🔑 [OTP] Total notifications:', allNotifs.length, 'Active OTPs:', otpNotifs.length);
      return otpNotifs;
    },
    refetchInterval: 10000,
  });

  const items = notifications || [];

  const getTimeLeft = (createdAt) => {
    const created = new Date(createdAt);
    const expiresAt = new Date(created.getTime() + 5 * 60 * 1000);
    const now = new Date();
    const diffSec = Math.max(0, Math.floor((expiresAt - now) / 1000));
    const min = Math.floor(diffSec / 60);
    const sec = diffSec % 60;
    return `${min}:${String(sec).padStart(2, '0')}`;
  };

  const extractOtp = (message) => {
    const match = message?.match(/OTP:\s*(\d{6})/);
    return match ? match[1] : '------';
  };

  const extractName = (message) => {
    const match = message?.match(/^(.+?)\s*\(/);
    return match ? match[1] : 'Resident';
  };

  const extractPhone = (message) => {
    const match = message?.match(/\((\d+)\)/);
    return match ? match[1] : '';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerCard, { backgroundColor: colors.primary }]}>
        <Ionicons name="key" size={24} color="#fff" />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Resident Login OTPs</Text>
          <Text style={styles.headerSub}>Share these codes with residents trying to login</Text>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const otpCode = extractOtp(item.message);
          const name = extractName(item.message);
          const phone = extractPhone(item.message);
          const timeLeft = getTimeLeft(item.createdAt);

          return (
            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="person" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
                  <Text style={[styles.phone, { color: colors.textSecondary }]}>{phone}</Text>
                </View>
                <View style={styles.timer}>
                  <Ionicons name="time" size={14} color={colors.warning} />
                  <Text style={[styles.timerText, { color: colors.warning }]}>{timeLeft}</Text>
                </View>
              </View>
              <View style={[styles.otpBox, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '40' }]}>
                <Text style={[styles.otpLabel, { color: colors.textSecondary }]}>OTP CODE</Text>
                <Text style={[styles.otpCode, { color: colors.primary }]}>{otpCode}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="shield-checkmark" size={48} color={colors.success} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No pending OTPs</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>When a resident tries to login, their OTP will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerCard: { margin: 16, marginBottom: 0, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  card: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  name: { fontSize: 15, fontWeight: '600' },
  phone: { fontSize: 12, marginTop: 1 },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timerText: { fontSize: 13, fontWeight: '700' },
  otpBox: { borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1 },
  otpLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  otpCode: { fontSize: 32, fontWeight: '800', letterSpacing: 8 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  emptySub: { fontSize: 13, marginTop: 4, textAlign: 'center', paddingHorizontal: 40 },
});
