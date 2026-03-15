import React, { createContext, useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Auth Context
import { AuthProvider, useAuth, ROLES } from './src/context/AuthContext';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import MapScreen from './src/screens/MapScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Theme
import colors from './src/theme/colors';

// Navigation Context
const NavigationContext = createContext(null);

export const useNavigation = () => useContext(NavigationContext);

// Define available screens with their required permissions
const screens = [
  { name: 'Dashboard', component: DashboardScreen, icon: 'home', label: 'Dashboard', permission: 'view_dashboard' },
  { name: 'Map', component: MapScreen, icon: 'map', label: 'Geospatial', permission: 'view_map' },
  { name: 'Reports', component: ReportsScreen, icon: 'analytics', label: 'Analytics', permission: 'view_analytics' },
  { name: 'Settings', component: SettingsScreen, icon: 'settings', label: 'Settings', permission: 'view_dashboard' },
];

// Main App Content with Tab Navigation
const MainApp = () => {
  const { user, canAccess, logout, switchRole } = useAuth();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const { navigate } = useNavigation() || {};

  // Handle tab press
  const handleTabPress = (screenName) => {
    const screen = screens.find(s => s.name === screenName);
    if (screen && canAccess(screen.permission)) {
      setActiveTab(screenName);
    }
  };

  // Find active screen component
  const getActiveScreen = () => {
    try {
      const availableScreens = screens.filter(screen => canAccess(screen.permission));
      if (availableScreens.length === 0) return DashboardScreen;
      const screen = availableScreens.find(s => s.name === activeTab);
      return screen ? screen.component : availableScreens[0].component;
    } catch (error) {
      return DashboardScreen;
    }
  };

  const ActiveScreen = getActiveScreen();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userAvatar}>{user?.avatar || '👤'}</Text>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={[styles.roleText, { color: user?.role === ROLES.ADMIN ? colors.primary : colors.info }]}>
              {user?.role === ROLES.ADMIN ? '👨‍💼 Admin' : '👤 Citizen'}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.roleSwitchButton} onPress={() => switchRole(user?.role === ROLES.ADMIN ? ROLES.CITIZEN : ROLES.ADMIN)}>
            <Ionicons name="swap-horizontal" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.screenContainer}>
        <ActiveScreen onNavigate={setActiveTab} />
      </View>

      <View style={styles.tabBar}>
        {screens.map((screen) => {
          const hasAccess = canAccess(screen.permission);
          const isActive = activeTab === screen.name;
          
          if (!hasAccess) {
            return (
              <View key={screen.name} style={styles.tabItem}>
                <Ionicons name={`${screen.icon}-outline`} size={24} color={colors.textSecondary} />
                <Text style={styles.tabLabelDisabled}>{screen.label}</Text>
              </View>
            );
          }
          
          return (
            <TouchableOpacity key={screen.name} style={styles.tabItem} onPress={() => handleTabPress(screen.name)}>
              <Ionicons name={isActive ? screen.icon : `${screen.icon}-outline`} size={24} color={isActive ? colors.primary : colors.textSecondary} />
              <Text style={[styles.tabLabel, { color: isActive ? colors.primary : colors.textSecondary }]}>{screen.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

const AuthenticatedApp = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('Dashboard');

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <LoginScreen />;

  return (
    <NavigationContext.Provider value={{ navigate: setCurrentScreen, currentScreen }}>
      <MainApp />
    </NavigationContext.Provider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: 16, fontSize: 16, color: colors.textSecondary },
  userHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.cardBackground, borderBottomWidth: 1, borderBottomColor: colors.border },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  userAvatar: { fontSize: 32, marginRight: 12 },
  userDetails: { justifyContent: 'center' },
  userName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  roleText: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roleSwitchButton: { padding: 8, backgroundColor: colors.background, borderRadius: 8, borderWidth: 1, borderColor: colors.primary },
  logoutButton: { padding: 8, backgroundColor: colors.danger + '15', borderRadius: 8 },
  screenContainer: { flex: 1 },
  tabBar: { flexDirection: 'row', backgroundColor: colors.cardBackground, borderTopWidth: 1, borderTopColor: colors.border, paddingBottom: 8, paddingTop: 8, height: 60 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  tabLabelDisabled: { fontSize: 11, fontWeight: '500', marginTop: 2, color: colors.textSecondary, opacity: 0.5 },
});
