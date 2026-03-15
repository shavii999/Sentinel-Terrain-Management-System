/**
 * ReportSchema.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Canonical database schema for NWA Sentinel Terrain Management – Report System
 *
 * Backend target : Firebase Firestore  (structure also maps cleanly to a REST
 *                  JSON API or PostgreSQL with minor adaptations – see notes).
 *
 * Collection hierarchy
 * ────────────────────
 *   reports/                         ← primary collection
 *     {reportId}/
 *       ...report fields (see REPORT_SCHEMA)
 *       history/                     ← sub-collection: audit trail
 *         {historyId}/
 *           ...history fields (see HISTORY_SCHEMA)
 *
 * Firestore Security Rules excerpt (Firestore console / firestore.rules)
 * ────────────────────────────────────────────────────────────────────────
 *   match /reports/{reportId} {
 *     allow read  : if request.auth != null;
 *     allow create: if request.auth != null
 *                   && request.resource.data.keys().hasAll(REQUIRED_FIELDS);
 *     allow update: if request.auth.uid == resource.data.submittedBy
 *                   || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role
 *                      in ['admin','field_officer'];
 *     allow delete: if get(...).data.role == 'admin';
 *
 *     match /history/{historyId} {
 *       allow read  : if request.auth != null;
 *       allow create: if request.auth != null;
 *       allow update, delete: if false;   // audit records are immutable
 *     }
 *   }
 *
 * Firestore Composite Indexes  (firestore.indexes.json)
 * ──────────────────────────────────────────────────────
 *   1. collectionGroup: "reports"
 *      fields: [ area.parish ASC, status ASC, timestamp DESC ]
 *      → used by: fetchReportsByArea()
 *
 *   2. collectionGroup: "reports"
 *      fields: [ status ASC, timestamp DESC ]
 *      → used by: fetchReportsByStatus()
 *
 *   3. collectionGroup: "reports"
 *      fields: [ submittedBy ASC, timestamp DESC ]
 *      → used by: fetchReportsByUser()
 *
 *   4. collectionGroup: "reports"
 *      fields: [ category ASC, severity ASC, status ASC, timestamp DESC ]
 *      → used by: admin incident board filter
 *
 * REST API note
 * ─────────────
 *   If using a REST backend replace Firestore sub-collections with a flat
 *   `report_history` table with a foreign key `reportId`.
 *   Suggested endpoints:
 *     POST   /api/reports
 *     GET    /api/reports?parish=&status=&from=&to=&role=
 *     GET    /api/reports/:id
 *     PATCH  /api/reports/:id
 *     DELETE /api/reports/:id
 *     GET    /api/reports/:id/history
 *     POST   /api/reports/:id/history
 * ──────────────────────────────────────────────────────────────────────────────
 */

// ─── Enumerated constants ─────────────────────────────────────────────────────

export const REPORT_STATUS = {
  SUBMITTED : 'submitted',
  IN_REVIEW : 'in_review',
  ASSIGNED  : 'assigned',
  RESOLVED  : 'resolved',
  CLOSED    : 'closed',
  REJECTED  : 'rejected',
};

export const REPORT_CATEGORY = {
  POTHOLE        : 'pothole',
  FLOODING       : 'flooding',
  SIGNAGE        : 'signage',
  DEBRIS         : 'debris',
  CRACK          : 'crack',
  EROSION        : 'erosion',
  LANDSLIDE      : 'landslide',
  DRAINAGE       : 'drainage',
  BRIDGE         : 'bridge',
  ROAD_CONDITION : 'road_condition',
  WATER          : 'water',
  OTHER          : 'other',
};

export const SEVERITY = {
  LOW      : 'low',
  MODERATE : 'moderate',
  HIGH     : 'high',
  CRITICAL : 'critical',
};

export const USER_ROLE = {
  CITIZEN       : 'citizen',
  FIELD_OFFICER : 'field_officer',
  ADMIN         : 'admin',
};

export const SUBMISSION_METHOD = {
  ONLINE  : 'online',
  OFFLINE : 'offline',   // queued locally, synced later
};

// ─── Primary report document schema ──────────────────────────────────────────

/**
 * REPORT_SCHEMA - describes every field stored in a `reports/{reportId}` document.
 *
 * Field notation:
 *   type     – JS / Firestore type
 *   required – must be present on creation
 *   default  – value when not supplied
 *   notes    – additional constraints / indexing comments
 */
