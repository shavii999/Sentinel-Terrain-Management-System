import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, ROLES } from '../context/AuthContext';
import colors from '../theme/colors';

const SettingsScreen = () => {
  const { user, logout, switchRole, ROLES: UserRoles, canAccess } = useAuth();
  const [darkMode, setDarkMode] = React.useState(false);
  const [locationServices, setLocationServices] = React.useState(true);
  const [notifications, setNotifications] = React.useState(true);

  const isAdmin = user?.role === UserRoles.ADMIN;

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleRoleSwitch = () => {
    Alert.alert(
      'Switch Role',
      `Switch to ${isAdmin ? 'Citizen' : 'Admin'} mode?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Switch', 
          onPress: () => switchRole(isAdmin ? UserRoles.CITIZEN : UserRoles.ADMIN) 
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* User Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileAvatar}>
          <Text style={styles.avatarText}>{user?.avatar || '👤'}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
          <View style={[styles.roleBadge, { backgroundColor: isAdmin ? colors.primary + '20' : colors.info + '20' }]}>
            <Text style={[styles.roleBadgeText, { color: isAdmin ? colors.primary : colors.info }]}>
              {isAdmin ? '👨‍💼 Admin' : '👤 Citizen'}
            </Text>
          </View>
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="person-outline" size={22} color={colors.textPrimary} />
          <Text style={styles.settingText}>Profile</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleRoleSwitch}>
          <Ionicons name="swap-horizontal" size={22} color={colors.primary} />
          <Text style={[styles.settingText, { color: colors.primary }]}>
            Switch to {isAdmin ? 'Citizen' : 'Admin'} Mode
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
        
        {isAdmin && (
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="people-outline" size={22} color={colors.textPrimary} />
            <Text style={styles.settingText}>Manage Users</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        
        <View style={styles.settingItem}>
          <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
          <Text style={styles.settingText}>Notifications</Text>
          <Switch 
            value={notifications} 
            onValueChange={setNotifications}
            trackColor={{ false: colors.border, true: colors.primary }} 
          />
        </View>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.settingItem}>
          <Ionicons name="moon-outline" size={22} color={colors.textPrimary} />
          <Text style={styles.settingText}>Dark Mode</Text>
          <Switch 
            value={darkMode} 
            onValueChange={setDarkMode}
            trackColor={{ false: colors.border, true: colors.primary }} 
          />
        </View>
        <View style={styles.settingItem}>
          <Ionicons name="location-outline" size={22} color={colors.textPrimary} />
          <Text style={styles.settingText}>Location Services</Text>
          <Switch 
            value={locationServices} 
            onValueChange={setLocationServices}
            trackColor={{ false: colors.border, true: colors.primary }} 
          />
        </View>
      </View>

      {/* Data & Sync Section - Admin only */}
      {isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Sync</Text>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="cloud-outline" size={22} color={colors.textPrimary} />
            <Text style={styles.settingText}>Data Sync</Text>
            <Text style={styles.settingValue}>Last sync: Just now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="download-outline" size={22} color={colors.textPrimary} />
            <Text style={styles.settingText}>Export Data</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="analytics-outline" size={22} color={colors.textPrimary} />
            <Text style={styles.settingText}>Analytics</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* System Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="information-circle-outline" size={22} color={colors.textPrimary} />
          <Text style={styles.settingText}>About</Text>
          <Text style={styles.settingValue}>v1.0.0</Text>
        </TouchableOpacity>
        
        {isAdmin && (
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
            <Text style={styles.settingText}>System Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Logout Section */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Sentinel Terrain Management System</Text>
        <Text style={styles.footerSubtext}>National Works Agency - Jamaica</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    backgroundColor: colors.primary + '20',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 30,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    paddingHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: 12,
  },
  settingValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  logoutSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger + '15',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.danger,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  footerSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
});

export default SettingsScreen;
