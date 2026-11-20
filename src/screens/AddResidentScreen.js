import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform, Image } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { useTheme } from '../theme/ThemeContext';

const GENDER_OPTIONS = ['MALE', 'FEMALE', 'OTHER'];
const FOOD_OPTIONS = ['VEG', 'NON_VEG', 'VEGAN'];
const BLOOD_GROUPS = ['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE'];
const ID_PROOF_TYPES = ['AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID'];
const OCCUPATION_TYPES = ['WORKING', 'STUDENT', 'OTHER'];
const VEHICLE_TYPES = ['TWO_WHEELER', 'FOUR_WHEELER', 'BICYCLE', 'OTHER'];

function SectionHeader({ title, icon, colors }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>{title}</Text>
    </View>
  );
}

function FormInput({ label, value, onChangeText, placeholder, keyboardType, required, multiline, error, maxLength, colors }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}{required && <Text style={{ color: colors.error }}> *</Text>}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBg, borderColor: error ? colors.error : colors.inputBorder, color: colors.text }]}
        value={value} onChangeText={onChangeText} placeholder={placeholder || label}
        placeholderTextColor={colors.textMuted} keyboardType={keyboardType || 'default'}
        multiline={multiline} numberOfLines={multiline ? 3 : 1} maxLength={maxLength}
      />
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
    </View>
  );
}

function DateField({ label, value, onChange, required, error, colors, minDate, maxDate }) {
  const [show, setShow] = useState(false);
  const display = value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}{required && <Text style={{ color: colors.error }}> *</Text>}</Text>
      <TouchableOpacity style={[styles.input, styles.dateInput, { backgroundColor: colors.inputBg, borderColor: error ? colors.error : colors.inputBorder }]} onPress={() => setShow(true)}>
        <Text style={[{ fontSize: 14 }, display ? { color: colors.text } : { color: colors.textMuted }]}>{display || 'Select date'}</Text>
        <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
      </TouchableOpacity>
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
      {show && (
        <DateTimePicker value={value ? new Date(value) : new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={maxDate} minimumDate={minDate}
          onChange={(e, d) => { setShow(Platform.OS === 'ios'); if (e.type !== 'dismissed' && d) onChange(d.toISOString().split('T')[0]); }} />
      )}
    </View>
  );
}

