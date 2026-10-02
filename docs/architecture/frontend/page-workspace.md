# Frontend — Certification Workspace View

> **Target Source File**: `src/components/Workspace/WorkspaceView.tsx`

---

## 1. Functional Purpose

The Certification Workspace is the central operational cockpit for preparing for a specific credential. When a user selects a certification, this view scopes all question banks, mock exams, timer rules, flashcards, and Markdown notes to that single credential.

---

## 2. Key Interface Subsystems

### 2.1 Certification Header & Blueprint Metrics
- Displays active certification brand identity, code, level, and provider color scheme.
- Exam parameters display:
  - Official duration (e.g. 130 min) + Accommodation duration (+30 min ESL).
  - Target passing score threshold (typically 70% or 720/1000).
- Domain blueprint distribution badges: visual tags showing how questions are balanced across official exam domains (e.g. *Design Secure Architectures (30%)*, *Design Resilient Architectures (26%)*).

### 2.2 Navigation Sub-Tabs
The view renders a state-managed tab bar allowing seamless switching between study modes:
1. **Mock Exams (`mock-exams`)**:
   - Launches practice exams, timed simulations, and past attempt reviews.
2. **Question Banks (`question-banks`)**:
   - Manages question collections, instructor/vendor groupings, and AI ZIP document ingestion.
3. **Study Notes (`notes`)**:
   - Markdown documentation center with live split-screen Gemini AI Copilot and Google Docs synchronization.

### 2.3 Quick Analytics Strip
- Aggregate metrics calculated dynamically from `AppContext`:
  - Total available questions for this certification.
  - Overall accuracy rate (% correct across all attempts).
  - Total study notes created.
  - Last studied date/time with automatic activity recording.