export const REPORT_SCHEMA = {

  // ── Identity ────────────────────────────────────────────────────────────────
  id: {
    type: 'string',
    required: true,
    notes: 'Auto-generated UUID v4; used as the Firestore document key.',
  },
  submittedBy: {
    type: 'string',
    required: true,
    notes: 'Firebase Auth UID of the user who created the report.',
  },
  submitterRole: {
    type: 'string',         // USER_ROLE enum
    required: true,
    notes: 'Role of the submitter at time of submission.',
  },
  submitterDisplayName: {
    type: 'string',
    required: false,
    default: 'Anonymous',
  },

  // ── Timestamps ──────────────────────────────────────────────────────────────
  timestamp: {
    type: 'Timestamp',      // Firestore Timestamp / ISO-8601 string for REST
    required: true,
    notes: 'Creation time; used for sorting and date-range queries. Indexed.',
  },
  updatedAt: {
    type: 'Timestamp',
    required: false,
    notes: 'Set on every document update.',
  },

  // ── Location ────────────────────────────────────────────────────────────────
  area: {
    type: 'map',
    required: true,
    schema: {
      parish     : { type: 'string', required: true,  notes: 'e.g. "St. Catherine"' },
      community  : { type: 'string', required: false, default: '' },
      address    : { type: 'string', required: false, default: '' },
      coordinates: {
        type: 'map',
        required: false,
        schema: {
          latitude : { type: 'number' },
          longitude: { type: 'number' },
        },
      },
      osmBbox: {
        type: 'map',
        required: false,
        notes: 'Bounding box used for OSM / area-stats queries.',
        schema: {
          south: { type: 'number' },
          west : { type: 'number' },
          north: { type: 'number' },
          east : { type: 'number' },
        },
      },
    },
  },

  // ── Classification ──────────────────────────────────────────────────────────
  category: {
    type: 'string',         // REPORT_CATEGORY enum
    required: true,
    notes: 'Primary report type. Indexed (composite with status, severity).',
  },
  severity: {
    type: 'string',         // SEVERITY enum
    required: true,
    default: SEVERITY.MODERATE,
    notes: 'AI-suggested or user-selected severity level.',
  },
  status: {
    type: 'string',         // REPORT_STATUS enum
    required: true,
    default: REPORT_STATUS.SUBMITTED,
    notes: 'Lifecycle state. Indexed (composite with parish, timestamp).',
  },

  // ── Content ─────────────────────────────────────────────────────────────────
  title: {
    type: 'string',
    required: true,
    maxLength: 120,
  },
  description: {
    type: 'string',
    required: true,
    maxLength: 2000,
  },
  mediaAttachments: {
    type: 'array<map>',
    required: false,
    default: [],
    itemSchema: {
      url      : { type: 'string',  notes: 'Cloud Storage download URL' },
      mimeType : { type: 'string',  notes: 'e.g. "image/jpeg"' },
      fileName : { type: 'string' },
      sizeBytes: { type: 'number' },
      uploadedAt: { type: 'Timestamp' },
    },
  },

  // ── AI analysis (from GeminiService) ───────────────────────────────────────
  aiAnalysis: {
    type: 'map',
    required: false,
    schema: {
      severity       : { type: 'string' },
      type           : { type: 'string' },
      recommendation  : { type: 'string' },
      estimatedCost  : { type: 'string' },
      confidence     : { type: 'number' },
    },
  },

  // ── Linked records ──────────────────────────────────────────────────────────
  linkedIncidentId: {
    type: 'string|null',
    required: false,
    default: null,
    notes: 'Reference to an incident document if this report spawned one.',
  },
  linkedTaskId: {
    type: 'string|null',
    required: false,
    default: null,
    notes: 'Reference to a maintenance task assigned to remediate this report.',
  },

  // ── Metadata ────────────────────────────────────────────────────────────────
  metadata: {
    type: 'map',
    required: false,
    schema: {
      deviceInfo: {
        type: 'map',
        schema: {
          platform   : { type: 'string', notes: '"ios" | "android" | "web"' },
          osVersion  : { type: 'string' },
          deviceModel: { type: 'string' },
        },
      },
      appVersion      : { type: 'string', notes: 'Semver string, e.g. "1.2.3"' },
      submissionMethod: { type: 'string', notes: SUBMISSION_METHOD.ONLINE + ' | ' + SUBMISSION_METHOD.OFFLINE },
      networkType     : { type: 'string', notes: '"wifi" | "cellular" | "none"' },
    },
  },
};

// ─── History (audit trail) sub-document schema ────────────────────────────────

/**
 * HISTORY_SCHEMA - stored in `reports/{reportId}/history/{historyId}`
 * Records every status change. Documents are immutable once written.
 */
export const HISTORY_SCHEMA = {
  id: {
    type: 'string',
    required: true,
    notes: 'UUID v4; Firestore document key.',
  },
  reportId: {
    type: 'string',
    required: true,
    notes: 'Parent report reference.',
  },
  changedBy: {
    type: 'string',
    required: true,
    notes: 'UID of the user who made the change.',
  },
  changedByRole: {
    type: 'string',
    required: true,
  },
  changedAt: {
    type: 'Timestamp',
    required: true,
  },
  previousStatus: {
    type: 'string',
    required: true,
  },
  newStatus: {
    type: 'string',
    required: true,
  },
  note: {
    type: 'string',
    required: false,
    default: '',
    notes: 'Optional comment explaining the change.',
  },
};

// ─── Required fields list (used by Firestore security rules & JS validation) ──

export const REQUIRED_REPORT_FIELDS = [
  'id', 'submittedBy', 'submitterRole', 'timestamp',
  'area', 'category', 'severity', 'status', 'title', 'description',
];

export const REQUIRED_HISTORY_FIELDS = [
  'id', 'reportId', 'changedBy', 'changedByRole', 'changedAt',
  'previousStatus', 'newStatus',
];

export default {
  REPORT_SCHEMA,
  HISTORY_SCHEMA,
  REPORT_STATUS,
  REPORT_CATEGORY,
  SEVERITY,
  USER_ROLE,
  SUBMISSION_METHOD,
  REQUIRED_REPORT_FIELDS,
  REQUIRED_HISTORY_FIELDS,
};
