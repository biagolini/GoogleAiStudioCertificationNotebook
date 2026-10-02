# Frontend — Student Profile & Certification Career Tracks

> **Primary Source File**: `src/components/Profile/StudentProfileView.tsx`

---

## 1. Functional Purpose

The Student Profile view enables learners to record their professional background, target provider ecosystems, career tracks, and certification credentials. It bridges individual test practice with long-term career tracking.

---

## 2. Key Interface Subsystems

### 2.1 Professional Identity Card
- **Full Name / Preferred Name**: Identifies the student.
- **Headline / Role**: e.g., *Senior Cloud Architect & DevOps Engineer*.
- **Experience Level Selector**:
  - Beginner / Career Transition
  - Mid-Level (Pleno)
  - Senior / Specialist
  - Staff / Tech Lead / Principal
- **Bio & Study Goals**: Multiline reflection on current goals and exam target dates.
- **Professional Links**: Optional LinkedIn and GitHub profile URLs.

### 2.2 Target Ecosystem Selector
- Checkable tags for prioritized cloud ecosystems:
  - AWS, Azure, GCP, Kubernetes, Terraform, Linux, MongoDB.
- Influences recommendations and catalog filtering across the app.

### 2.3 Career Track & Credential Ledger
- Lists all industry certifications from the standard catalog.
- Each certification card provides status toggles:
  - **Not Planned**: Ignored in current goals.
  - **In My Track**: Marked as an upcoming goal with optional target date.
  - **Earned**: Marked as successfully completed.
- When marked as **Earned**:
  - Prompts for date of credential achievement.
  - Prompts for official validation URL (e.g. Credly badge link or certification verification ID).
- One-click "Add to Study Workspace" button to instantiate the certification into active local study.

### 2.4 Profile Overview Metrics
- Summary badges at the top of the view:
  - Total Earned Certifications.
  - Total In-Track Target Certifications.
  - Total Active Studies in Workspace.
