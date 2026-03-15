import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, ROLES } from '../context/AuthContext';
import colors from '../theme/colors';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState(ROLES.ADMIN);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    const result = await login(email, password, selectedRole);
    if (!result.success) {
      Alert.alert('Login Failed', result.error || 'Please try again');
    }
  };

  const selectRole = (role) => {
    setSelectedRole(role);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo and Title */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="shield-checkmark" size={60} color={colors.primary} />
            </View>
            <Text style={styles.title}>Sentinel Terrain</Text>
            <Text style={styles.subtitle}>Management System</Text>
            <Text style={styles.systemInfo}>National Works Agency - Jamaica</Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Sign In</Text>

            {/* Role Selection */}
            <Text style={styles.label}>Select User Role</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  selectedRole === ROLES.ADMIN && styles.roleButtonActive,
                ]}
                onPress={() => selectRole(ROLES.ADMIN)}
              >
                <Ionicons
                  name="shield"
                  size={24}
                  color={selectedRole === ROLES.ADMIN ? '#fff' : colors.primary}
                />
                <Text
                  style={[
                    styles.roleText,
                    selectedRole === ROLES.ADMIN && styles.roleTextActive,
                  ]}
                >
                  Admin
                </Text>
                <Text
                  style={[
                    styles.roleDesc,
                    selectedRole === ROLES.ADMIN && styles.roleDescActive,
                  ]}
                >
                  Full access to all features
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  selectedRole === ROLES.CITIZEN && styles.roleButtonActive,
                ]}
                onPress={() => selectRole(ROLES.CITIZEN)}
              >
                <Ionicons
                  name="person"
                  size={24}
                  color={selectedRole === ROLES.CITIZEN ? '#fff' : colors.primary}
                />
                <Text
                  style={[
                    styles.roleText,
                    selectedRole === ROLES.CITIZEN && styles.roleTextActive,
                  ]}
                >
                  Citizen
                </Text>
                <Text
                  style={[
                    styles.roleDesc,
                    selectedRole === ROLES.CITIZEN && styles.roleDescActive,
                  ]}
                >
                  Limited access - Report issues
                </Text>
              </TouchableOpacity>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="log-in" size={20} color="#fff" />
                  <Text style={styles.loginButtonText}>Sign In</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Demo Info */}
            <View style={styles.demoInfo}>
              <Ionicons name="information-circle" size={16} color={colors.info} />
              <Text style={styles.demoText}>
                Demo Mode: Enter any email and password to test
              </Text>
            </View>
          </View>

          {/* Features Preview */}
          <View style={styles.featuresPreview}>
            <Text style={styles.featuresTitle}>
              {selectedRole === ROLES.ADMIN ? 'Admin Features' : 'Citizen Features'}
            </Text>
            <View style={styles.featuresList}>
              {selectedRole === ROLES.ADMIN ? (
                <>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.featureText}>Full dashboard access</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.featureText}>Road condition scanning</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.featureText}>Incident management</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.featureText}>Task assignment</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.featureText}>Analytics & reporting</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.featureText}>User management</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.featureText}>View dashboard</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.featureText}>View map & satellite</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.featureText}>Report issues</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.featureText}>View incident status</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: colors.primary + '15',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 4,
  },
  systemInfo: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  form: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  roleButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 8,
  },
  roleTextActive: {
    color: '#fff',
  },
  roleDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  roleDescActive: {
    color: '#fff',
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  eyeButton: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  demoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.info + '15',
    borderRadius: 8,
    gap: 8,
  },
  demoText: {
    flex: 1,
    fontSize: 12,
    color: colors.info,
  },
  featuresPreview: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  featuresList: {
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default LoginScreen;
