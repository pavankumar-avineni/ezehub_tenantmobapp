import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useTheme } from '../theme/ThemeContext';

export default function BedMapScreen() {
  const { colors } = useTheme();
  const [selectedBuilding, setSelectedBuilding] = useState('');

  const { data: buildings } = useQuery({
    queryKey: ['buildings-list'],
    queryFn: async () => (await api.get('/tenant/buildings', { params: { limit: 100 } })).data.data,
  });

  const { data: bedMap, isLoading, refetch } = useQuery({
    queryKey: ['bed-map', selectedBuilding],
    queryFn: async () => (await api.get(`/tenant/bed-map/${selectedBuilding}`)).data.data,
    enabled: !!selectedBuilding,
  });

  const getBedBg = (bed) => {
    if (bed.status === 'AVAILABLE') return colors.background;
    if (bed.status === 'MAINTENANCE') return '#fef3c7';
    if (bed.gender === 'MALE') return '#dbeafe';
    if (bed.gender === 'FEMALE') return '#fce7f3';
    return '#e9d5ff';
  };

  const getBedBorder = (bed) => {
    if (bed.status === 'AVAILABLE') return colors.cardBorder;
    if (bed.status === 'MAINTENANCE') return '#f59e0b';
    if (bed.gender === 'MALE') return '#3b82f6';
    if (bed.gender === 'FEMALE') return '#ec4899';
    return '#8b5cf6';
  };

  const showBedInfo = (bed) => {
    if (bed.resident) {
      Alert.alert(bed.label, `${bed.resident.name}\nGender: ${bed.resident.gender || 'N/A'}\nPhone: ${bed.resident.phone}`);
    } else {
      Alert.alert(bed.label, 'Available');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}>
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.background, borderColor: colors.cardBorder }]} /><Text style={[styles.legendText, { color: colors.textSecondary }]}>Available</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#dbeafe', borderColor: '#3b82f6' }]} /><Text style={[styles.legendText, { color: colors.textSecondary }]}>Boy</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#fce7f3', borderColor: '#ec4899' }]} /><Text style={[styles.legendText, { color: colors.textSecondary }]}>Girl</Text></View>
      </View>

      {/* Building Picker */}
      <View style={styles.picker}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(buildings || []).map((b) => (
            <TouchableOpacity key={b.id} style={[styles.chip, { borderColor: colors.cardBorder }, selectedBuilding === b.id && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setSelectedBuilding(b.id)}>
              <Text style={[styles.chipText, { color: colors.textSecondary }, selectedBuilding === b.id && { color: '#fff' }]}>{b.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bed Map */}
      {bedMap && bedMap.map((floor) => (
        <View key={floor.id} style={[styles.floorCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.floorTitle, { color: colors.text }]}>{floor.name}</Text>
          {floor.rooms.map((room) => (
            <View key={room.id} style={[styles.roomBox, { backgroundColor: colors.background }]}>
              <Text style={[styles.roomLabel, { color: colors.textSecondary }]}>{room.name} ({room.number})</Text>
              <View style={styles.bedGrid}>
                {room.beds.map((bed) => (
                  <TouchableOpacity key={bed.id} style={[styles.bedBox, { backgroundColor: getBedBg(bed), borderColor: getBedBorder(bed) }]} onPress={() => showBedInfo(bed)}>
                    <Text style={[styles.bedLabel, { color: getBedBorder(bed) }]}>{bed.label}</Text>
                    {bed.resident && <Text style={[styles.bedName, { color: getBedBorder(bed) }]}>{bed.resident.name.split(' ')[0]}</Text>}
                    {!bed.resident && <Text style={[styles.bedEmpty, { color: colors.textMuted }]}>Empty</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      ))}

      {!selectedBuilding && <Text style={[styles.empty, { color: colors.textMuted }]}>Select a building to view bed map</Text>}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  legend: { flexDirection: 'row', gap: 16, padding: 16, paddingBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 16, height: 16, borderRadius: 4, borderWidth: 2 },
  legendText: { fontSize: 11 },
  picker: { paddingHorizontal: 16, paddingBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginRight: 8, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '600' },
  floorCard: { margin: 16, marginTop: 0, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1 },
  floorTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  roomBox: { borderRadius: 10, padding: 10, marginBottom: 8 },
  roomLabel: { fontSize: 11, fontWeight: '600', marginBottom: 6 },
  bedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bedBox: { width: 70, height: 70, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  bedLabel: { fontSize: 11, fontWeight: '700' },
  bedName: { fontSize: 9, fontWeight: '500', marginTop: 2 },
  bedEmpty: { fontSize: 9, marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
