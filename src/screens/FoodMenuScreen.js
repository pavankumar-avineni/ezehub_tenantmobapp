import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useTheme } from '../theme/ThemeContext';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MEALS = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];
const MEAL_ICONS = { BREAKFAST: 'sunny-outline', LUNCH: 'restaurant-outline', SNACKS: 'cafe-outline', DINNER: 'moon-outline' };

export default function FoodMenuScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [newItem, setNewItem] = useState('');
  const [activeInput, setActiveInput] = useState(null); // "dayIdx-meal"

  const { data: buildings } = useQuery({
    queryKey: ['buildings-list'],
    queryFn: async () => (await api.get('/tenant/buildings', { params: { limit: 100 } })).data.data,
  });

  const { data: menu, isLoading, refetch } = useQuery({
    queryKey: ['food-menu', selectedBuilding],
    queryFn: async () => (await api.get(`/tenant/menu/${selectedBuilding}`)).data.data,
    enabled: !!selectedBuilding,
  });

  const saveMutation = useMutation({
    mutationFn: (body) => api.post('/tenant/menu', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['food-menu'] }); setNewItem(''); setActiveInput(null); },
    onError: (err) => Alert.alert('Error', err.response?.data?.message || 'Failed to save'),
  });

  const addItem = (dayOfWeek, mealType, currentItems) => {
    if (!newItem.trim()) return;
    saveMutation.mutate({ buildingId: selectedBuilding, dayOfWeek, mealType, items: [...(currentItems || []), newItem.trim()] });
  };

  const removeItem = (dayOfWeek, mealType, currentItems, idx) => {
    Alert.alert('Remove', `Remove "${currentItems[idx]}"?`, [
      { text: 'Cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        saveMutation.mutate({ buildingId: selectedBuilding, dayOfWeek, mealType, items: currentItems.filter((_, i) => i !== idx) });
      }},
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}>
      {/* Building Picker */}
      <View style={styles.picker}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Select Building</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(buildings || []).map((b) => (
            <TouchableOpacity key={b.id} style={[styles.chip, { borderColor: colors.cardBorder }, selectedBuilding === b.id && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setSelectedBuilding(b.id)}>
              <Text style={[styles.chipText, { color: colors.textSecondary }, selectedBuilding === b.id && { color: '#fff' }]}>{b.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Menu Editor */}
      {selectedBuilding && DAYS.map((day, dayIdx) => {
        const dayMenu = menu?.[day] || [];
        return (
          <View key={day} style={[styles.dayCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={[styles.dayTitle, { color: colors.text }]}>{day}</Text>
            {MEALS.map((meal) => {
              const mealData = dayMenu.find((m) => m.mealType === meal);
              const items = mealData?.items || [];
              const inputKey = `${dayIdx}-${meal}`;
              const isActive = activeInput === inputKey;

              return (
                <View key={meal} style={[styles.mealBox, { backgroundColor: colors.background }]}>
                  <View style={styles.mealHeader}>
                    <Ionicons name={MEAL_ICONS[meal]} size={14} color={colors.primary} />
                    <Text style={[styles.mealLabel, { color: colors.primary }]}>{meal}</Text>
                  </View>

                  {/* Items */}
                  {items.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <Text style={[styles.itemText, { color: colors.text }]}>• {item}</Text>
                      <TouchableOpacity onPress={() => removeItem(dayIdx, meal, items, idx)}>
                        <Ionicons name="close-circle" size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {items.length === 0 && <Text style={[styles.noItems, { color: colors.textMuted }]}>No items added</Text>}

                  {/* Add Item Input */}
                  <View style={styles.addRow}>
                    <TextInput
                      style={[styles.addInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                      placeholder="Add item..."
                      placeholderTextColor={colors.textMuted}
                      value={isActive ? newItem : ''}
                      onFocus={() => setActiveInput(inputKey)}
                      onChangeText={(t) => { setActiveInput(inputKey); setNewItem(t); }}
                      onSubmitEditing={() => { if (isActive) addItem(dayIdx, meal, items); }}
                      returnKeyType="done"
                    />
                    <TouchableOpacity
                      style={[styles.addBtn, { backgroundColor: colors.primary }]}
                      onPress={() => { if (isActive && newItem.trim()) addItem(dayIdx, meal, items); }}
                    >
                      <Ionicons name="add" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        );
      })}

      {!selectedBuilding && <Text style={[styles.empty, { color: colors.textMuted }]}>Select a building to manage its food menu</Text>}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  picker: { padding: 16, paddingBottom: 8 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginRight: 8, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '600' },
  dayCard: { margin: 16, marginTop: 0, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1 },
  dayTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  mealBox: { borderRadius: 10, padding: 10, marginBottom: 8 },
  mealHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  mealLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, paddingLeft: 4 },
  itemText: { fontSize: 13 },
  noItems: { fontSize: 11, fontStyle: 'italic', paddingLeft: 4, marginBottom: 4 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  addInput: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12 },
  addBtn: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
