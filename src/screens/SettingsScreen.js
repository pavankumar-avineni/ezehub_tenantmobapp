import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../theme/ThemeContext';
import api from '../services/api';

export default function SettingsScreen() {
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);

  const handleSaveNotifPrefs = async () => {
    try {
      await api.patch('/tenant/settings/notifications', {
        push: pushEnabled,
        email: emailEnabled,
        sms: smsEnabled,
      });
      Alert.alert('Saved', 'Notification preferences updated.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update settings');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 16 }}>
      {/* Account Info */}
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>Account</Text>
      <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
        <View style={[styles.infoRow, { borderBottomColor: colors.divider }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Name</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{user?.firstName} {user?.lastName}</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomColor: colors.divider }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{user?.email || '-'}</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomColor: colors.divider }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Role</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{user?.role?.name || '-'}</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomColor: colors.divider }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Organization</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{user?.tenant?.name || '-'}</Text>
        </View>
      </View>

      {/* Notification Preferences */}
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>Notifications</Text>
      <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
        <View style={[styles.switchRow, { borderBottomColor: colors.divider }]}>
          <View style={styles.switchInfo}>
            <Ionicons name="notifications-outline" size={18} color={colors.primary} />
            <Text style={[styles.switchLabel, { color: colors.text }]}>Push Notifications</Text>
          </View>
          <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ true: colors.primary }} />
        </View>
        <View style={[styles.switchRow, { borderBottomColor: colors.divider }]}>
          <View style={styles.switchInfo}>
            <Ionicons name="mail-outline" size={18} color={colors.primary} />
            <Text style={[styles.switchLabel, { color: colors.text }]}>Email Notifications</Text>
          </View>
          <Switch value={emailEnabled} onValueChange={setEmailEnabled} trackColor={{ true: colors.primary }} />
        </View>
        <View style={[styles.switchRow, { borderBottomColor: colors.divider }]}>
          <View style={styles.switchInfo}>
            <Ionicons name="chatbox-outline" size={18} color={colors.primary} />
            <Text style={[styles.switchLabel, { color: colors.text }]}>SMS Notifications</Text>
          </View>
          <Switch value={smsEnabled} onValueChange={setSmsEnabled} trackColor={{ true: colors.primary }} />
        </View>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSaveNotifPrefs}>
          <Text style={styles.saveBtnText}>Save Preferences</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>About</Text>
      <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
        <View style={[styles.infoRow, { borderBottomColor: colors.divider }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>App Version</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>1.0.0</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomColor: colors.divider }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>API</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>v1</Text>
        </View>
      </View>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginTop: 16, marginBottom: 8, letterSpacing: 0.5 },
  section: { borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '600' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  switchInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  switchLabel: { fontSize: 14 },
  saveBtn: { borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 14 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
