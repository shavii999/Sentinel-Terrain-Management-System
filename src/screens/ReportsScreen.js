import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import colors from '../theme/colors';

const { width } = Dimensions.get('window');

// ─── Static data ─────────────────────────────────────────────────────────────

const ROAD_HEALTH_DATA = [
  { month: 'Jan', value: 72 },
  { month: 'Feb', value: 75 },
  { month: 'Mar', value: 73 },
  { month: 'Apr', value: 78 },
  { month: 'May', value: 76 },
  { month: 'Jun', value: 82 },
];

const INCIDENT_DATA = [
  { name: 'Potholes', value: 35, color: colors.danger },
  { name: 'Cracks',   value: 25, color: colors.warning },
  { name: 'Flooding', value: 20, color: '#1E88E5' },
  { name: 'Signs',    value: 20, color: colors.success },
];

const ZONE_ANALYSIS = [
  { id: 1, name: 'Zone A – Northern', roads: 12, avgHealth: 85, status: 'good',  lastScan: '2026-03-10' },
  { id: 2, name: 'Zone B – Central',  roads: 18, avgHealth: 62, status: 'fair',  lastScan: '2026-03-12' },
  { id: 3, name: 'Zone C – Southern', roads:  8, avgHealth: 45, status: 'poor',  lastScan: '2026-03-14' },
];

const REPORTS_DATA = [
  {
    id: 1,
    title: 'Monthly Road Health Assessment',
    date: '2026-03-15',
    type: 'health',
    summary: 'Overall road network health improved by 5% compared to last month.',
    details: [
      'Northern Zone: 85% health – Excellent condition',
      'Central Zone: 62% health – Requires maintenance',
      'Southern Zone: 45% health – Critical attention needed',
    ],
  },
  {
    id: 2,
    title: 'Satellite Imagery Analysis',
    date: '2026-03-14',
    type: 'satellite',
    summary: 'Identified 3 new areas of road deterioration via satellite.',
    details: [
      'Zone B: Detected road surface changes on Highway A1',
      'Zone C: Flooding impact assessment completed',
      'Zone A: New construction detected near urban area',
    ],
  },
  {
    id: 3,
    title: 'Incident Pattern Analysis',
    date: '2026-03-13',
    type: 'incidents',
    summary: 'Potholes remain the most common incident type (35%).',
    details: [
      'Peak incident time: 6 AM – 8 AM',
      'Most affected roads: Main Highway A1',
      'Trend: Decreasing compared to last month',
    ],
  },
];

// ─── Custom chart components (no external SVG dependency) ────────────────────

const LineBarChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.value)) + 10;
  const chartH = 160;
  return (
    <View style={cc.wrapper}>
      <View style={cc.yAxis}>
        {[100, 75, 50, 25, 0].map(v => (
          <Text key={v} style={cc.yLabel}>{v}</Text>
        ))}
      </View>
      <View style={cc.barsArea}>
        {data.map((d, i) => {
          const barH = (d.value / max) * chartH;
          return (
            <View key={i} style={cc.barCol}>
              <Text style={cc.barValue}>{d.value}</Text>
              <View style={[cc.bar, { height: barH }]} />
              <Text style={cc.barLabel}>{d.month}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const DonutLegend = ({ data }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <View>
      <View style={cc.stackedBar}>
        {data.map((d, i) => (
          <View key={i} style={[cc.stackSegment, { flex: d.value, backgroundColor: d.color }]} />
        ))}
      </View>
      <View style={cc.legend}>
        {data.map((d, i) => (
          <View key={i} style={cc.legendItem}>
            <View style={[cc.legendDot, { backgroundColor: d.color }]} />
            <Text style={cc.legendLabel}>{d.name}</Text>
            <Text style={cc.legendValue}>{Math.round((d.value / total) * 100)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const cc = StyleSheet.create({
  wrapper    : { flexDirection: 'row', alignItems: 'flex-end', height: 200 },
  yAxis      : { width: 28, height: 160, justifyContent: 'space-between', alignItems: 'flex-end', marginRight: 4 },
  yLabel     : { fontSize: 10, color: colors.textSecondary },
  barsArea   : { flex: 1, flexDirection: 'row', alignItems: 'flex-end', height: 160, gap: 6 },
  barCol     : { flex: 1, alignItems: 'center' },
  bar        : { width: '70%', backgroundColor: colors.primary, borderRadius: 4, minHeight: 4 },
  barValue   : { fontSize: 10, color: colors.primary, marginBottom: 2 },
  barLabel   : { fontSize: 10, color: colors.textSecondary, marginTop: 4 },
  stackedBar : { flexDirection: 'row', height: 24, borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  stackSegment: { height: '100%' },
  legend     : { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  legendItem : { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot  : { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12, color: colors.textPrimary },
  legendValue: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

const ReportsScreen = () => {
  const { user, canAccess } = useAuth();
  const isAdmin = canAccess('view_analytics');

  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Citizens see a simple placeholder
  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.placeholderText}>Reports Screen</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return colors.success;
      case 'fair': return colors.warning;
      case 'poor': return colors.danger;
      default:     return colors.textSecondary;
    }
  };

  const getReportIcon = (type) => {
    switch (type) {
      case 'health':    return 'heart';
      case 'satellite': return 'radio';
      case 'incidents': return 'warning';
      default:          return 'document-text';
    }
  };

  const filteredReports = REPORTS_DATA.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analysis Reports</Text>
        <Text style={styles.subtitle}>Insights from satellite and sensor data</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reports..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Zone Health Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zone Health Overview</Text>
          <View style={styles.zoneCards}>
            {ZONE_ANALYSIS.map(zone => (
              <View key={zone.id} style={styles.zoneCard}>
                <View style={[styles.zoneHeader, { backgroundColor: getStatusColor(zone.status) }]}>
                  <Text style={styles.zoneName}>{zone.name}</Text>
                </View>
                <View style={styles.zoneStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{zone.roads}</Text>
                    <Text style={styles.statLabel}>Roads</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: getStatusColor(zone.status) }]}>
                      {zone.avgHealth}%
                    </Text>
                    <Text style={styles.statLabel}>Health</Text>
                  </View>
                </View>
                <Text style={styles.lastScan}>Last scan: {zone.lastScan}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Road Health Trend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Road Health Trend (6 Months)</Text>
          <View style={styles.chartContainer}>
            <LineBarChart data={ROAD_HEALTH_DATA} />
          </View>
        </View>

        {/* Incident Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incident Distribution</Text>
          <View style={styles.chartContainer}>
            <DonutLegend data={INCIDENT_DATA} />
          </View>
        </View>

        {/* Reports List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Reports</Text>
          {filteredReports.map(report => (
            <TouchableOpacity
              key={report.id}
              style={styles.reportCard}
              onPress={() => { setSelectedReport(report); setShowDetail(true); }}
            >
              <View style={styles.reportIconContainer}>
                <Ionicons name={getReportIcon(report.type)} size={24} color={colors.primary} />
              </View>
              <View style={styles.reportContent}>
                <Text style={styles.reportTitle}>{report.title}</Text>
                <Text style={styles.reportDate}>{report.date}</Text>
                <Text style={styles.reportSummary} numberOfLines={2}>{report.summary}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Report Detail Modal */}
      <Modal visible={showDetail} animationType="slide" transparent onRequestClose={() => setShowDetail(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons name={getReportIcon(selectedReport?.type)} size={24} color={colors.primary} />
                <Text style={styles.modalTitle}>{selectedReport?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowDetail(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Report Date</Text>
                <Text style={styles.detailValue}>{selectedReport?.date}</Text>
              </View>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Summary</Text>
                <Text style={styles.detailText}>{selectedReport?.summary}</Text>
              </View>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Detailed Analysis</Text>
                {selectedReport?.details.map((detail, index) => (
                  <View key={index} style={styles.detailItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.detailBullet}>{detail}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Actions Recommended</Text>
                {[
                  'Schedule maintenance for affected zones',
                  'Schedule follow-up satellite analysis',
                  'Generate field inspection tickets',
                ].map((action, i) => (
                  <View key={i} style={styles.actionItem}>
                    <Ionicons name="arrow-forward-circle" size={16} color={colors.primary} />
                    <Text style={styles.actionText}>{action}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity style={styles.exportButton}>
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={styles.exportButtonText}>Export Report</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container         : { flex: 1, backgroundColor: colors.background },
  center            : { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText   : { fontSize: 24, fontWeight: '600', color: colors.textPrimary },
  header            : { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title             : { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  subtitle          : { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  scrollView        : { flex: 1, paddingHorizontal: 16 },
  searchContainer   : { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBackground, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginVertical: 12, gap: 8 },
  searchInput       : { flex: 1, fontSize: 16, color: colors.textPrimary },
  section           : { marginBottom: 24 },
  sectionTitle      : { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },
  zoneCards         : { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  zoneCard          : { flex: 1, backgroundColor: colors.cardBackground, borderRadius: 12, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  zoneHeader        : { padding: 8, alignItems: 'center' },
  zoneName          : { color: '#fff', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  zoneStats         : { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12 },
  statItem          : { alignItems: 'center' },
  statValue         : { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  statLabel         : { fontSize: 11, color: colors.textSecondary },
  lastScan          : { fontSize: 10, color: colors.textSecondary, textAlign: 'center', paddingBottom: 8 },
  chartContainer    : { backgroundColor: colors.cardBackground, borderRadius: 16, padding: 16 },
  reportCard        : { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBackground, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  reportIconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  reportContent     : { flex: 1 },
  reportTitle       : { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  reportDate        : { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  reportSummary     : { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  bottomPadding     : { height: 20 },
  modalOverlay      : { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  detailModal       : { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader       : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitleContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  modalTitle        : { fontSize: 17, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  modalContent      : { maxHeight: 400 },
  detailSection     : { marginBottom: 16 },
  detailLabel       : { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
  detailValue       : { fontSize: 15, color: colors.textPrimary },
  detailText        : { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  detailItem        : { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  detailBullet      : { flex: 1, fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  actionItem        : { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  actionText        : { flex: 1, fontSize: 14, color: colors.textPrimary },
  exportButton      : { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 12, padding: 14, gap: 8, marginTop: 8, marginBottom: 8 },
  exportButtonText  : { fontSize: 15, fontWeight: '600', color: '#fff' },
});

export default ReportsScreen;
