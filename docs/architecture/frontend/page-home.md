# Frontend — Certification Catalog & Home View

> **Target Source File**: `src/components/Home/CertificationCatalog.tsx`

---

## 1. Functional Purpose

The Catalog / Home view serves as the entry point for certification selection, discovery, and workspace initialization. It displays both user-created certifications currently in the student's active studies and the comprehensive catalog of pre-configured certifications spanning major cloud, DevOps, and infrastructure providers.

---

## 2. Key User Interface Components

### 2.1 Ecosystem Filter Bar
- Allows horizontal filtering across provider ecosystems:
  - **AWS** (Amazon Web Services)
  - **Azure** (Microsoft Azure)
  - **GCP** (Google Cloud Platform)
  - **Kubernetes** (Linux Foundation / CNCF)
  - **Terraform** (HashiCorp)
  - **Linux** (LPIC / CompTIA Linux+)
  - **MongoDB** (MongoDB University)
- Includes an "All Providers" filter pill.

### 2.2 Active Studies Section
- Renders cards for certifications already present in the user's local database (`certifications` state in `AppContext`).
- Displays:
  - Certification name, official code (e.g., `SAA-C03`, `CKA`, `AZ-104`).
  - Total question count, total study notes, and exam attempts logged.
  - Exam duration and ESL accommodation indicator.
  - "Study Workspace" action button that sets `activeCertId` and routes to `WorkspaceView.tsx`.

### 2.3 Pre-Configured Catalog Grid
- Renders pre-built certifications from `CATALOG_CERTIFICATIONS` defined in `src/data/defaultCatalog.ts`.
- Shows domain breakdowns, official links, exam duration, and difficulty level (Foundational, Associate, Professional, Specialty).
- Button to "Add to Workspace" which clones the catalog blueprint into user-managed storage.

### 2.4 Starter Kit Initialization
- When local storage is empty, displays a prominent callout to load sample certifications, question banks, and study notes in 1 click via `loadSampleStarterKit()` in `AppContext.tsx`.

### 2.5 Custom Certification Modal
- Accessible via "+ Create Custom Certification" button.
- Form fields:
  - Name, certification code, description.
  - Exam duration in minutes (e.g. 130 min).
  - Extra time accommodation in minutes (e.g. 30 min).
  - Dynamic domain tag editor (domain name and percentage weight).
  - Color theme and icon selection.
