import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Alert, Linking, TextInput, Modal } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { useTheme } from '../theme/ThemeContext';

export default function PaymentProofsScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: proofs, isLoading, refetch } = useQuery({
    queryKey: ['pending-payment-proofs'],
    queryFn: async () => (await api.get('/tenant/payments/pending-proofs')).data.data,
    
  });

  const confirmMutation = useMutation({
    mutationFn: (paymentId) => api.post(`/tenant/payments/${paymentId}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-payment-proofs'] });
      queryClient.invalidateQueries({ queryKey: ['rent-charges'] });
      queryClient.invalidateQueries({ queryKey: ['rent-outstanding'] });
      Alert.alert('Confirmed ✅', 'Payment confirmed and resident notified.');
    },
    onError: (err) => Alert.alert('Error', err.response?.data?.message || 'Failed to confirm'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ paymentId, reason }) => api.post(`/tenant/payments/${paymentId}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-payment-proofs'] });
      setRejectModal(null);
      setRejectReason('');
      Alert.alert('Rejected', 'Payment rejected and resident notified to resubmit.');
    },
    onError: (err) => Alert.alert('Error', err.response?.data?.message || 'Failed to reject'),
  });

  const handleConfirm = (payment) => {
    Alert.alert(
      'Confirm Payment',
      `Confirm ₹${Number(payment.amount).toLocaleString('en-IN')} from ${payment.resident?.firstName} ${payment.resident?.lastName}?\n\nTxn: ${payment.transactionId}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => confirmMutation.mutate(payment.id) },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.residentRow}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{item.resident?.firstName?.[0]}{item.resident?.lastName?.[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.residentName, { color: colors.text }]}>{item.resident?.firstName} {item.resident?.lastName}</Text>
            <Text style={[styles.phone, { color: colors.textSecondary }]}>{item.resident?.phone}</Text>
          </View>
        </View>
        <Text style={[styles.amount, { color: colors.text }]}>₹{Number(item.amount).toLocaleString('en-IN')}</Text>
      </View>

      {/* Details */}
      <View style={[styles.details, { borderTopColor: colors.divider }]}>
        <DetailRow label="Method" value={item.method} colors={colors} />
        <DetailRow label="Transaction ID" value={item.transactionId} colors={colors} />
        {item.rentCharge && <DetailRow label="Period" value={`${item.rentCharge.month}/${item.rentCharge.year}`} colors={colors} />}
        <DetailRow label="Submitted" value={new Date(item.createdAt).toLocaleDateString('en-IN')} colors={colors} />
      </View>

      {/* Proof Link */}
      {item.paymentProofUrl && (
        <TouchableOpacity style={[styles.proofLink, { backgroundColor: colors.bannerBg }]} onPress={() => Linking.openURL(item.paymentProofUrl)}>
          <Ionicons name="image" size={16} color={colors.primary} />
          <Text style={[styles.proofLinkText, { color: colors.primary }]}>View Payment Screenshot</Text>
        </TouchableOpacity>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: colors.success }]}
          onPress={() => handleConfirm(item)}
          disabled={confirmMutation.isPending}
        >
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={styles.actionText}>Confirm</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.rejectBtn, { backgroundColor: colors.error }]}
          onPress={() => setRejectModal(item)}
        >
          <Ionicons name="close-circle" size={18} color="#fff" />
          <Text style={styles.actionText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Summary */}
      <View style={[styles.summaryBar, { backgroundColor: colors.warning + '15' }]}>
        <Ionicons name="time" size={18} color={colors.warning} />
        <Text style={[styles.summaryText, { color: colors.warning }]}>
          {proofs?.length || 0} payment{(proofs?.length || 0) !== 1 ? 's' : ''} awaiting confirmation
        </Text>
      </View>

      <FlatList
        data={proofs || []}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={{ padding: 16 }}
        renderItem={renderItem}
        ListEmptyComponent={!isLoading && (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle" size={48} color={colors.success} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No pending proofs</Text>
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>All payment proofs have been reviewed</Text>
          </View>
        )}
      />

      {/* Reject Modal */}
      <Modal visible={!!rejectModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Reject Payment</Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              Rejecting ₹{Number(rejectModal?.amount || 0).toLocaleString('en-IN')} from {rejectModal?.resident?.firstName}
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder="Reason for rejection..."
              placeholderTextColor={colors.textMuted}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.background }]} onPress={() => { setRejectModal(null); setRejectReason(''); }}>
                <Text style={[styles.modalBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.error }]}
                onPress={() => { if (!rejectReason.trim()) return Alert.alert('Error', 'Enter a reason'); rejectMutation.mutate({ paymentId: rejectModal.id, reason: rejectReason }); }}
                disabled={rejectMutation.isPending}
              >
                <Text style={styles.modalBtnTextWhite}>{rejectMutation.isPending ? 'Rejecting...' : 'Reject'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DetailRow({ label, value, colors }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{value || '-'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summaryBar: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, marginBottom: 0, padding: 14, borderRadius: 12 },
  summaryText: { fontSize: 13, fontWeight: '600' },
  card: { borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  residentRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { fontSize: 13, fontWeight: '700' },
  residentName: { fontSize: 14, fontWeight: '600' },
  phone: { fontSize: 11, marginTop: 1 },
  amount: { fontSize: 18, fontWeight: '800' },
  details: { borderTopWidth: 1, paddingTop: 12, marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  detailLabel: { fontSize: 12 },
  detailValue: { fontSize: 12, fontWeight: '600' },
  proofLink: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 10, marginBottom: 12 },
  proofLinkText: { fontSize: 13, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 10 },
  confirmBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 10 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 10 },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  emptySubtext: { fontSize: 13, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  modalSub: { fontSize: 13, marginBottom: 16 },
  modalInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  modalBtnText: { fontSize: 14, fontWeight: '600' },
  modalBtnTextWhite: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
