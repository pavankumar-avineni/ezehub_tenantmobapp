import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image, Dimensions, SafeAreaView, StatusBar } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DASHBOARD_ENDPOINT, CURRENCY_LOCALE, CURRENCY_SYMBOL } from '@env';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../theme/ThemeContext';
import { logAction } from '../utils/logger';

if (!DASHBOARD_ENDPOINT || !CURRENCY_LOCALE || !CURRENCY_SYMBOL) {
  throw new Error('Missing DASHBOARD_ENDPOINT, CURRENCY_LOCALE, or CURRENCY_SYMBOL in .env');
}

const { width, height } = Dimensions.get('window');
const CARD_GAP = 10;
const CARD_WIDTH = (width - 32 - CARD_GAP) / 2;

function StatCard({ title, value, icon, colors, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, width: CARD_WIDTH }]}
      onPress={() => {
        logAction('DASHBOARD_CARD_TAP', `Tapped dashboard card: ${title}`);
        onPress();
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.statIcon, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <View style={styles.statFooter}>
        <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
        <Ionicons name="chevron-forward" size={12} color={colors.chevron} />
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const { colors } = useTheme();
  const navigation = useNavigation();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tenant-dashboard'],
    queryFn: async () => {
      logAction('DASHBOARD', 'Fetching live dashboard metrics from API');
      const res = await api.get(DASHBOARD_ENDPOINT);
      return res.data.data;
    },
  });

  const handleRefresh = () => {
    logAction('DASHBOARD', 'Manual pull-to-refresh triggered on Dashboard');
    refetch();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />
      <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topSpacer} />

          <View style={[styles.greetingCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.greeting, { color: colors.text }]}>
              Hello, <Text style={{ color: colors.primary }}>{user?.firstName}!</Text>
            </Text>
            <Text style={[styles.greetingSub, { color: colors.textSecondary }]}>Here's what's happening today.</Text>
          </View>

          <View style={styles.grid}>
            <StatCard
              title="Buildings"
              value={data?.totalBuildings}
              icon="business-outline"
              colors={colors}
              onPress={() => navigation.navigate('DashboardBuildings')}
            />
            <StatCard
              title="Residents"
              value={data?.activeResidents}
              icon="people-outline"
              colors={colors}
              onPress={() => navigation.navigate('DashboardResidents')}
            />
            <StatCard
              title="Occupancy"
              value={data?.occupancyRate !== undefined && data?.occupancyRate !== null ? `${data.occupancyRate}%` : ''}
              icon="bed-outline"
              colors={colors}
              onPress={() => navigation.navigate('DashboardOccupancy')}
            />
            <StatCard
              title="Staff"
              value={data?.totalStaff}
              icon="person-outline"
              colors={colors}
              onPress={() => navigation.navigate('DashboardStaff')}
            />
            <StatCard
              title="Complaints"
              value={data?.openComplaints}
              icon="chatbubble-outline"
              colors={colors}
              onPress={() => navigation.navigate('DashboardComplaints')}
            />
            <StatCard
              title="Pending Rent"
              value={data?.pendingRent !== undefined && data?.pendingRent !== null ? `${CURRENCY_SYMBOL}${Number(data.pendingRent).toLocaleString(CURRENCY_LOCALE)}` : ''}
              icon="wallet-outline"
              colors={colors}
              onPress={() => navigation.navigate('DashboardRent')}
            />
          </View>

          <View style={styles.bannerWrapper}>
            <View style={[styles.banner, { backgroundColor: colors.bannerBg, borderColor: colors.bannerBorder }]}>
              <Image source={require('../../assets/icon.png')} style={styles.bannerLogo} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.bannerTitle, { color: colors.text }]}>Keep your property</Text>
                <Text style={[styles.bannerHL, { color: colors.primary }]}>running smoothly</Text>
                <Text style={[styles.bannerSub, { color: colors.textSecondary }]}>Manage, monitor & grow with ease.</Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  wrapper: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 0,
    paddingBottom: 0,
    flexGrow: 1,
    justifyContent: 'center',
  },
  topSpacer: { height: height * 0.02 },
  bottomSpacer: { height: 10 },
  greetingCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  greeting: { fontSize: 20, fontWeight: '700', lineHeight: 28 },
  greetingSub: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: CARD_GAP,
    justifyContent: 'flex-start',
    rowGap: 6,
  },
  statCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 0,
    minHeight: 100,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: { fontSize: 20, fontWeight: '800', lineHeight: 26 },
  statFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  statTitle: { fontSize: 12, fontWeight: '500' },
  bannerWrapper: { marginTop: 14, paddingHorizontal: 16 },
  banner: {
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  bannerLogo: { width: 48, height: 48, borderRadius: 10, marginRight: 14 },
  bannerTitle: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  bannerHL: { fontSize: 15, fontWeight: '700', lineHeight: 22 },
  bannerSub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
});
