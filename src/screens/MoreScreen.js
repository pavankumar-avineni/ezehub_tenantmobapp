import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../theme/ThemeContext';
import api from '../services/api';

const menuItems = [
  { icon: 'key-outline', label: 'Login OTPs', screen: 'LoginOtpsPage' },
  { icon: 'business-outline', label: 'Buildings', screen: 'BuildingsPage' },
  { icon: 'people-outline', label: 'Staff', screen: 'StaffPage' },
  { icon: 'chatbubble-outline', label: 'Complaints', screen: 'ComplaintsPage' },
  { icon: 'cash-outline', label: 'Finance', screen: 'FinancePage' },
  { icon: 'pricetag-outline', label: 'Discounts', screen: 'DiscountsPage' },
  { icon: 'megaphone-outline', label: 'Promotions', screen: 'PromotionsPage' },
  { icon: 'restaurant-outline', label: 'Food Menu', screen: 'FoodMenuPage' },
  { icon: 'grid-outline', label: 'Bed Map', screen: 'BedMapPage' },
  { icon: 'cube-outline', label: 'Inventory', screen: 'InventoryPage' },
  { icon: 'construct-outline', label: 'Maintenance', screen: 'MaintenancePage' },
  { icon: 'document-outline', label: 'Documents', screen: 'DocumentsPage' },
  { icon: 'notifications-outline', label: 'Notifications', screen: 'NotificationsPage' },
  { icon: 'settings-outline', label: 'Settings', screen: 'SettingsPage' },
];

export default function MoreScreen({ navigation }) {
  const { user, logout } = useAuthStore();
  const { colors, isDark, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    } catch {}
    logout();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 16 }}>
      <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <View style={[styles.avatar, { backgroundColor: colors.avatarBg, borderColor: colors.avatarBorder }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text>
        </View>
        <Text style={[styles.name, { color: colors.text }]}>{user?.firstName} {user?.lastName}</Text>
        <Text style={[styles.role, { color: colors.textSecondary }]}>{user?.role?.name} • {user?.tenant?.name}</Text>
      </View>

      {/* Theme Toggle */}
      <View style={[styles.themeRow, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={colors.primary} />
        <Text style={[styles.themeLabel, { color: colors.text }]}>Theme</Text>
        <View style={styles.themeButtons}>
          {['light', 'dark', 'system'].map((m) => (
            <TouchableOpacity key={m} style={[styles.themeBtn, { borderColor: colors.cardBorder }, (isDark ? 'dark' : 'light') === m || (m === 'system') && styles.themeBtnActive]} onPress={() => toggleTheme(m)}>
              <Text style={[styles.themeBtnText, { color: colors.textSecondary }]}>{m.charAt(0).toUpperCase() + m.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        {menuItems.map((item) => (
          <TouchableOpacity key={item.label} style={[styles.menuItem, { borderBottomColor: colors.divider }]} onPress={() => navigation.navigate(item.screen)}>
            <View style={[styles.menuIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name={item.icon} size={20} color={colors.primary} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.chevron} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#dc2626" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileCard: { borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 12, borderWidth: 1 },
  avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { fontSize: 20, fontWeight: '700' },
  name: { fontSize: 18, fontWeight: '700' },
  role: { fontSize: 13, marginTop: 4 },
  themeRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, gap: 10 },
  themeLabel: { fontSize: 14, fontWeight: '600', flex: 1 },
  themeButtons: { flexDirection: 'row', gap: 6 },
  themeBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  themeBtnActive: { borderColor: '#C8922A' },
  themeBtnText: { fontSize: 11, fontWeight: '600' },
  menu: { borderRadius: 16, overflow: 'hidden', marginBottom: 16, borderWidth: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, backgroundColor: '#fef2f220', borderRadius: 14, marginBottom: 30, borderWidth: 1, borderColor: '#dc262630' },
  logoutText: { color: '#dc2626', fontSize: 15, fontWeight: '600' },
});
