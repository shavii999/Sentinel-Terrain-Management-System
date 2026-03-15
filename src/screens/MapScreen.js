import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, ROLES } from '../context/AuthContext';
import { useRealTimeDashboardData } from '../services/DataService';
import { analyzeSatelliteImagery } from '../services/GeminiService';
import colors from '../theme/colors';

// Platform detection
const isWeb = Platform.OS === 'web';
const isNative = Platform.OS === 'android' || Platform.OS === 'ios';

// Use react-leaflet on web, WebView on native
let MapContainer, TileLayer, Marker, CircleMarker, Polygon, useMap;
let WebView;

if (isWeb) {
  try {
    const { MapContainer: _MapContainer, TileLayer: _TileLayer, Marker: _Marker, CircleMarker: _CircleMarker, Polygon: _Polygon, useMap: _useMap } = require('react-leaflet');
    MapContainer = _MapContainer;
    TileLayer = _TileLayer;
    Marker = _Marker;
    CircleMarker = _CircleMarker;
    Polygon = _Polygon;
    useMap = _useMap;
  } catch (e) {
    console.log('react-leaflet not available:', e.message);
  }
} else {
  try {
    const { WebView: _WebView } = require('react-native-webview');
    WebView = _WebView;
  } catch (e) {
    console.log('WebView not available:', e.message);
  }
}

// Jamaica center
const JAMAICA_CENTER = [18.0179, -77.0443];
const INITIAL_ZOOM = 12;

// Road data
const roadConditions = [
  { id: 1, title: 'Main Road - North', condition: 'good', coordinates: [18.0220, -77.0443], healthScore: 85 },
  { id: 2, title: 'Highway A1', condition: 'fair', coordinates: [18.0150, -77.0500], healthScore: 62 },
  { id: 3, title: 'Rural Route 200', condition: 'poor', coordinates: [18.0100, -77.0380], healthScore: 38 },
  { id: 4, title: 'Urban Road 5', condition: 'good', coordinates: [18.0250, -77.0420], healthScore: 78 },
];

// Zone data
const zones = [
  { id: 1, name: 'Zone A - Northern', coords: [[18.0250, -77.0500], [18.0250, -77.0400], [18.0150, -77.0400], [18.0150, -77.0500]], status: 'good', avgHealth: 85, roads: 12 },
  { id: 2, name: 'Zone B - Central', coords: [[18.0200, -77.0500], [18.0200, -77.0400], [18.0100, -77.0400], [18.0100, -77.0500]], status: 'fair', avgHealth: 62, roads: 18 },
  { id: 3, name: 'Zone C - Southern', coords: [[18.0150, -77.0500], [18.0150, -77.0350], [18.0050, -77.0350], [18.0050, -77.0500]], status: 'poor', avgHealth: 45, roads: 8 },
];

// Map Component for Web using react-leaflet
const WebMap = () => {
  const map = useMap();
  
  return null;
};

const getConditionColor = (condition) => {
  switch (condition?.toLowerCase()) {
    case 'good': return '#4caf50';
    case 'fair': return '#ff9800';
    case 'poor': return '#f44336';
    default: return '#999';
  }
};

const MapScreen = () => {
  const { user, canAccess, ROLES: UserRoles } = useAuth();
  const [mapType, setMapType] = useState('standard');
  const [showScanner, setShowScanner] = useState(false);
  const [scanResults, setScanResults] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedRoad, setSelectedRoad] = useState(null);
  const [satelliteAnalysis, setSatelliteAnalysis] = useState(null);
  const [isAnalyzingSatellite, setIsAnalyzingSatellite] = useState(false);

  const isAdmin = user?.role === UserRoles.ADMIN;
  const canScanRoads = canAccess('scan_roads');
  const mapAvailable = isWeb && MapContainer;

  // Generate HTML for native WebView
  const getWebViewHtml = () => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([${JAMAICA_CENTER[0]}, ${JAMAICA_CENTER[1]}], ${INITIAL_ZOOM});
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19
    }).addTo(map);
    
    var roads = [
      { lat: 18.0220, lng: -77.0443, title: 'Main Road - North', condition: 'good', score: 85 },
      { lat: 18.0150, lng: -77.0500, title: 'Highway A1', condition: 'fair', score: 62 },
      { lat: 18.0100, lng: -77.0380, title: 'Rural Route 200', condition: 'poor', score: 38 },
      { lat: 18.0250, lng: -77.0420, title: 'Urban Road 5', condition: 'good', score: 78 }
    ];
    
    var colors = { good: '#4caf50', fair: '#ff9800', poor: '#f44336' };
    
    roads.forEach(function(road) {
      var marker = L.circleMarker([road.lat, road.lng], {
        radius: 12,
        fillColor: colors[road.condition],
        color: 'white',
        weight: 2,
        fillOpacity: 0.8
      }).addTo(map);
      marker.bindPopup('<b>' + road.title + '</b><br>Condition: ' + road.condition + '<br>Health: ' + road.score + '%');
    });
    
    var zones = [
      { coords: [[18.0250, -77.0500], [18.0250, -77.0400], [18.0150, -77.0400], [18.0150, -77.0500]], status: 'good', health: 85, name: 'Zone A' },
      { coords: [[18.0200, -77.0500], [18.0200, -77.0400], [18.0100, -77.0400], [18.0100, -77.0500]], status: 'fair', health: 62, name: 'Zone B' },
      { coords: [[18.0150, -77.0500], [18.0150, -77.0350], [18.0050, -77.0350], [18.0050, -77.0500]], status: 'poor', health: 45, name: 'Zone C' }
    ];
    
    zones.forEach(function(zone) {
      var polygon = L.polygon(zone.coords, {
        color: colors[zone.status],
        fillColor: colors[zone.status],
        fillOpacity: 0.3
      }).addTo(map);
      polygon.bindPopup('<b>' + zone.name + '</b><br>Status: ' + zone.status + '<br>Health: ' + zone.health + '%');
    });
  </script>
