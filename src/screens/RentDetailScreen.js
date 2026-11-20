import { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { useTheme } from '../theme/ThemeContext';

export default function RentDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const [cashAmount, setCashAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  // Fetch rent charge details
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['rent-detail', id],
    queryFn: async () => {
      console.log(`💰 Fetching rent detail for ID: ${id}`);
      const result = (await api.get(`/tenant/rent/charges/${id}`)).data.data;
      console.log(`💰 Rent detail loaded:`, JSON.stringify(result, null, 2));
      return result;
    },
    
  });

  // Mark as paid mutation
  const markPaidMutation = useMutation({
    mutationFn: async (payload) => {
      console.log(`💳 Marking rent ${id} as PAID, payload:`, JSON.stringify(payload, null, 2));
      const response = await api.patch(`/tenant/rent/charges/${id}/pay`, payload);
      return response.data;
    },
    onSuccess: (result) => {
      console.log(`✅ Rent marked as paid:`, JSON.stringify(result, null, 2));
      queryClient.invalidateQueries({ queryKey: ['rent-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['rent-charges'] });
      queryClient.invalidateQueries({ queryKey: ['rent-outstanding'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-dashboard'] });
      Alert.alert('Success', 'Rent marked as paid!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error) => {
      console.log(`❌ Mark paid failed:`, JSON.stringify(error.response?.data || error.message, null, 2));
      Alert.alert('Error', error.response?.data?.message || 'Failed to update rent status');
    },
  });

  const handleMarkPaid = () => {
    const totalAmount = Number(data?.totalAmount || 0);
    const paidAmount = Number(data?.paidAmount || 0);
    const pendingAmount = totalAmount - paidAmount;
    const enteredAmount = cashAmount ? Number(cashAmount) : pendingAmount;

    if (enteredAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    Alert.alert(
      'Confirm Payment',
      `Mark ₹${enteredAmount.toLocaleString('en-IN')} as paid via cash?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            const payload = {
              amount: enteredAmount,
              paymentMethod: 'CASH',
              note: paymentNote.trim() || undefined,
            };
            markPaidMutation.mutate(payload);
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Rent charge not found</Text>
      </View>
    );
  }

  const totalAmount = Number(data.totalAmount || 0);
  const paidAmount = Number(data.paidAmount || 0);
  const pendingAmount = totalAmount - paidAmount;
  const isPaid = data.status === 'PAID';
  const isOverdue = data.status === 'OVERDUE';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#2563eb" />}
    >
      {/* Resident Info Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {data.resident?.firstName?.[0]}{data.resident?.lastName?.[0]}
          </Text>
        </View>
        <Text style={styles.residentName}>
          {data.resident?.firstName} {data.resident?.lastName}
        </Text>
        <Text style={styles.residentPhone}>{data.resident?.phone}</Text>
        <StatusBadge status={data.status} />
      </View>

      {/* Rent Period */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="calendar-outline" size={16} color="#2563eb" />
          <Text style={styles.sectionTitle}>Rent Period</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Month/Year</Text>
          <Text style={styles.infoValue}>{data.month}/{data.year}</Text>
        </View>
        {data.dueDate && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Due Date</Text>
            <Text style={[styles.infoValue, isOverdue && { color: '#dc2626' }]}>
              {new Date(data.dueDate).toLocaleDateString('en-IN')}
            </Text>
          </View>
        )}
      </View>

      {/* Amount Breakdown */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="wallet-outline" size={16} color="#2563eb" />
          <Text style={styles.sectionTitle}>Amount Details</Text>
        </View>

        {data.rentAmount != null && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Base Rent</Text>
            <Text style={styles.infoValue}>₹{Number(data.rentAmount || 0).toLocaleString('en-IN')}</Text>
          </View>
        )}
        {data.electricityCharge > 0 && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Electricity</Text>
            <Text style={styles.infoValue}>₹{Number(data.electricityCharge).toLocaleString('en-IN')}</Text>
          </View>
        )}
        {data.waterCharge > 0 && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Water</Text>
            <Text style={styles.infoValue}>₹{Number(data.waterCharge).toLocaleString('en-IN')}</Text>
          </View>
        )}
        {data.maintenanceCharge > 0 && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Maintenance</Text>
            <Text style={styles.infoValue}>₹{Number(data.maintenanceCharge).toLocaleString('en-IN')}</Text>
          </View>
        )}
        {data.otherCharges > 0 && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Other Charges</Text>
            <Text style={styles.infoValue}>₹{Number(data.otherCharges).toLocaleString('en-IN')}</Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { fontWeight: '700', color: '#1e293b' }]}>Total Amount</Text>
          <Text style={[styles.infoValue, { fontWeight: '700', fontSize: 16 }]}>₹{totalAmount.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: '#059669' }]}>Paid</Text>
          <Text style={[styles.infoValue, { color: '#059669' }]}>₹{paidAmount.toLocaleString('en-IN')}</Text>
        </View>

        {pendingAmount > 0 && (
          <View style={[styles.pendingBox]}>
            <Ionicons name="alert-circle" size={18} color="#dc2626" />
            <Text style={styles.pendingLabel}>Pending</Text>
            <Text style={styles.pendingAmount}>₹{pendingAmount.toLocaleString('en-IN')}</Text>
          </View>
        )}

        {isPaid && (
          <View style={styles.paidBox}>
            <Ionicons name="checkmark-circle" size={18} color="#059669" />
            <Text style={styles.paidText}>Fully Paid</Text>
          </View>
        )}
      </View>

      {/* Payment History */}
      {data.payments?.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="receipt-outline" size={16} color="#2563eb" />
            <Text style={styles.sectionTitle}>Payment History</Text>
          </View>
          {data.payments.map((payment, idx) => (
            <View key={payment.id || idx} style={styles.paymentRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentMethod}>{payment.paymentMethod?.replace(/_/g, ' ') || 'N/A'}</Text>
                <Text style={styles.paymentDate}>
                  {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                </Text>
                {payment.note && <Text style={styles.paymentNote}>{payment.note}</Text>}
              </View>
              <Text style={styles.paymentAmount}>₹{Number(payment.amount || 0).toLocaleString('en-IN')}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Location Info */}
      {data.resident?.bed && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="bed-outline" size={16} color="#2563eb" />
            <Text style={styles.sectionTitle}>Location</Text>
          </View>
          <Text style={styles.locationText}>
            {data.resident.bed.room?.floor?.building?.name} → {data.resident.bed.room?.floor?.name} → {data.resident.bed.room?.name} ({data.resident.bed.label})
          </Text>
        </View>
      )}

      {/* Mark as Paid Section (only for unpaid) */}
      {!isPaid && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="cash-outline" size={16} color="#059669" />
            <Text style={[styles.sectionTitle, { color: '#059669' }]}>Record Cash Payment</Text>
          </View>

          <Text style={styles.inputLabel}>Amount (₹)</Text>
          <TextInput
            style={styles.input}
            value={cashAmount}
            onChangeText={setCashAmount}
            placeholder={`${pendingAmount.toLocaleString('en-IN')} (full pending amount)`}
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
          />

          <Text style={styles.inputLabel}>Note (optional)</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={paymentNote}
            onChangeText={setPaymentNote}
            placeholder="e.g. Cash collected by manager"
            placeholderTextColor="#94a3b8"
            multiline
          />

          <TouchableOpacity
            style={styles.payButton}
            onPress={handleMarkPaid}
            disabled={markPaidMutation.isPending}
          >
            {markPaidMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.payButtonText}>Mark as Paid</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.autoPayNote}>
            💡 If the resident pays through their app, this will automatically update to PAID.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f9ff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#64748b', marginTop: 8 },
  emptyText: { color: '#64748b', fontSize: 14 },

  header: { alignItems: 'center', paddingVertical: 20 },
  avatar: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginBottom: 10, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  residentName: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  residentPhone: { fontSize: 13, color: '#64748b', marginBottom: 8 },

  section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', letterSpacing: 0.5 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  infoLabel: { fontSize: 13, color: '#64748b' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1e293b' },

  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 10 },

  pendingBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginTop: 10 },
  pendingLabel: { fontSize: 13, color: '#dc2626', fontWeight: '600', flex: 1 },
  pendingAmount: { fontSize: 16, fontWeight: '700', color: '#dc2626' },

  paidBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ecfdf5', borderRadius: 10, padding: 12, marginTop: 10 },
  paidText: { fontSize: 14, color: '#059669', fontWeight: '600' },

  paymentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  paymentMethod: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  paymentDate: { fontSize: 11, color: '#64748b', marginTop: 2 },
  paymentNote: { fontSize: 11, color: '#94a3b8', marginTop: 2, fontStyle: 'italic' },
  paymentAmount: { fontSize: 14, fontWeight: '600', color: '#059669' },

  locationText: { fontSize: 13, color: '#475569' },

  inputLabel: { fontSize: 12, color: '#475569', fontWeight: '600', marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1e293b', backgroundColor: '#f8fafc' },
  multilineInput: { minHeight: 60, textAlignVertical: 'top' },

  payButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#059669', borderRadius: 12, padding: 16, marginTop: 16, shadowColor: '#059669', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  payButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  autoPayNote: { fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 12, lineHeight: 16 },
});
