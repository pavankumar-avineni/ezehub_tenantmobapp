import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { DetailField, SectionTitle } from '../components/DetailCard';
import { StatusBadge } from '../components/StatusBadge';

export default function ResidentDetailScreen({ route }) {
  const { id } = route.params;

  const { data, isLoading } = useQuery({
    queryKey: ['resident-detail', id],
    queryFn: async () => {
      console.log(`👤 Fetching resident detail for ID: ${id}`);
      const result = (await api.get(`/tenant/residents/${id}`)).data.data;
      console.log(`👤 Resident detail loaded:`, JSON.stringify(result, null, 2));
      return result;
    },
  });

  if (isLoading) return <View style={styles.center}><Text style={styles.loadingText}>Loading...</Text></View>;
  if (!data) return <View style={styles.center}><Text>Not found</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{data.firstName?.[0]}{data.lastName?.[0]}</Text></View>
        <Text style={styles.name}>{data.firstName} {data.lastName}</Text>
        <StatusBadge status={data.status} />
      </View>

      {/* Personal */}
      <View style={styles.section}>
        <SectionTitle title="Personal Information" />
        <View style={styles.grid}>
          <DetailField label="Phone" value={data.phone} />
          <DetailField label="Email" value={data.email} />
          <DetailField label="Gender" value={data.gender} />
          <DetailField label="Date of Birth" value={data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString('en-IN') : null} />
          <DetailField label="Blood Group" value={data.bloodGroup?.replace('_', ' ')} />
          <DetailField label="Food Preference" value={data.foodPreference?.replace('_', ' ')} />
        </View>
      </View>

      {/* Location */}
      <View style={styles.section}>
        <SectionTitle title="Location" />
        <View style={styles.grid}>
          <DetailField label="Building" value={data.bed?.room?.floor?.building?.name} />
          <DetailField label="Floor" value={data.bed?.room?.floor?.name} />
          <DetailField label="Room" value={data.bed?.room?.name} />
          <DetailField label="Bed" value={data.bed?.label} />
        </View>
      </View>

      {/* Occupation */}
      <View style={styles.section}>
        <SectionTitle title="Occupation" />
        <View style={styles.grid}>
          <DetailField label="Occupation" value={data.occupation} />
          <DetailField label="Company" value={data.company} />
          <DetailField label="College" value={data.college} />
        </View>
      </View>

      {/* ID Proof */}
      <View style={styles.section}>
        <SectionTitle title="ID Proof" />
        <View style={styles.grid}>
          <DetailField label="Type" value={data.idProofType} />
          <DetailField label="Number" value={data.idProofNumber} />
        </View>
      </View>

      {/* Emergency */}
      <View style={styles.section}>
        <SectionTitle title="Emergency Contact" />
        <View style={styles.grid}>
          <DetailField label="Name" value={data.emergencyContact?.name} />
          <DetailField label="Phone" value={data.emergencyContact?.phone} />
          <DetailField label="Relation" value={data.emergencyContact?.relation} />
        </View>
      </View>

      {/* Payment */}
      <View style={styles.section}>
        <SectionTitle title="Payment" />
        <View style={styles.grid}>
          <DetailField label="Deposit" value={`₹${Number(data.depositAmount || 0).toLocaleString('en-IN')}`} />
          <DetailField label="Advance Rent" value={`₹${Number(data.advanceRent || 0).toLocaleString('en-IN')}`} />
          <DetailField label="Check-in Date" value={data.checkInDate ? new Date(data.checkInDate).toLocaleDateString('en-IN') : null} />
        </View>
      </View>

      {/* Documents */}
      {data.documents?.length > 0 && (
        <View style={styles.section}>
          <SectionTitle title="Documents" />
          {data.documents.map((doc) => (
            <TouchableOpacity key={doc.id} style={styles.docRow} onPress={() => Linking.openURL(doc.url)}>
              <Ionicons name="document-outline" size={16} color="#2563eb" />
              <Text style={styles.docName}>{doc.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {data.notes && (
        <View style={styles.section}>
          <SectionTitle title="Notes" />
          <Text style={styles.notes}>{data.notes}</Text>
        </View>
      )}

      {/* Call button */}
      <TouchableOpacity style={styles.callButton} onPress={() => Linking.openURL(`tel:${data.phone}`)}>
        <Ionicons name="call-outline" size={18} color="#fff" />
        <Text style={styles.callText}>Call Resident</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f9ff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#64748b' },
  header: { alignItems: 'center', paddingVertical: 20 },
  avatar: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginBottom: 10, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 6 },
  section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  docName: { fontSize: 13, color: '#2563eb', fontWeight: '500' },
  notes: { fontSize: 13, color: '#475569', lineHeight: 20 },
  callButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#059669', borderRadius: 14, padding: 16, marginBottom: 30, shadowColor: '#059669', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  callText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
