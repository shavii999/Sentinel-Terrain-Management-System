/**
 * ReportModel.js
 * ──────────────────────────────────────────────────────────────────────────────
 * JavaScript data model for user-submitted reports in NWA Sentinel TMS.
 *
 * Responsibilities
 *   • Factory method to build a validated Report object from raw input
 *   • HistoryEntry factory for audit-trail records
 *   • In-app in-memory store (AsyncStorage-backed) used when Firebase is
 *     not yet wired up, making it a seamless drop-in
 *   • CRUD API surface:
 *       ReportService.submit(report)
 *       ReportService.fetchAll(filters)
 *       ReportService.fetchById(id)
 *       ReportService.updateStatus(id, newStatus, changedBy, note)
 *       ReportService.delete(id, requestingUser)
 *       ReportService.fetchHistory(reportId)
 *   • Integration point: `toIncident()` converts a Report into the
 *     incident shape consumed by useRealTimeDashboardData / IncidentPanel
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { Platform } from 'react-native';
import {
  REPORT_STATUS,
  REPORT_CATEGORY,
  SEVERITY,
  USER_ROLE,
  SUBMISSION_METHOD,
  REQUIRED_REPORT_FIELDS,
  REQUIRED_HISTORY_FIELDS,
} from '../schema/ReportSchema';

// ─── UUID helper (no external dep) ───────────────────────────────────────────
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ─── Cross-platform storage (localStorage on web, in-memory on native) ───────
const _memStore = {};
const Storage = {
  async getItem(key) {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return _memStore[key] ?? null;
  },
  async setItem(key, value) {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    } else {
      _memStore[key] = value;
    }
  },
};

const STORAGE_KEY_REPORTS = '@stms_reports';
const STORAGE_KEY_HISTORY = '@stms_report_history';

// ─── Report factory ───────────────────────────────────────────────────────────

/**
 * Creates a validated, fully-populated Report document.
 *
 * @param {object} input
 * @param {string} input.submittedBy        – Auth user UID
 * @param {string} input.submitterRole      – USER_ROLE value
 * @param {string} [input.submitterDisplayName]
 * @param {object} input.area               – { parish, community?, address?, coordinates?, osmBbox? }
 * @param {string} input.category           – REPORT_CATEGORY value
 * @param {string} [input.severity]         – SEVERITY value (default: moderate)
 * @param {string} input.title
 * @param {string} input.description
 * @param {Array}  [input.mediaAttachments] – [{ url, mimeType, fileName, sizeBytes }]
 * @param {object} [input.aiAnalysis]       – GeminiService analysis result
 * @param {string} [input.linkedIncidentId]
 * @param {string} [input.linkedTaskId]
 * @param {object} [input.metadata]         – device / app info
 * @returns {Report}
 * @throws {Error} if required fields are missing or invalid
 */
export function createReport(input) {
  const {
    submittedBy,
    submitterRole,
    submitterDisplayName = 'Anonymous',
    area,
    category,
    severity = SEVERITY.MODERATE,
    title,
    description,
    mediaAttachments = [],
    aiAnalysis = null,
    linkedIncidentId = null,
    linkedTaskId = null,
    metadata = {},
  } = input;

  // ── Validation ──────────────────────────────────────────────────────────────
  const errors = [];

  if (!submittedBy)             errors.push('submittedBy is required');
  if (!submitterRole)           errors.push('submitterRole is required');
  if (!Object.values(USER_ROLE).includes(submitterRole))
                                errors.push(`submitterRole must be one of: ${Object.values(USER_ROLE).join(', ')}`);
  if (!area || !area.parish)    errors.push('area.parish is required');
  if (!category)                errors.push('category is required');
  if (!Object.values(REPORT_CATEGORY).includes(category))
                                errors.push(`category must be one of: ${Object.values(REPORT_CATEGORY).join(', ')}`);
  if (!Object.values(SEVERITY).includes(severity))
                                errors.push(`severity must be one of: ${Object.values(SEVERITY).join(', ')}`);
  if (!title || title.trim().length === 0)
                                errors.push('title is required');
  if (title && title.length > 120)
                                errors.push('title must be ≤ 120 characters');
  if (!description || description.trim().length === 0)
                                errors.push('description is required');
  if (description && description.length > 2000)
                                errors.push('description must be ≤ 2000 characters');

  if (errors.length > 0) {
    throw new Error(`Report validation failed:\n  • ${errors.join('\n  • ')}`);
  }

  const now = new Date().toISOString();

  return {
    // Identity
    id                   : uuidv4(),
    submittedBy,
    submitterRole,
    submitterDisplayName : submitterDisplayName.trim(),

    // Timestamps
    timestamp : now,
    updatedAt : now,

    // Location
    area: {
      parish      : area.parish.trim(),
      community   : (area.community ?? '').trim(),
      address     : (area.address ?? '').trim(),
      coordinates : area.coordinates ?? null,
      osmBbox     : area.osmBbox ?? null,
    },

    // Classification
    category,
    severity,
    status    : REPORT_STATUS.SUBMITTED,

    // Content
    title              : title.trim(),
    description        : description.trim(),
    mediaAttachments   : mediaAttachments.map(normalizeAttachment),

    // AI
    aiAnalysis,

    // Links
    linkedIncidentId,
    linkedTaskId,

    // Metadata
    metadata: {
      deviceInfo: {
        platform   : Platform.OS,
        osVersion  : Platform.Version?.toString() ?? 'unknown',
        deviceModel: 'unknown',
        ...((metadata.deviceInfo) ?? {}),
      },
      appVersion      : metadata.appVersion       ?? '1.0.0',
      submissionMethod: metadata.submissionMethod ?? SUBMISSION_METHOD.ONLINE,
      networkType     : metadata.networkType      ?? 'unknown',
    },
  };
}