function ChipPicker({ label, options, selected, onSelect, required, error, colors }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}{required && <Text style={{ color: colors.error }}> *</Text>}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {options.map((opt) => (
          <TouchableOpacity key={opt} style={[styles.chip, { borderColor: colors.inputBorder }, selected === opt && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => onSelect(selected === opt ? '' : opt)}>
            <Text style={[styles.chipText, { color: colors.textSecondary }, selected === opt && { color: '#fff' }]}>{opt.replace(/_/g, ' ')}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
    </View>
  );
}

export default function AddResidentScreen({ navigation }) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState({});
  const [profileImage, setProfileImage] = useState(null);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [foodPreference, setFoodPreference] = useState('');
  const [identificationMark, setIdentificationMark] = useState('');

  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedBed, setSelectedBed] = useState('');

  const [occupationType, setOccupationType] = useState('');
  const [company, setCompany] = useState('');
  const [college, setCollege] = useState('');
  const [occupation, setOccupation] = useState('');

  const [idProofType, setIdProofType] = useState('');
  const [idProofNumber, setIdProofNumber] = useState('');
  const [idProofImages, setIdProofImages] = useState([]);

  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');

  const [hasVehicle, setHasVehicle] = useState(false);
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');

  const [depositAmount, setDepositAmount] = useState('');
  const [advanceRent, setAdvanceRent] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [notes, setNotes] = useState('');

  // Profile photo picker
  const pickProfileImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled && result.assets?.[0]) setProfileImage(result.assets[0].uri);
  };

  // ID proof images
  const pickIdProof = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, quality: 0.7 });
    if (!result.canceled && result.assets) setIdProofImages([...idProofImages, ...result.assets.map(a => a.uri)]);
  };

  // ── Location APIs (fixed endpoints) ─────────────────────────────────────────
  const { data: buildingsData } = useQuery({
    queryKey: ['buildings-list'],
    queryFn: async () => (await api.get('/tenant/buildings', { params: { limit: 100 } })).data,
  });
  const buildings = buildingsData?.data || [];

  const { data: floorsData, isLoading: floorsLoading } = useQuery({
    queryKey: ['floors', selectedBuilding],
    queryFn: async () => {
      console.log(`📍 Fetching floors for building: ${selectedBuilding}`);
      // Try multiple endpoint patterns
      try {
        const res = await api.get(`/tenant/buildings/${selectedBuilding}/floors`, { params: { limit: 100 } });
        return res.data;
      } catch (e1) {
        console.log('📍 /buildings/:id/floors failed, trying /tenant/floors');
        const res = await api.get('/tenant/floors', { params: { buildingId: selectedBuilding, limit: 100 } });
        return res.data;
      }
    },
    enabled: !!selectedBuilding,
  });
  const floors = floorsData?.data || [];

  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms', selectedFloor],
    queryFn: async () => {
      console.log(`📍 Fetching rooms for floor: ${selectedFloor}`);
      try {
        const res = await api.get(`/tenant/floors/${selectedFloor}/rooms`, { params: { limit: 100 } });
        return res.data;
      } catch (e1) {
        console.log('📍 /floors/:id/rooms failed, trying /tenant/rooms');
        const res = await api.get('/tenant/rooms', { params: { floorId: selectedFloor, limit: 100 } });
        return res.data;
      }
    },
    enabled: !!selectedFloor,
  });
  const rooms = roomsData?.data || [];

  const { data: bedsData, isLoading: bedsLoading } = useQuery({
    queryKey: ['beds', selectedRoom],
    queryFn: async () => {
      console.log(`📍 Fetching beds for room: ${selectedRoom}`);
      try {
        const res = await api.get(`/tenant/rooms/${selectedRoom}/beds`, { params: { limit: 100 } });
        return res.data;
      } catch (e1) {
        console.log('📍 /rooms/:id/beds failed, trying /tenant/beds');
        const res = await api.get('/tenant/beds', { params: { roomId: selectedRoom, limit: 100 } });
        return res.data;
      }
    },
    enabled: !!selectedRoom,
  });
  // Filter out occupied beds
  const beds = (bedsData?.data || []).filter(b => b.status !== 'OCCUPIED');

  useEffect(() => { setSelectedFloor(''); setSelectedRoom(''); setSelectedBed(''); }, [selectedBuilding]);
  useEffect(() => { setSelectedRoom(''); setSelectedBed(''); }, [selectedFloor]);
  useEffect(() => { setSelectedBed(''); }, [selectedRoom]);

  // ── Validation & Submit ─────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!firstName.trim()) e.firstName = 'Required';
    if (!lastName.trim()) e.lastName = 'Required';
    if (!phone.trim()) e.phone = 'Required';
    else if (!/^[6-9]\d{9}$/.test(phone.trim())) e.phone = 'Invalid phone';
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Invalid email';
    if (!gender) e.gender = 'Required';
    if (!dateOfBirth) e.dateOfBirth = 'Required';
    if (!selectedBed) e.bed = 'Select building → floor → room → bed';
    if (!occupationType) e.occupationType = 'Required';
    if (occupationType === 'WORKING' && !company.trim()) e.company = 'Required';
    if (occupationType === 'STUDENT' && !college.trim()) e.college = 'Required';
    if (emergencyPhone.trim() && emergencyPhone.trim() === phone.trim()) e.emergencyPhone = 'Cannot be same as resident phone';
    if (hasVehicle && !vehicleType) e.vehicleType = 'Required';
    if (hasVehicle && !vehicleNumber.trim()) e.vehicleNumber = 'Required';
    if (!checkInDate) e.checkInDate = 'Required';
    setErrors(e);
    if (Object.keys(e).length > 0) { Alert.alert('Validation', 'Please fix highlighted fields.'); return false; }
    return true;
  };

  const createMutation = useMutation({
    mutationFn: async (formData) => (await api.post('/tenant/residents', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['residents'] }); Alert.alert('Success', 'Resident added!', [{ text: 'OK', onPress: () => navigation.goBack() }]); },
    onError: (err) => Alert.alert('Error', err.response?.data?.message || 'Failed to add resident'),
  });

  const handleSubmit = () => {
    if (!validate()) return;
    const fd = new FormData();
    fd.append('firstName', firstName.trim()); fd.append('lastName', lastName.trim()); fd.append('phone', phone.trim());
    if (email.trim()) fd.append('email', email.trim());
    fd.append('gender', gender); fd.append('dateOfBirth', dateOfBirth);
    if (bloodGroup) fd.append('bloodGroup', bloodGroup);
    if (foodPreference) fd.append('foodPreference', foodPreference);
    if (identificationMark.trim()) fd.append('identificationMark', identificationMark.trim());
    fd.append('bedId', selectedBed); fd.append('occupationType', occupationType);
    if (occupation.trim()) fd.append('occupation', occupation.trim());
    if (company.trim()) fd.append('company', company.trim());
    if (college.trim()) fd.append('college', college.trim());
    if (idProofType) fd.append('idProofType', idProofType);
    if (idProofNumber.trim()) fd.append('idProofNumber', idProofNumber.trim());
    if (emergencyName.trim()) fd.append('emergencyContact[name]', emergencyName.trim());
    if (emergencyPhone.trim()) fd.append('emergencyContact[phone]', emergencyPhone.trim());
    if (emergencyRelation.trim()) fd.append('emergencyContact[relation]', emergencyRelation.trim());
    fd.append('hasVehicle', String(hasVehicle));
    if (hasVehicle) { fd.append('vehicle[type]', vehicleType); fd.append('vehicle[number]', vehicleNumber.trim()); if (vehicleModel.trim()) fd.append('vehicle[model]', vehicleModel.trim()); }
    if (depositAmount) fd.append('depositAmount', depositAmount);
    if (advanceRent) fd.append('advanceRent', advanceRent);
    fd.append('checkInDate', checkInDate);
    if (notes.trim()) fd.append('notes', notes.trim());
    if (profileImage) { const ext = profileImage.split('.').pop(); fd.append('profileImage', { uri: profileImage, name: `profile.${ext}`, type: `image/${ext}` }); }
    idProofImages.forEach((uri, i) => { const ext = uri.split('.').pop(); fd.append('idProofDocuments', { uri, name: `id_${i}.${ext}`, type: `image/${ext}` }); });
    createMutation.mutate(fd);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Profile Photo */}
      <TouchableOpacity style={styles.photoSection} onPress={pickProfileImage}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={[styles.photoCircle, { borderColor: colors.primary }]} />
        ) : (
          <View style={[styles.photoCircle, { borderColor: colors.primary, backgroundColor: colors.inputBg }]}>
            <Ionicons name="camera-outline" size={28} color={colors.primary} />
          </View>
        )}
        <Text style={[styles.photoLabel, { color: colors.primary }]}>Add Photo</Text>
      </TouchableOpacity>

      {/* Personal */}
      <SectionHeader title="Personal Information" icon="person-outline" colors={colors} />
      <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}><FormInput label="First Name" value={firstName} onChangeText={setFirstName} required error={errors.firstName} colors={colors} /></View>
          <View style={{ flex: 1 }}><FormInput label="Last Name" value={lastName} onChangeText={setLastName} required error={errors.lastName} colors={colors} /></View>
        </View>
        <FormInput label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" required maxLength={10} error={errors.phone} colors={colors} />
        <FormInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" error={errors.email} colors={colors} />
        <ChipPicker label="Gender" options={GENDER_OPTIONS} selected={gender} onSelect={setGender} required error={errors.gender} colors={colors} />
        <DateField label="Date of Birth" value={dateOfBirth} onChange={setDateOfBirth} required error={errors.dateOfBirth} colors={colors} maxDate={new Date()} />
        <ChipPicker label="Blood Group" options={BLOOD_GROUPS} selected={bloodGroup} onSelect={setBloodGroup} colors={colors} />
        <ChipPicker label="Food Preference" options={FOOD_OPTIONS} selected={foodPreference} onSelect={setFoodPreference} colors={colors} />
        <FormInput label="Identification Mark" value={identificationMark} onChangeText={setIdentificationMark} placeholder="e.g. Mole on left cheek" colors={colors} />
      </View>

      {/* Location */}
      <SectionHeader title="Bed Assignment" icon="bed-outline" colors={colors} />
      <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        {errors.bed && <Text style={[styles.errorText, { color: colors.error }]}>{errors.bed}</Text>}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Building *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {buildings.map(b => (
            <TouchableOpacity key={b.id} style={[styles.chip, { borderColor: colors.inputBorder }, selectedBuilding === b.id && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setSelectedBuilding(b.id)}>
              <Text style={[styles.chipText, { color: colors.textSecondary }, selectedBuilding === b.id && { color: '#fff' }]}>{b.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {selectedBuilding && (<>
          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>Floor *{floorsLoading && ' (loading...)'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {floors.map(f => (
              <TouchableOpacity key={f.id} style={[styles.chip, { borderColor: colors.inputBorder }, selectedFloor === f.id && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setSelectedFloor(f.id)}>
                <Text style={[styles.chipText, { color: colors.textSecondary }, selectedFloor === f.id && { color: '#fff' }]}>{f.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {floors.length === 0 && !floorsLoading && <Text style={[styles.noData, { color: colors.textMuted }]}>No floors found for this building</Text>}
        </>)}
        {selectedFloor && (<>
          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>Room *{roomsLoading && ' (loading...)'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {rooms.map(r => (
              <TouchableOpacity key={r.id} style={[styles.chip, { borderColor: colors.inputBorder }, selectedRoom === r.id && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setSelectedRoom(r.id)}>
                <Text style={[styles.chipText, { color: colors.textSecondary }, selectedRoom === r.id && { color: '#fff' }]}>{r.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>)}
        {selectedRoom && (<>
          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>Bed (available) *{bedsLoading && ' (loading...)'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {beds.map(bed => (
              <TouchableOpacity key={bed.id} style={[styles.chip, { borderColor: colors.inputBorder }, selectedBed === bed.id && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setSelectedBed(bed.id)}>
                <Text style={[styles.chipText, { color: colors.textSecondary }, selectedBed === bed.id && { color: '#fff' }]}>{bed.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {beds.length === 0 && !bedsLoading && <Text style={[styles.noData, { color: colors.textMuted }]}>No available beds</Text>}
        </>)}
      </View>

      {/* Occupation */}
      <SectionHeader title="Occupation" icon="briefcase-outline" colors={colors} />
      <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <ChipPicker label="Type" options={OCCUPATION_TYPES} selected={occupationType} onSelect={setOccupationType} required error={errors.occupationType} colors={colors} />
        {occupationType === 'WORKING' && <FormInput label="Company" value={company} onChangeText={setCompany} required error={errors.company} colors={colors} />}
        {occupationType === 'WORKING' && <FormInput label="Designation" value={occupation} onChangeText={setOccupation} colors={colors} />}
        {occupationType === 'STUDENT' && <FormInput label="College / University" value={college} onChangeText={setCollege} required error={errors.college} colors={colors} />}
        {occupationType === 'STUDENT' && <FormInput label="Course" value={occupation} onChangeText={setOccupation} colors={colors} />}
        {occupationType === 'OTHER' && <FormInput label="Description" value={occupation} onChangeText={setOccupation} colors={colors} />}
      </View>

      {/* ID Proof */}
      <SectionHeader title="ID Proof" icon="card-outline" colors={colors} />
      <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <ChipPicker label="Type" options={ID_PROOF_TYPES} selected={idProofType} onSelect={setIdProofType} colors={colors} />
        <FormInput label="Number" value={idProofNumber} onChangeText={setIdProofNumber} colors={colors} />
        <TouchableOpacity style={[styles.uploadBtn, { borderColor: colors.primary }]} onPress={pickIdProof}>
          <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
          <Text style={[styles.uploadText, { color: colors.primary }]}>Upload ID Proof Images</Text>
        </TouchableOpacity>
        {idProofImages.length > 0 && <Text style={[{ fontSize: 11, marginTop: 6 }, { color: colors.textSecondary }]}>{idProofImages.length} file(s) selected</Text>}
      </View>

      {/* Emergency Contact */}
      <SectionHeader title="Emergency Contact" icon="call-outline" colors={colors} />
      <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <FormInput label="Name" value={emergencyName} onChangeText={setEmergencyName} colors={colors} />
        <FormInput label="Phone" value={emergencyPhone} onChangeText={setEmergencyPhone} keyboardType="phone-pad" maxLength={10} error={errors.emergencyPhone} colors={colors} />
        <FormInput label="Relation" value={emergencyRelation} onChangeText={setEmergencyRelation} placeholder="Father, Mother, Spouse" colors={colors} />
      </View>

      {/* Vehicle */}
      <SectionHeader title="Vehicle" icon="car-outline" colors={colors} />
      <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={styles.toggleRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Has vehicle?</Text>
          <TouchableOpacity style={[styles.toggleBtn, { borderColor: colors.inputBorder }, hasVehicle && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setHasVehicle(!hasVehicle)}>
            <Text style={[styles.toggleText, { color: colors.textSecondary }, hasVehicle && { color: '#fff' }]}>{hasVehicle ? 'YES' : 'NO'}</Text>
          </TouchableOpacity>
        </View>
        {hasVehicle && (<>
          <ChipPicker label="Type" options={VEHICLE_TYPES} selected={vehicleType} onSelect={setVehicleType} required error={errors.vehicleType} colors={colors} />
          <FormInput label="Vehicle Number" value={vehicleNumber} onChangeText={setVehicleNumber} required placeholder="TN 01 AB 1234" error={errors.vehicleNumber} colors={colors} />
          <FormInput label="Model" value={vehicleModel} onChangeText={setVehicleModel} placeholder="Honda Activa" colors={colors} />
        </>)}
      </View>

      {/* Payment */}
      <SectionHeader title="Payment" icon="wallet-outline" colors={colors} />
      <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <FormInput label="Deposit (₹)" value={depositAmount} onChangeText={setDepositAmount} keyboardType="numeric" colors={colors} />
        <FormInput label="Advance Rent (₹)" value={advanceRent} onChangeText={setAdvanceRent} keyboardType="numeric" colors={colors} />
        <DateField label="Check-in Date" value={checkInDate} onChange={setCheckInDate} required error={errors.checkInDate} colors={colors} />
      </View>

      {/* Notes */}
      <SectionHeader title="Notes" icon="document-text-outline" colors={colors} />
      <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <FormInput label="Additional Notes" value={notes} onChangeText={setNotes} multiline placeholder="Any info..." colors={colors} />
      </View>

      {/* Submit */}
      <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleSubmit} disabled={createMutation.isPending}>
        {createMutation.isPending ? <ActivityIndicator color="#fff" /> : (<>
          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
          <Text style={styles.submitText}>Add Resident</Text>
        </>)}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  photoSection: { alignItems: 'center', marginBottom: 10 },
  photoCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  photoLabel: { fontSize: 12, fontWeight: '600', marginTop: 6 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, marginBottom: 6 },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  section: { borderRadius: 12, padding: 14, borderWidth: 1 },
  row: { flexDirection: 'row', gap: 8 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 11, fontWeight: '600', marginBottom: 5 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  dateInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  errorText: { fontSize: 10, marginTop: 3 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, marginRight: 6, borderWidth: 1 },
  chipText: { fontSize: 11, fontWeight: '500' },
  noData: { fontSize: 11, fontStyle: 'italic', marginTop: 6 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 16, borderWidth: 1 },
  toggleText: { fontSize: 11, fontWeight: '600' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed', borderRadius: 10, padding: 12, justifyContent: 'center' },
  uploadText: { fontSize: 12, fontWeight: '600' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, padding: 14, marginTop: 16 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
