import { useState, useEffect, useCallback } from 'react';
import { ReportService, createReport, toIncident } from '../models/ReportModel';
import { REPORT_CATEGORY, SEVERITY, USER_ROLE, REPORT_STATUS } from '../schema/ReportSchema';

// ─── Predefined Selectable Areas (Jamaica parishes / zones) ───────────────────
export const SELECTABLE_AREAS = [
  {
    id: 'st_catherine',
    name: 'St. Catherine Parish',
    lat: 17.99,
    lon: -77.0,
    bbox: { south: 17.85, west: -77.20, north: 18.10, east: -76.85 },
  },
  {
    id: 'kingston',
    name: 'Kingston & St. Andrew',
    lat: 17.997,
    lon: -76.793,
    bbox: { south: 17.90, west: -76.92, north: 18.06, east: -76.65 },
  },
  {
    id: 'portland',
    name: 'Portland Parish',
    lat: 18.17,
    lon: -76.46,
    bbox: { south: 18.05, west: -76.65, north: 18.30, east: -76.25 },
  },
  {
    id: 'st_thomas',
    name: 'St. Thomas Parish',
    lat: 17.94,
    lon: -76.54,
    bbox: { south: 17.85, west: -76.70, north: 18.05, east: -76.30 },
  },
  {
    id: 'clarendon',
    name: 'Clarendon Parish',
    lat: 17.96,
    lon: -77.24,
    bbox: { south: 17.80, west: -77.50, north: 18.10, east: -77.00 },
  },
];