function normalizeAttachment(att) {
  return {
    url        : att.url        ?? att.uri ?? '',
    mimeType   : att.mimeType   ?? 'image/jpeg',
    fileName   : att.fileName   ?? 'attachment',
    sizeBytes  : att.sizeBytes  ?? 0,
    uploadedAt : att.uploadedAt ?? new Date().toISOString(),
  };
}

// ─── History entry factory ────────────────────────────────────────────────────

/**
 * Creates an immutable audit-trail entry.
 *
 * @param {string} reportId
 * @param {string} previousStatus
 * @param {string} newStatus
 * @param {object} changedByUser  – { uid, role }
 * @param {string} [note]
 * @returns {HistoryEntry}
 */
export function createHistoryEntry(reportId, previousStatus, newStatus, changedByUser, note = '') {
  if (!reportId)        throw new Error('historyEntry: reportId is required');
  if (!previousStatus)  throw new Error('historyEntry: previousStatus is required');
  if (!newStatus)       throw new Error('historyEntry: newStatus is required');
  if (!changedByUser?.uid) throw new Error('historyEntry: changedByUser.uid is required');

  return {
    id            : uuidv4(),
    reportId,
    changedBy     : changedByUser.uid,
    changedByRole : changedByUser.role ?? USER_ROLE.CITIZEN,
    changedAt     : new Date().toISOString(),
    previousStatus,
    newStatus,
    note          : note.trim(),
  };
}

// ─── toIncident – bridge to IncidentPanel shape ───────────────────────────────

/**
 * Converts a Report document into the incident object shape
 * expected by IncidentPanel and useRealTimeDashboardData.
 *
 * Usage:
 *   const liveIncidents = reports.map(toIncident);
 *   setIncidents(prev => [...liveIncidents, ...prev]);
 *
 * @param {Report} report
 * @returns {Incident}
 */
export function toIncident(report) {
  return {
    id       : report.id,
    title    : report.title,
    location : report.area.community
                 ? `${report.area.community}, ${report.area.parish}`
                 : report.area.parish,
    status   : _mapStatusToIncidentStatus(report.status),
    time     : _relativeTime(report.timestamp),
    type     : report.category,
    severity : report.severity,
    // Extra fields only present on report-derived incidents
    _source  : 'citizen_report',
    _reportId: report.id,
  };
}

function _mapStatusToIncidentStatus(status) {
  const map = {
    [REPORT_STATUS.SUBMITTED] : 'new',
    [REPORT_STATUS.IN_REVIEW] : 'review',
    [REPORT_STATUS.ASSIGNED]  : 'review',
    [REPORT_STATUS.RESOLVED]  : 'resolved',
    [REPORT_STATUS.CLOSED]    : 'resolved',
    [REPORT_STATUS.REJECTED]  : 'closed',
  };
  return map[status] ?? 'new';
}

function _relativeTime(iso) {
  const diffMs  = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24)  return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
}

// ─── ReportService – in-app CRUD using AsyncStorage ──────────────────────────
//
//  When you connect Firebase, replace each method body with the equivalent
//  Firestore call.  The public API surface stays identical so all callers
//  (DataService, DashboardScreen, ReportIssueModal) require zero changes.
//
//  Firestore equivalents (commented):
//    submit  → addDoc(collection(db,'reports'), report)
//    fetchAll→ getDocs(query(collection(db,'reports'), where(...), orderBy(...)))
//    etc.

