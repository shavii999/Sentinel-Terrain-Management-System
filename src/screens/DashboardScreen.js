import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, RefreshControl, Alert, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, ROLES } from '../context/AuthContext';
import { useRealTimeDashboardData } from '../services/DataService';
import KPICard from '../components/KPICard';
import IncidentPanel from '../components/IncidentPanel';
import TaskManager from '../components/TaskManager';
import ReportIssueModal from '../components/ReportIssueModal';
import ChatModal from '../components/ChatModal';
import colors from '../theme/colors';

const DashboardScreen = ({ onNavigate }) => {
  const { user, canAccess, ROLES: UserRoles } = useAuth();
  const {
    dashboardData, incidents, tasks, lastUpdate, isLive, toggleLiveUpdates, refreshData,
    selectedArea, selectArea, areaStats, isLoadingArea, availableAreas,
    submitReport,
  } = useRealTimeDashboardData(60000);
  const [refreshing, setRefreshing] = React.useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showAreaPicker, setShowAreaPicker] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    refreshData();
    setTimeout(() => setRefreshing(false), 1000);
  }, [refreshData]);

  const isAdmin = user?.role === UserRoles.ADMIN;
  const canManageIncidents = canAccess('manage_incidents');
  const canManageTasks = canAccess('manage_tasks');
  const canViewAnalytics = canAccess('view_analytics');
  const canScanRoads = canAccess('scan_roads');

  const formatLastUpdate = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Handle navigation from quick actions
  const handleQuickAction = (action) => {
    if (action === 'map' && onNavigate) {
      onNavigate('Map');
    } else if (action === 'analytics' && onNavigate) {
      onNavigate('Reports');
    } else if (action === 'report') {
      setShowReportModal(true);
    }
  };

  // Handle new incident submission — persist via ReportService
  const handleNewIncident = async (rawReport) => {
    await submitReport(rawReport, user);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{isAdmin ? 'Field Manager' : 'Citizen Dashboard'}</Text>
            <TouchableOpacity style={styles.areaSelector} onPress={() => setShowAreaPicker(true)}>
              <Ionicons name="location" size={14} color={colors.primary} />
              <Text style={styles.areaSelectorText}>{selectedArea?.name ?? 'Select Area'}</Text>
              <Ionicons name="chevron-down" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.logoContainer}>
            <Ionicons name="shield-checkmark" size={28} color={colors.primary} />
          </View>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.stmsTitle}>Sentinel Terrain Management</Text>
          <View style={styles.liveIndicator}>
            <TouchableOpacity style={[styles.liveButton, isLive && styles.liveButtonActive]} onPress={toggleLiveUpdates}>
              <Ionicons name={isLive ? 'pulse' : 'pause'} size={14} color={isLive ? colors.success : colors.textSecondary} />
              <Text style={[styles.liveText, isLive && styles.liveTextActive]}>{isLive ? 'LIVE' : 'PAUSED'}</Text>
            </TouchableOpacity>
            <Text style={styles.lastUpdate}>
              {isLoadingArea ? 'Fetching data…' : `Updated: ${formatLastUpdate(lastUpdate)}`}
            </Text>
          </View>
        </View>

        {/* Area Stats Banner */}
        {areaStats && (
          <View style={styles.areaStatsBanner}>
            <View style={styles.areaStatItem}>
              <Ionicons name="map-outline" size={16} color={colors.primary} />
              <Text style={styles.areaStatLabel}>OSM Roads</Text>
              <Text style={styles.areaStatValue}>
                {isLoadingArea ? '…' : (areaStats.roadCount ?? 'N/A')}
              </Text>
            </View>
            <View style={styles.areaStatDivider} />
            <View style={styles.areaStatItem}>
              <Ionicons name="rainy-outline" size={16} color={colors.info ?? colors.primary} />
              <Text style={styles.areaStatLabel}>72hr Rain</Text>
              <Text style={styles.areaStatValue}>
                {isLoadingArea ? '…' : (areaStats.rainfall72hr !== null ? `${areaStats.rainfall72hr} mm` : 'N/A')}
              </Text>
            </View>
            <View style={styles.areaStatDivider} />
            <View style={styles.areaStatItem}>
              <Ionicons name="satellite-outline" size={16} color={colors.success} />
              <Text style={styles.areaStatLabel}>Source</Text>
              <Text style={styles.areaStatValue}>OSM + Meteo</Text>
            </View>
          </View>
        )}
        {isLoadingArea && !areaStats && (
          <View style={styles.areaLoadingBanner}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.areaLoadingText}>Loading live area data…</Text>
          </View>
        )}

        <View style={styles.kpiContainer}>
          <View style={styles.kpiRow}>
            <KPICard title="Road Health Score" value={dashboardData.roadHealthScore.toString()} unit="%" icon="road" status="good" trend="up" />
            <KPICard title="Accident Probability" value={dashboardData.accidentProbability.toString()} unit="%" icon="warning" status="warning" trend="down" />
          </View>
          <View style={styles.kpiRow}>
            <KPICard title="72-Hour Rainfall" value={dashboardData.rainfall72hr.toString()} unit="mm" icon="rainy" status="info" />
            <KPICard title="Active Alerts" value={dashboardData.activeAlerts.toString()} unit="" icon="alert-circle" status="danger" />
          </View>
        </View>

        {isAdmin && (
          <View style={styles.kpiContainer}>
            <View style={styles.kpiRow}>
              <KPICard title="Total Incidents" value={dashboardData.totalIncidents.toString()} unit="" icon="document-text" status="info" />
              <KPICard title="Pending Tasks" value={dashboardData.pendingTasks.toString()} unit="" icon="construct" status="warning" />
            </View>
          </View>
        )}

        {canAccess('view_incidents') && <IncidentPanel incidents={incidents} showAdminControls={canManageIncidents} />}
        {canManageTasks && <TaskManager tasks={tasks} />}

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>{isAdmin ? 'Quick Actions' : 'Report Issues'}</Text>
          <View style={styles.actionButtons}>
            {canAccess('report_issue') && (
              <TouchableOpacity style={styles.actionButton} onPress={() => handleQuickAction('report')}>
                <Ionicons name="camera" size={24} color={colors.primary} />
                <Text style={styles.actionText}>Report Issue</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.actionButton} onPress={() => handleQuickAction('map')}>
              <Ionicons name="navigate" size={24} color={colors.primary} />
              <Text style={styles.actionText}>View Map</Text>
            </TouchableOpacity>
            
            {canViewAnalytics && (
              <TouchableOpacity style={styles.actionButton} onPress={() => handleQuickAction('analytics')}>
                <Ionicons name="analytics" size={24} color={colors.primary} />
                <Text style={styles.actionText}>Analytics</Text>
              </TouchableOpacity>
            )}
            
            {canScanRoads && (
              <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
                <Ionicons name="scan" size={24} color={colors.primary} />
                <Text style={styles.actionText}>Scan Roads</Text>
              </TouchableOpacity>
            )}
            
            {!isAdmin && (
              <TouchableOpacity style={styles.actionButton} onPress={() => setShowChatModal(true)}>
                <Ionicons name="chatbubbles" size={24} color={colors.primary} />
                <Text style={styles.actionText}>Citizen Chat</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isAdmin && (
          <View style={styles.systemStatus}>
            <Text style={styles.sectionTitle}>System Status</Text>
            <View style={styles.statusCard}>
              <View style={styles.statusItem}><View style={[styles.statusDot, { backgroundColor: colors.success }]} /><Text style={styles.statusText}>API Services: Online</Text></View>
              <View style={styles.statusItem}><View style={[styles.statusDot, { backgroundColor: colors.success }]} /><Text style={styles.statusText}>OpenStreetMap: Connected</Text></View>
              <View style={styles.statusItem}><View style={[styles.statusDot, { backgroundColor: colors.success }]} /><Text style={styles.statusText}>Data Sync: Active</Text></View>
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Report Issue Modal */}
      <ReportIssueModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleNewIncident}
      />

      {/* Chat Modal */}
      <ChatModal
        visible={showChatModal}
        onClose={() => setShowChatModal(false)}
      />

      {/* Area Picker Modal */}
      <Modal
        visible={showAreaPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAreaPicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Area</Text>
              <TouchableOpacity onPress={() => setShowAreaPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.pickerSubtitle}>
              Live data pulled from OpenStreetMap + Open-Meteo satellite weather
            </Text>
            {availableAreas.map(area => (
              <TouchableOpacity
                key={area.id}
                style={[styles.pickerItem, selectedArea?.id === area.id && styles.pickerItemSelected]}
                onPress={() => { selectArea(area); setShowAreaPicker(false); }}
              >
                <Ionicons
                  name="location"
                  size={20}
                  color={selectedArea?.id === area.id ? colors.primary : colors.textSecondary}
                />
                <View style={styles.pickerItemText}>
                  <Text style={[styles.pickerItemName, selectedArea?.id === area.id && { color: colors.primary }]}>
                    {area.name}
                  </Text>
                  <Text style={styles.pickerItemCoords}>
                    {area.lat.toFixed(3)}, {area.lon.toFixed(3)}
                  </Text>
                </View>
                {selectedArea?.id === area.id && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  greeting: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  logoContainer: { width: 48, height: 48, backgroundColor: colors.primary + '15', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  titleSection: { marginBottom: 20 },
  stmsTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  liveButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.border, gap: 4 },
  liveButtonActive: { backgroundColor: colors.success + '20' },
  liveText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  liveTextActive: { color: colors.success },
  lastUpdate: { fontSize: 11, color: colors.textSecondary },
  kpiContainer: { marginBottom: 10 },
  kpiRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 10, marginBottom: 10 },
  quickActions: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },
  actionButtons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  actionButton: { backgroundColor: colors.cardBackground, borderRadius: 12, padding: 16, alignItems: 'center', width: '23%', minWidth: 70, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  actionText: { fontSize: 11, color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
  systemStatus: { marginTop: 20 },
  statusCard: { backgroundColor: colors.cardBackground, borderRadius: 12, padding: 16 },
  statusItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  statusText: { fontSize: 14, color: colors.textPrimary },
  bottomPadding: { height: 20 },

  // Area selector
  areaSelector: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  areaSelectorText: { fontSize: 13, color: colors.primary, fontWeight: '500' },

  // Area stats banner
  areaStatsBanner: { flexDirection: 'row', backgroundColor: colors.cardBackground, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'space-around' },
  areaStatItem: { alignItems: 'center', flex: 1, gap: 4 },
  areaStatLabel: { fontSize: 11, color: colors.textSecondary },
  areaStatValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  areaStatDivider: { width: 1, height: 36, backgroundColor: colors.border },
  areaLoadingBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBackground, borderRadius: 12, padding: 12, marginBottom: 12, gap: 10 },
  areaLoadingText: { fontSize: 13, color: colors.textSecondary },

  // Area picker modal
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  pickerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  pickerSubtitle: { fontSize: 12, color: colors.textSecondary, marginBottom: 16 },
  pickerItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 8, backgroundColor: colors.cardBackground, gap: 12 },
  pickerItemSelected: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  pickerItemText: { flex: 1 },
  pickerItemName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  pickerItemCoords: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
});

export default DashboardScreen;