</body>
</html>
`;

  const handleScanRoadCondition = async () => {
    if (!canScanRoads) {
      Alert.alert('Access Restricted', 'Road scanning is only available for admin users.');
      return;
    }
    
    setShowScanner(true);
    setTimeout(() => {
      setScanResults([
        { id: 1, roadName: 'Main Highway A1', condition: 'Good', score: 85, issues: ['Minor cracks', 'Faded markings'] },
        { id: 2, roadName: 'Rural Road 201', condition: 'Fair', score: 62, issues: ['Potholes', 'Shoulder erosion'] },
        { id: 3, roadName: 'Urban Street 5', condition: 'Poor', score: 38, issues: ['Major potholes', 'Road deterioration'] },
      ]);
    }, 1500);
  };

  const handleSatelliteAnalysis = async (zone) => {
    setIsAnalyzingSatellite(true);
    try {
      const result = await analyzeSatelliteImagery(zone);
      if (result.success) {
        setSatelliteAnalysis(result.analysis);
        setSelectedZone({ name: `${zone.charAt(0).toUpperCase() + zone.slice(1)} Zone`, id: zone });
        setShowAnalysis(true);
      }
    } catch (error) {
      console.error('Satellite analysis error:', error);
      Alert.alert('Error', 'Failed to analyze satellite imagery');
    } finally {
      setIsAnalyzingSatellite(false);
    }
  };

  const handleZonePress = (zone) => {
    setSelectedZone(zone);
    setShowAnalysis(true);
  };

  const getScoreColor = (score) => {
    if (score >= 70) return colors.success;
    if (score >= 40) return colors.warning;
    return colors.danger;
  };

  const getConditionColorStyle = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'good': return colors.success;
      case 'fair': return colors.warning;
      case 'poor': return colors.danger;
      default: return colors.textSecondary;
    }
  };

  // Render web version using react-leaflet
  const renderWebMap = () => (
    <View style={styles.mapContainer}>
      <MapContainer 
        center={JAMAICA_CENTER} 
        zoom={INITIAL_ZOOM} 
        style={{ flex: 1, height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Road markers */}
        {roadConditions.map((road) => (
          <CircleMarker
            key={road.id}
            center={road.coordinates}
            radius={12}
            pathOptions={{ 
              fillColor: getConditionColor(road.condition),
              color: 'white',
              weight: 2,
              fillOpacity: 0.8
            }}
            eventHandlers={{
              click: () => setSelectedRoad(road),
            }}
          />
        ))}
        
        {/* Zone polygons */}
        {zones.map((zone) => (
          <Polygon
            key={zone.id}
            positions={zone.coords}
            pathOptions={{ 
              color: getConditionColor(zone.status),
              fillColor: getConditionColor(zone.status),
              fillOpacity: 0.3
            }}
            eventHandlers={{
              click: () => handleZonePress(zone),
            }}
          />
        ))}
      </MapContainer>
    </View>
  );

  // Render native version using WebView
  const renderNativeMap = () => (
    <View style={styles.mapContainer}>
      {WebView ? (
        <WebView
          style={{ flex: 1 }}
          source={{ html: getWebViewHtml() }}
          javaScriptEnabled={true}
          scalesPageToFit={true}
        />
      ) : (
        <View style={styles.fallbackContainer}>
          <Ionicons name="map" size={60} color={colors.primary} />
          <Text style={styles.fallbackText}>Map requires WebView</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Geospatial Analysis</Text>
        <View style={styles.headerRight}>
          {canScanRoads && (
            <>
              <TouchableOpacity 
                onPress={() => handleSatelliteAnalysis('central')} 
                style={styles.scanButtonHeader}
                disabled={isAnalyzingSatellite}
              >
                <Ionicons name="satellite" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleScanRoadCondition} style={styles.scanButtonHeader}>
                <Ionicons name="scan" size={20} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <View style={styles.banner}>
        <Ionicons name="information-circle" size={16} color={colors.info} />
        <Text style={styles.bannerText}>
          📍 OpenStreetMap - Jamaica, St. Catherine Parish
        </Text>
      </View>

      {/* Map */}
      {mapAvailable ? renderWebMap() : renderNativeMap()}

      {/* Quick Info Cards */}
      <View style={styles.infoCards}>
        <TouchableOpacity style={styles.infoCard} onPress={() => handleZonePress(zones[0])}>
          <View style={[styles.infoCardIcon, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="location" size={20} color={colors.success} />
          </View>
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardValue}>{zones.length}</Text>
            <Text style={styles.infoCardLabel}>Zones</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.infoCard} onPress={() => setSelectedRoad(roadConditions[0])}>
          <View style={[styles.infoCardIcon, { backgroundColor: colors.warning + '20' }]}>
            <Ionicons name="car" size={20} color={colors.warning} />
          </View>
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardValue}>{roadConditions.length}</Text>
            <Text style={styles.infoCardLabel}>Roads</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.infoCard} onPress={handleScanRoadCondition}>
          <View style={[styles.infoCardIcon, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="scan" size={20} color={colors.primary} />
          </View>
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardValue}>🔍</Text>
            <Text style={styles.infoCardLabel}>Scan</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={styles.legendText}>Good</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.legendText}>Fair</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
            <Text style={styles.legendText}>Poor</Text>
          </View>
        </View>
      </View>

      {/* Scanner Modal */}
      <Modal visible={showScanner} animationType="slide" transparent onRequestClose={() => setShowScanner(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.scannerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔍 Road Condition Scan</Text>
              <TouchableOpacity onPress={() => setShowScanner(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.resultsList}>
              {scanResults.length === 0 ? (
                <View style={styles.scanningContainer}>
                  <Text style={styles.scanningText}>Scanning...</Text>
                </View>
              ) : (
                scanResults.map((result) => (
                  <View key={result.id} style={styles.resultCard}>
                    <View style={styles.resultHeader}>
                      <Text style={styles.roadNameResult}>{result.roadName}</Text>
                      <View style={[styles.conditionBadge, { backgroundColor: getConditionColorStyle(result.condition) }]}>
                        <Text style={styles.conditionText}>{result.condition}</Text>
                      </View>
                    </View>
                    <Text style={[styles.scoreValue, { color: getScoreColor(result.score) }]}>Health: {result.score}%</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Zone Modal */}
      <Modal visible={showAnalysis} animationType="slide" transparent onRequestClose={() => setShowAnalysis(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.scannerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {satelliteAnalysis ? '🛰️ Satellite Analysis' : selectedZone?.name || 'Zone'}
              </Text>
              <TouchableOpacity onPress={() => { setShowAnalysis(false); setSatelliteAnalysis(null); }}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {isAnalyzingSatellite ? (
              <View style={styles.analysisLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.analysisLoadingText}>Analyzing satellite imagery...</Text>
              </View>
            ) : satelliteAnalysis ? (
              <ScrollView style={styles.satelliteAnalysisContent}>
                <View style={styles.satelliteSummary}>
                  <Text style={styles.satelliteCondition}>
                    Overall: {satelliteAnalysis.overallCondition}
                  </Text>
                  <Text style={styles.satelliteCoverage}>
                    {satelliteAnalysis.coverage}
                  </Text>
                </View>
                
                <Text style={styles.issuesTitle}>Detected Issues:</Text>
                {satelliteAnalysis.issues?.map((issue, index) => (
                  <View key={index} style={styles.issueItem}>
                    <Text style={styles.issueType}>{issue.type}</Text>
                    <Text style={styles.issueLocations}>
                      Location: {issue.locations.join(', ')}
                    </Text>
                    <View style={[
                      styles.severityBadge,
                      { backgroundColor: issue.severity === 'High' ? colors.danger : issue.severity === 'Moderate' ? colors.warning : colors.success }
                    ]}>
                      <Text style={styles.severityText}>{issue.severity}</Text>
                    </View>
                  </View>
                ))}
                
                <View style={styles.recommendationBox}>
                  <Text style={styles.recommendationTitle}>AI Recommendation:</Text>
                  <Text style={styles.recommendationText}>{satelliteAnalysis.recommendation}</Text>
                </View>
                
                <View style={styles.satelliteMeta}>
                  <Text style={styles.metaText}>Source: {satelliteAnalysis.satelliteProvider}</Text>
                  <Text style={styles.metaText}>Cloud Cover: {satelliteAnalysis.cloudCover}%</Text>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.zoneDetail}>
                <Text style={styles.zoneDetailText}>Status: {selectedZone?.status}</Text>
                <Text style={styles.zoneDetailText}>Health: {selectedZone?.avgHealth}%</Text>
                <Text style={styles.zoneDetailText}>Roads: {selectedZone?.roads}</Text>
                
                {/* Add satellite analysis button */}
                <TouchableOpacity 
                  style={styles.analyzeButton}
                  onPress={() => handleSatelliteAnalysis(selectedZone?.id || 'central')}
                >
                  <Ionicons name="satellite" size={20} color="#fff" />
                  <Text style={styles.analyzeButtonText}>Analyze with AI</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Road Modal */}
      <Modal visible={!!selectedRoad} animationType="slide" transparent onRequestClose={() => setSelectedRoad(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.scannerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🛣️ Road Details</Text>
              <TouchableOpacity onPress={() => setSelectedRoad(null)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            {selectedRoad && (
              <View style={styles.roadDetail}>
                <Text style={styles.roadDetailName}>{selectedRoad.title}</Text>
                <View style={styles.roadDetailRow}>
                  <Text>Condition:</Text>
                  <View style={[styles.conditionBadge, { backgroundColor: getConditionColorStyle(selectedRoad.condition) }]}>
                    <Text style={styles.conditionText}>{selectedRoad.condition.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={[styles.roadDetailScore, { color: getScoreColor(selectedRoad.healthScore) }]}>
                  Health: {selectedRoad.healthScore}%
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  headerRight: { flexDirection: 'row', gap: 8 },
  scanButtonHeader: { padding: 8, backgroundColor: colors.primary, borderRadius: 8 },
  banner: { backgroundColor: colors.info + '15', paddingHorizontal: 16, paddingVertical: 8 },
  bannerText: { fontSize: 12, color: colors.info, fontWeight: '600' },
  mapContainer: { flex: 1, margin: 8, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: colors.primary },
  fallbackContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fallbackText: { marginTop: 10, color: colors.textSecondary },
  infoCards: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  infoCard: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBackground, borderRadius: 12, padding: 12, gap: 10 },
  infoCardIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  infoCardContent: { flex: 1 },
  infoCardValue: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  infoCardLabel: { fontSize: 11, color: colors.textSecondary },
  legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 16, backgroundColor: colors.cardBackground, marginHorizontal: 16, borderRadius: 8, marginBottom: 8 },
  legendTitle: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  legendItems: { flexDirection: 'row', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 11, color: colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  scannerModal: { backgroundColor: colors.cardBackground, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  
  // Satellite Analysis Styles
  analysisLoading: { flexDirection: 'column', alignItems: 'center', padding: 40, gap: 16 },
  analysisLoadingText: { fontSize: 16, color: colors.textSecondary },
  satelliteAnalysisContent: { padding: 16 },
  satelliteSummary: { backgroundColor: colors.primary + '15', padding: 16, borderRadius: 12, marginBottom: 16 },
  satelliteCondition: { fontSize: 20, fontWeight: 'bold', color: colors.primary, marginBottom: 4 },
  satelliteCoverage: { fontSize: 14, color: colors.textSecondary },
  issuesTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },
  issueItem: { backgroundColor: colors.cardBackground, padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  issueType: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  issueLocations: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  severityBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 8 },
  severityText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  recommendationBox: { backgroundColor: colors.warning + '15', padding: 16, borderRadius: 12, marginTop: 16 },
  recommendationTitle: { fontSize: 14, fontWeight: '600', color: colors.warning, marginBottom: 8 },
  recommendationText: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  satelliteMeta: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  metaText: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
  analyzeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, padding: 14, borderRadius: 12, marginTop: 20, gap: 8 },
  analyzeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  resultsList: { padding: 16 },
  scanningContainer: { alignItems: 'center', padding: 40 },
  scanningText: { fontSize: 16, color: colors.textPrimary, marginTop: 10 },
  resultCard: { backgroundColor: colors.background, borderRadius: 12, padding: 16, marginBottom: 12 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  roadNameResult: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  conditionBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  conditionText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  scoreValue: { fontSize: 18, fontWeight: 'bold' },
  zoneDetail: { padding: 20 },
  zoneDetailText: { fontSize: 16, color: colors.textPrimary, marginBottom: 8 },
  roadDetail: { padding: 20 },
  roadDetailName: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 16 },
  roadDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  roadDetailScore: { fontSize: 24, fontWeight: 'bold', marginTop: 8 },
});

export default MapScreen;