const _readAll = async () => {
  try {
    const raw = await Storage.getItem(STORAGE_KEY_REPORTS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const _writeAll = async (reports) => {
  await Storage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(reports));
};

const _readHistory = async () => {
  try {
    const raw = await Storage.getItem(STORAGE_KEY_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const _writeHistory = async (history) => {
  await Storage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
};

export const ReportService = {

  /**
   * Persist a newly created report.
   * @param {Report} report  – output of createReport()
   * @returns {Promise<Report>}
   */
  async submit(report) {
    // Firestore: await addDoc(collection(db, 'reports'), report);
    const all = await _readAll();
    all.unshift(report);          // newest first
    await _writeAll(all);
    return report;
  },

  /**
   * Retrieve reports with optional filters.
   *
   * @param {object} [filters]
   * @param {string} [filters.parish]     – area.parish equals
   * @param {string} [filters.status]     – REPORT_STATUS value
   * @param {string} [filters.category]   – REPORT_CATEGORY value
   * @param {string} [filters.severity]   – SEVERITY value
   * @param {string} [filters.submittedBy]– UID
   * @param {string} [filters.fromDate]   – ISO string  (inclusive)
   * @param {string} [filters.toDate]     – ISO string  (inclusive)
   * @param {number} [filters.limit]      – max results (default 100)
   * @returns {Promise<Report[]>}
   *
   * Firestore equivalent:
   *   let q = collection(db, 'reports');
   *   if (filters.parish)    q = query(q, where('area.parish','==',filters.parish));
   *   if (filters.status)    q = query(q, where('status','==',filters.status));
   *   if (filters.fromDate)  q = query(q, where('timestamp','>=',filters.fromDate));
   *   q = query(q, orderBy('timestamp','desc'), limit(filters.limit ?? 100));
   *   const snap = await getDocs(q);
   *   return snap.docs.map(d => d.data());
   */
  async fetchAll(filters = {}) {
    let all = await _readAll();

    if (filters.parish)      all = all.filter(r => r.area.parish === filters.parish);
    if (filters.status)      all = all.filter(r => r.status === filters.status);
    if (filters.category)    all = all.filter(r => r.category === filters.category);
    if (filters.severity)    all = all.filter(r => r.severity === filters.severity);
    if (filters.submittedBy) all = all.filter(r => r.submittedBy === filters.submittedBy);
    if (filters.fromDate)    all = all.filter(r => r.timestamp >= filters.fromDate);
    if (filters.toDate)      all = all.filter(r => r.timestamp <= filters.toDate);

    return all.slice(0, filters.limit ?? 100);
  },

  /**
   * Retrieve a single report by ID.
   * Firestore: getDoc(doc(db,'reports',id))
   */
  async fetchById(id) {
    const all = await _readAll();
    return all.find(r => r.id === id) ?? null;
  },

  /**
   * Change the lifecycle status of a report and record the change in history.
   *
   * @param {string} id
   * @param {string} newStatus      – REPORT_STATUS value
   * @param {object} changedByUser  – { uid, role }
   * @param {string} [note]
   * @returns {Promise<Report>}
   *
   * Firestore:
   *   const ref = doc(db,'reports',id);
   *   await runTransaction(db, async tx => {
   *     const snap = await tx.get(ref);
   *     const prev = snap.data().status;
   *     tx.update(ref, { status: newStatus, updatedAt: serverTimestamp() });
   *     const histRef = doc(collection(ref,'history'));
   *     tx.set(histRef, createHistoryEntry(id,prev,newStatus,changedByUser,note));
   *   });
   */
  async updateStatus(id, newStatus, changedByUser, note = '') {
    const all = await _readAll();
    const idx = all.findIndex(r => r.id === id);
    if (idx === -1) throw new Error(`Report ${id} not found`);

    const previous = all[idx].status;
    if (previous === newStatus) return all[idx];   // no-op

    all[idx] = { ...all[idx], status: newStatus, updatedAt: new Date().toISOString() };
    await _writeAll(all);

    // Append history entry
    const history = await _readHistory();
    history.push(createHistoryEntry(id, previous, newStatus, changedByUser, note));
    await _writeHistory(history);

    return all[idx];
  },

  /**
   * Hard-delete a report (admin only; enforce at call-site).
   * Firestore: deleteDoc(doc(db,'reports',id))
   */
  async delete(id) {
    const all = await _readAll();
    const filtered = all.filter(r => r.id !== id);
    if (filtered.length === all.length) throw new Error(`Report ${id} not found`);
    await _writeAll(filtered);
    return true;
  },

  /**
   * Retrieve the full audit trail for a report, newest first.
   * Firestore: getDocs(query(collection(doc(db,'reports',id),'history'), orderBy('changedAt','desc')))
   */
  async fetchHistory(reportId) {
    const history = await _readHistory();
    return history
      .filter(h => h.reportId === reportId)
      .sort((a, b) => b.changedAt.localeCompare(a.changedAt));
  },

  /**
   * Count reports grouped by status for a given area/date range.
   * Used by the dashboard KPI cards.
   */
  async getSummary(filters = {}) {
    const reports = await this.fetchAll(filters);
    const summary = {
      total    : reports.length,
      submitted: 0,
      in_review: 0,
      resolved : 0,
      closed   : 0,
      bySeverity: { low: 0, moderate: 0, high: 0, critical: 0 },
    };
    reports.forEach(r => {
      if (summary[r.status] !== undefined) summary[r.status]++;
      if (summary.bySeverity[r.severity] !== undefined) summary.bySeverity[r.severity]++;
    });
    return summary;
  },
};

export default ReportService;