// ─── Open-Meteo: fetch real weather for a lat/lon ────────────────────────────
export const fetchWeatherData = async (lat, lon) => {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&hourly=precipitation&past_days=3&forecast_days=1` +
      `&timezone=America%2FJamaica`;
    const res = await fetch(url);
    const data = await res.json();

    // Sum last 72 hours of precipitation
    const hourly = data.hourly?.precipitation ?? [];
    const last72 = hourly.slice(Math.max(0, hourly.length - 72));
    const rainfall72hr = parseFloat(last72.reduce((a, b) => a + (b ?? 0), 0).toFixed(1));

    return { rainfall72hr };
  } catch (err) {
    console.warn('Open-Meteo fetch failed:', err.message);
    return { rainfall72hr: null };
  }
};

// ─── OSM Overpass: fetch road & infrastructure data for a bbox ───────────────
export const fetchOSMAreaData = async (bbox) => {
  const { south, west, north, east } = bbox;
  const overpassQuery = `
    [out:json][timeout:25];
    (
      way["highway"](${south},${west},${north},${east});
      way["highway"~"primary|secondary|tertiary|residential|unclassified"](${south},${west},${north},${east});
    );
    out count;
  `;
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(overpassQuery)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const data = await res.json();
    const roadCount = data?.elements?.[0]?.tags?.ways ?? data?.elements?.length ?? 0;
    return { roadCount };
  } catch (err) {
    console.warn('Overpass fetch failed:', err.message);
    return { roadCount: null };
  }
};

// ─── Combined area stats ──────────────────────────────────────────────────────
export const fetchAreaStats = async (area) => {
  const [weather, osm] = await Promise.all([
    fetchWeatherData(area.lat, area.lon),
    fetchOSMAreaData(area.bbox),
  ]);
  return { ...weather, ...osm };
};

// ─── Static fallback / simulation helpers ────────────────────────────────────
const generateRandomVariation = (baseValue, variance = 0.1) => {
  const variation = baseValue * variance;
  const change = (Math.random() - 0.5) * 2 * variation;
  return Math.max(0, Math.round(baseValue + change));
};

const BASE_DASHBOARD = {
  roadHealthScore: 78,
  accidentProbability: 12,
  rainfall72hr: 45,
  activeAlerts: 7,
  totalIncidents: 156,
  pendingTasks: 23,
  completedTasks: 89,
  criticalZones: 3,
};

const generateIncidents = () => [
  { id: 1, title: 'Road erosion near Port Antonio', location: 'Portland', status: 'verified', time: '2 hours ago', type: 'erosion', severity: 'high' },
  { id: 2, title: 'Landslide on Junction Road', location: 'St. Thomas', status: 'review', time: '5 hours ago', type: 'landslide', severity: 'critical' },
  { id: 3, title: 'Blocked drainage in Linstead', location: 'St. Catherine', status: 'new', time: '1 day ago', type: 'drainage', severity: 'medium' },
  { id: 4, title: 'Pothole cluster on Harbour View', location: 'St. Andrew', status: 'verified', time: '1 day ago', type: 'pothole', severity: 'low' },
  { id: 5, title: 'Bridge damage - Rio Grande', location: 'Portland', status: 'new', time: '3 hours ago', type: 'bridge', severity: 'critical' },
];

const generateTasks = () => [
  { id: 1, title: 'Drainage clearing at Bog Walk Gorge', location: 'St. Catherine', urgency: 'urgent', status: 'In Progress', crew: 'Team Alpha', dueDate: 'Today' },
  { id: 2, title: 'Slope stabilization repair', location: 'Portland', urgency: 'scheduled', status: 'Scheduled', crew: 'Team Beta', dueDate: 'Tomorrow' },
  { id: 3, title: 'Pothole patching - Harbour View', location: 'St. Andrew', urgency: 'urgent', status: 'Pending', crew: 'Team Gamma', dueDate: 'Today' },
  { id: 4, title: 'Bridge inspection - Milk River', location: 'St. Thomas', urgency: 'scheduled', status: 'Completed', crew: 'Team Alpha', dueDate: 'Yesterday' },
  { id: 5, title: 'Road marking - Main Highway', location: 'St. Catherine', urgency: 'scheduled', status: 'In Progress', crew: 'Team Delta', dueDate: '2 days' },
];

const generateZones = () => [
  { id: 1, name: 'Zone A - Northern', roads: 12, avgHealth: 85, status: 'good', coords: [{ latitude: 18.025, longitude: -77.05 }, { latitude: 18.025, longitude: -77.04 }, { latitude: 18.015, longitude: -77.04 }, { latitude: 18.015, longitude: -77.05 }], lastUpdate: new Date().toISOString() },
  { id: 2, name: 'Zone B - Central', roads: 18, avgHealth: 62, status: 'fair', coords: [{ latitude: 18.02, longitude: -77.05 }, { latitude: 18.02, longitude: -77.04 }, { latitude: 18.01, longitude: -77.04 }, { latitude: 18.01, longitude: -77.05 }], lastUpdate: new Date().toISOString() },
  { id: 3, name: 'Zone C - Southern', roads: 8, avgHealth: 45, status: 'poor', coords: [{ latitude: 18.015, longitude: -77.05 }, { latitude: 18.015, longitude: -77.035 }, { latitude: 18.005, longitude: -77.035 }, { latitude: 18.005, longitude: -77.05 }], lastUpdate: new Date().toISOString() },
];

const generateRoadConditions = () => [
  { id: 1, title: 'Main Road - North', condition: 'good', coordinates: { latitude: 18.022, longitude: -77.0443 }, lastInspection: new Date().toISOString(), healthScore: 85 },
  { id: 2, title: 'Highway A1', condition: 'fair', coordinates: { latitude: 18.015, longitude: -77.05 }, lastInspection: new Date().toISOString(), healthScore: 62 },
  { id: 3, title: 'Rural Route 200', condition: 'poor', coordinates: { latitude: 18.01, longitude: -77.038 }, lastInspection: new Date().toISOString(), healthScore: 38 },
  { id: 4, title: 'Urban Road 5', condition: 'good', coordinates: { latitude: 18.025, longitude: -77.042 }, lastInspection: new Date().toISOString(), healthScore: 78 },
];

// ─── Main real-time hook ──────────────────────────────────────────────────────
export const useRealTimeDashboardData = (updateInterval = 30000) => {
  const [dashboardData, setDashboardData] = useState(BASE_DASHBOARD);
  const [incidents, setIncidents] = useState(generateIncidents());
  const [tasks, setTasks] = useState(generateTasks());
  const [zones, setZones] = useState(generateZones());
  const [roadConditions, setRoadConditions] = useState(generateRoadConditions());
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLive, setIsLive] = useState(true);

  // Selected area state
  const [selectedArea, setSelectedArea] = useState(SELECTABLE_AREAS[0]);
  const [areaStats, setAreaStats] = useState(null);
  const [isLoadingArea, setIsLoadingArea] = useState(false);

  // Fetch live data for the selected area
  const loadAreaData = useCallback(async (area) => {
    setIsLoadingArea(true);
    try {
      const stats = await fetchAreaStats(area);
      setAreaStats(stats);

      // Update KPIs with real values where available
      setDashboardData(prev => ({
        ...prev,
        rainfall72hr: stats.rainfall72hr !== null ? stats.rainfall72hr : prev.rainfall72hr,
        roadHealthScore: stats.roadCount !== null
          ? Math.min(100, Math.max(30, Math.round(50 + (stats.roadCount / 10))))
          : prev.roadHealthScore,
      }));
      setLastUpdate(new Date());
    } catch (e) {
      console.warn('Area data load error:', e);
    } finally {
      setIsLoadingArea(false);
    }
  }, []);

  // Change the selected area
  const selectArea = useCallback((area) => {
    setSelectedArea(area);
    loadAreaData(area);
  }, [loadAreaData]);

  // Load persisted reports from ReportService and merge into incidents
  const loadPersistedReports = useCallback(async (parish) => {
    try {
      const filters = parish ? { parish } : {};
      const saved = await ReportService.fetchAll(filters);
      const asIncidents = saved.map(toIncident);
      setIncidents(prev => {
        // Merge: keep static incidents that weren't replaced and prepend report-derived ones
        const staticOnes = prev.filter(i => i._source !== 'citizen_report');
        return [...asIncidents, ...staticOnes];
      });
      // Update KPI counters
      const summary = await ReportService.getSummary(filters);
      setDashboardData(prev => ({
        ...prev,
        totalIncidents: Math.max(prev.totalIncidents, summary.total + 156),
        activeAlerts  : Math.max(prev.activeAlerts,
          summary.bySeverity.critical + summary.bySeverity.high),
      }));
    } catch (e) {
      console.warn('loadPersistedReports error:', e);
    }
  }, []);

  // Submit a new citizen report (called from ReportIssueModal via DashboardScreen)
  const submitReport = useCallback(async (rawReportData, user) => {
    const report = createReport({
      submittedBy          : user?.uid    ?? 'anonymous',
      submitterRole        : user?.role   ?? USER_ROLE.CITIZEN,
      submitterDisplayName : user?.name   ?? 'Citizen',
      area: {
        parish      : selectedArea?.name ?? 'Unknown',
        coordinates : rawReportData.coordinates ?? null,
        osmBbox     : selectedArea?.bbox ?? null,
      },
      category    : rawReportData.category    ?? REPORT_CATEGORY.OTHER,
      severity    : rawReportData.severity    ?? SEVERITY.MODERATE,
      title       : rawReportData.description ?? rawReportData.title ?? 'Citizen Report',
      description : rawReportData.description ?? '',
      mediaAttachments: rawReportData.image
        ? [{ url: rawReportData.image, mimeType: 'image/jpeg', fileName: 'photo.jpg', sizeBytes: 0 }]
        : [],
      aiAnalysis  : rawReportData.aiAnalysis ?? null,
    });

    await ReportService.submit(report);
    await loadPersistedReports(selectedArea?.name);
    return report;
  }, [selectedArea, loadPersistedReports]);

  // Initial load
  useEffect(() => {
    loadAreaData(SELECTABLE_AREAS[0]);
    loadPersistedReports();
  }, [loadAreaData, loadPersistedReports]);

  // Periodic light variation (UI feels live) + refresh real data every updateInterval
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setDashboardData(prev => ({
        ...prev,
        accidentProbability: generateRandomVariation(prev.accidentProbability, 0.1),
        activeAlerts: generateRandomVariation(prev.activeAlerts, 0.2),
        totalIncidents: prev.totalIncidents + (Math.random() > 0.75 ? 1 : 0),
        pendingTasks: generateRandomVariation(prev.pendingTasks, 0.1),
        completedTasks: prev.completedTasks + (Math.random() > 0.85 ? 1 : 0),
      }));
      setLastUpdate(new Date());
    }, 10000);

    // Refresh real API data on updateInterval
    const apiInterval = setInterval(() => {
      if (selectedArea) loadAreaData(selectedArea);
    }, updateInterval);

    return () => {
      clearInterval(interval);
      clearInterval(apiInterval);
    };
  }, [isLive, updateInterval, selectedArea, loadAreaData]);

  const toggleLiveUpdates = () => setIsLive(prev => !prev);

  const refreshData = () => {
    setIncidents(generateIncidents());
    setTasks(generateTasks());
    setZones(generateZones());
    setRoadConditions(generateRoadConditions());
    if (selectedArea) loadAreaData(selectedArea);
  };

  const scanRoadConditions = () =>
    new Promise(resolve =>
      setTimeout(() =>
        resolve([
          { id: 1, roadName: 'Main Highway A1', condition: 'Good', score: 85, issues: ['Minor cracks', 'Faded markings'], timestamp: new Date().toISOString() },
          { id: 2, roadName: 'Rural Road 201', condition: 'Fair', score: 62, issues: ['Potholes', 'Shoulder erosion', 'Cracks'], timestamp: new Date().toISOString() },
          { id: 3, roadName: 'Urban Street 5', condition: 'Poor', score: 38, issues: ['Major potholes', 'Road deterioration', 'Drainage issues'], timestamp: new Date().toISOString() },
        ]),
        1500
      )
    );

  return {
    dashboardData,
    incidents,
    tasks,
    zones,
    roadConditions,
    lastUpdate,
    isLive,
    toggleLiveUpdates,
    refreshData,
    scanRoadConditions,
    // Area selection
    selectedArea,
    selectArea,
    areaStats,
    isLoadingArea,
    availableAreas: SELECTABLE_AREAS,
    // Report submission
    submitReport,
    ReportService,
  };
};

// Named exports for backwards compatibility
export const generateDashboardData = () => ({ ...BASE_DASHBOARD, lastUpdate: new Date().toISOString() });
export const getIncidents = generateIncidents;
export const getTasks = generateTasks;
export const getZones = generateZones;
export const getRoadConditions = generateRoadConditions;

export default {
  useRealTimeDashboardData,
  generateDashboardData,
  getIncidents,
  getTasks,
  getZones,
  getRoadConditions,
};
