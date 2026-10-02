# Frontend Subsystem — Architecture & Layout Overview

> **Target Audience**: AI Agents and Software Engineers analyzing the presentation layer, component graph, navigation flow, and reactive state tree.

---

## 1. Architectural Model

The frontend is architectured as a client-side Single Page Application (SPA) with zero server-side rendering dependencies. Navigation between views is managed via explicit state machines within React Context, eliminating routing synchronization issues on static hosting environments like GitHub Pages.

### Primary Source References
- `src/App.tsx` — Main application orchestrator and conditional view renderer.
- `src/components/Header.tsx` — Global header bar, cloud connection indicator, certification selector, and modal triggers.
- `src/context/AppContext.tsx` — Root state container for entities, timers, and active selection.
- `src/context/GoogleWorkspaceContext.tsx` — Google Identity Services (GSI) OAuth state machine.
- `src/i18n/LanguageContext.tsx` — Bilingual dictionary and translation hook (`useTranslation`).

---

## 2. Component Hierarchy & View Routing

The application renders one primary view at a time based on the active tab and selected certification:

```text
App.tsx
├── Header.tsx (Global navigation, cloud badge, theme switch, settings)
├── LanguageProvider & GoogleWorkspaceProvider & AppProvider
└── Main Container
    ├── [Tab: catalog] ────────► CertificationCatalog.tsx
    ├── [Tab: profile] ────────► StudentProfileView.tsx
    └── [Tab: workspace] ──────► WorkspaceView.tsx (requires activeCert)
        ├── [Sub-Tab: mock-exams] ──────► MockExamConfig.tsx / ExamRunner.tsx / ExamResults.tsx
        ├── [Sub-Tab: question-banks] ──► QuestionBankManager.tsx
        └── [Sub-Tab: notes] ───────────► NotesList.tsx / NoteEditor.tsx
```

---

## 3. Global Header System

The header (`src/components/Header.tsx`) is fixed at the top of the viewport and contains critical indicators:

1. **Brand Identity**: Logo, application title ("CertStudy"), and subtitle.
2. **Active Certification Selector**: Dropdown showing the currently selected certification. Allows immediate switching without losing workspace state.
3. **Cloud Connection Badge**:
   - Displays real-time Google Drive synchronization status (`Connected`, `Connecting...`, `Disconnected`).
   - Clicking opens the connection or triggers instant backup sync.
4. **Quick Navigation Links**: Direct tabs to "Catalog", "Workspace", and "Student Profile".
5. **Theme & Language Toggles**:
   - Instant toggle between Dark Mode and Light Mode (adds/removes `dark` class on root HTML element).
   - Instant locale switcher (`en` <-> `pt-BR`).
6. **Settings Trigger**: Launches `SettingsModal.tsx`.

---

## 4. Internationalization (i18n) Engine

- **Dictionary Store**: `src/i18n/translations.ts`.
- **Supported Locales**: English (`en`) and Portuguese (`pt-BR`).
- **Hook**: `useTranslation()` returns `t(key, params)` and `language`.
- **Interpolation**: Supports variable substitution in translation strings (e.g. `{words}`, `{readTime}`, `{n}`).

---

## 5. Responsive Design & Accessibility Standards

- Mobile-first layout using Tailwind CSS v4 grid and flex utilities.
- Safe viewport heights (`h-full`, `max-h-[90vh]`) for modals and drawers to ensure touch scrollability on iOS and Android devices.
- High-contrast color tokens for accessibility: emerald for pass/success, rose for failure/destructive, amber for Gemini AI features and active selections.
