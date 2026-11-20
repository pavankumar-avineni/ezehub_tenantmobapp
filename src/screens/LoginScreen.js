import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../theme/ThemeContext';
import api from '../services/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const { colors } = useTheme();

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please enter email and password'); return; }
    setLoading(true);
    console.log('🔐 Attempting login with email:', email);
    try {
      const { data } = await api.post('/auth/tenant/login', { email, password });
      console.log('🔐 Login successful!');
      setAuth(data.data);
    } catch (err) {
      console.log('🔐 Login failed:', err.response?.data?.message || err.message);
      const msg = err.response?.data?.message 
        || (err.code === 'ECONNABORTED' ? 'Server is waking up, please try again in 30 seconds' 
        : err.message?.includes('Network') ? 'Cannot reach server. Check internet or server may be starting up.' 
        : 'Please check your credentials');
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
        <Text style={[styles.title, { color: colors.text }]}>EzeHub</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Tenant Management</Text>
      </View>

      <View style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <Text style={[styles.formTitle, { color: colors.text }]}>Sign In</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={colors.textMuted}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 80, height: 80, borderRadius: 16, marginBottom: 14 },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 4 },
  form: { borderRadius: 20, padding: 24, borderWidth: 1 },
  formTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 14 },
  button: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
