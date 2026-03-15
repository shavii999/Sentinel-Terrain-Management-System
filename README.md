# Sentinel Terrain Management System (STMS)

A cross-platform React Native / Expo application for monitoring, reporting, and managing road infrastructure and terrain conditions across Jamaica.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [User Roles](#user-roles)
- [Recent Updates](#recent-updates)
- [Database Schema](#database-schema)
- [API Integrations](#api-integrations)

---

## Overview

STMS provides field managers and citizens with real-time terrain and road condition data, AI-assisted incident reporting, and a structured workflow for managing infrastructure issues across Jamaican parishes.

---

## Features

### Citizen Features
- **Report Issues** — Submit road/terrain incidents with photos, category, severity, description, and location
- **Photo Upload** — Select images directly from local storage (web file picker) or device camera/gallery (mobile)
- **AI Analysis** — Submitted photos are automatically analysed by Gemini AI for severity, type, recommendation, and estimated repair cost
- **View Map** — Interactive map showing road conditions and incidents in the selected area
- **Citizen Chat** — AI-powered chat assistant for reporting guidance and status queries

### Admin / Field Manager Features
- **Live Dashboard** — Real-time KPI cards: Road Health Score, Accident Probability, 72-hr Rainfall, Active Alerts, Total Incidents, Pending Tasks
- **Area Selection** — Select any Jamaica parish to load live data for that specific area
- **Incident Management** — View, review, and manage all reported incidents
- **Task Manager** — Assign and track maintenance tasks by crew and urgency
- **Analytics Reports** — Zone health overview, road health trend charts, incident distribution, and detailed report cards (admin only)
- **System Status** — Live connection status for API services and OpenStreetMap

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo (~54) |
| Web | React Native Web + Expo Web |
| Maps | React Leaflet (web) / react-native-maps (mobile) |
| AI | Google Gemini API (via GeminiService) |
| Weather Data | Open-Meteo API (free, no key required) |
| Road Data | OpenStreetMap Overpass API |
| Image Picker | expo-image-picker |
| Storage | localStorage (web) / in-memory (mobile) — Firebase-ready |
| Icons | @expo/vector-icons (Ionicons) |

---

## Project Structure

```
src/
├── components/
│   ├── ChatModal.js          # AI citizen chat
│   ├── IncidentPanel.js      # Incident list display
│   ├── KPICard.js            # Dashboard metric cards
│   ├── ReportIssueModal.js   # Citizen report submission with image upload
│   └── TaskManager.js        # Admin task list
├── context/
│   └── AuthContext.js        # Auth state, roles, permissions
├── models/
│   └── ReportModel.js        # Report data model, validation, CRUD (ReportService)
├── schema/
│   └── ReportSchema.js       # Firestore/REST schema definition, enums, indexes
├── screens/
│   ├── DashboardScreen.js    # Main dashboard (role-aware)
│   ├── LoginScreen.js        # Authentication
│   ├── MapScreen.js          # Interactive map
│   ├── ReportsScreen.js      # Analytics (admin) / placeholder (citizen)
│   └── SettingsScreen.js     # App settings
├── services/
│   ├── DataService.js        # Real-time data hook, OSM + weather API calls
│   └── GeminiService.js      # Google Gemini AI integration
└── theme/
    └── colors.js             # Design system colours
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)

### Install & Run

```bash
# Install dependencies
npm install

# Start Expo development server
npx expo start

# Run on web
npx expo start --web

# Run on Android
npx expo run:android

# Run on iOS
npx expo run:ios
```

### Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@sentinel.gov.jm | admin123 |
| Citizen | citizen@example.com | citizen123 |

---

## User Roles

| Permission | Admin | Citizen |
|---|---|---|
| View Dashboard | ✅ | ✅ |
| View Map | ✅ | ✅ |
| Report Issue | ✅ | ✅ |
| View Incidents | ✅ | ✅ |
| Manage Incidents | ✅ | ❌ |
| Manage Tasks | ✅ | ❌ |
| View Analytics | ✅ | ❌ |
| Scan Roads | ✅ | ❌ |
| System Settings | ✅ | ❌ |

---

## Recent Updates

### v1.2.0 — March 2026

#### 🖼️ Image Upload in Citizen Reports
- Citizens can now attach photos when submitting a report
- **Web**: native OS file browser opens on tap (no extra permissions needed)
- **Mobile**: choose between camera or photo library
- Selected image is displayed as a live preview inside the report form
- Image URI is stored with the report and passed to Gemini AI for analysis

#### 🗺️ Live Area Data (OpenStreetMap + Open-Meteo)
- Dashboard now shows a **selectable area picker** (5 Jamaica parishes pre-configured)
- Selecting an area fetches:
  - **72-hour rainfall** from the Open-Meteo weather API (real measured data)
  - **Road count** from the OpenStreetMap Overpass API
- KPI cards for Rainfall and Road Health Score update automatically with real values
- An **Area Stats Banner** shows OSM road count, rainfall, and data source
- Data refreshes every 60 seconds while the dashboard is live

#### 🗄️ Report Database Schema
- New `src/schema/ReportSchema.js` — complete Firestore/REST schema with:
  - Full field definitions for the `reports` collection
  - `history` sub-collection for immutable audit trail
  - Composite index definitions for area/status/date queries
  - Firestore Security Rules excerpt
  - REST API endpoint mapping
- New `src/models/ReportModel.js` — JavaScript data model with:
  - `createReport()` factory with full field validation
  - `createHistoryEntry()` for audit records
  - `toIncident()` bridge to convert reports into the dashboard incident shape
  - `ReportService` CRUD class (localStorage on web, in-memory on mobile; Firebase-ready)
  - `getSummary()` for KPI aggregation

#### 📊 Role-Based Analytics Screen
- **Admin** users see the full analytics screen: zone health, road health trend, incident distribution, and report cards
- **Citizen** users see a simple "Reports Screen" placeholder (analytics are admin-only)

#### 🔗 Report → Incident Integration
- Submitted citizen reports are persisted via `ReportService`
- Reports automatically appear in the Incident Panel on the dashboard
- `totalIncidents` and `activeAlerts` KPI counters update to reflect submitted reports



## Database Schema

### `reports` Collection (Firestore)

| Field | Type | Required | Description |
|---|---|---|---|
| id | string | ✅ | UUID v4 document key |
| submittedBy | string | ✅ | Firebase Auth UID |
| submitterRole | string | ✅ | citizen / field_officer / admin |
| timestamp | Timestamp | ✅ | Creation time (indexed) |
| area.parish | string | ✅ | e.g. "St. Catherine" |
| area.coordinates | map | — | GPS lat/lon |
| category | string | ✅ | pothole / flooding / erosion / etc. |
| severity | string | ✅ | low / moderate / high / critical |
| status | string | ✅ | submitted → in_review → resolved → closed |
| title | string | ✅ | Max 120 chars |
| description | string | ✅ | Max 2000 chars |
| mediaAttachments | array | — | [{url, mimeType, fileName, sizeBytes}] |
| aiAnalysis | map | — | {severity, type, recommendation, estimatedCost} |
| linkedIncidentId | string | — | Reference to incident document |
| linkedTaskId | string | — | Reference to task document |
| metadata | map | — | {deviceInfo, appVersion, submissionMethod} |

### `reports/{id}/history` Sub-collection

| Field | Type | Description |
|---|---|---|
| id | string | UUID v4 |
| changedBy | string | UID of user who made the change |
| changedAt | Timestamp | When the change occurred |
| previousStatus | string | Status before change |
| newStatus | string | Status after change |
| note | string | Optional comment |

---

## API Integrations

### Open-Meteo (Weather)
- **Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Data**: Hourly precipitation for the past 3 days
- **Usage**: Sums last 72 hours of rainfall for the selected parish coordinates
- **Cost**: Free, no API key required

### OpenStreetMap Overpass API
- **Endpoint**: `https://overpass-api.de/api/interpreter`
- **Data**: Count of road ways within a parish bounding box
- **Usage**: Feeds the Road Health Score KPI and area stats banner
- **Cost**: Free, no API key required

### Google Gemini AI
- **Usage**: Analyses submitted incident photos for severity, type, repair recommendation, and estimated cost
- **Requires**: `GEMINI_API_KEY` environment variable

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: description"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

Private — Sentinel Terrain Management System © 2026
