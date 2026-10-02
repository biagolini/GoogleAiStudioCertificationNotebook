# CertStudy - System Architecture and Component Specification

> AI Reader and Agent Index: This technical reference document is designed for ingestion by autonomous coding and analysis agents (such as Google Antigravity and Gemini LLMs). It details the complete architecture, data models, state flows, frontend views, and managed backend services of the CertStudy platform.

---

## 1. System Vision and Architectural Philosophy

CertStudy is an offline-capable, client-side certification preparation companion and exam simulation engine built with React 19, TypeScript, Tailwind CSS, Google Workspace APIs (Drive and Docs), and Google Gemini AI (gemini-3.8-flash).

### Core Architectural Tenets

1. **Bring Your Own Storage (BYOS)**:
   - Zero centralized application servers or paid multi-tenant databases.
   - All state is persisted locally in client browser storage (`localStorage`).
   - Cloud backup and cross-device sync are executed directly against the user's personal Google Drive account in an application-scoped folder (`/CertStudy`).
2. **Bring Your Own Key (BYOK) for AI Capabilities**:
   - Zero intermediate AI proxy servers or third-party telemetry.
   - Client calls the official Google Gemini API directly using the `@google/genai` TypeScript SDK.
   - User provides their free Google AI Studio API key stored solely in local client storage.
3. **Domain-Driven Exam Fidelity**:
   - Question banks, exams, and flashcards adhere to official cloud provider blueprints (AWS, Azure, GCP, Kubernetes, Terraform, Linux, CompTIA).
   - Simulates real test conditions: configurable durations, ESL/ADA accommodations (+30m), text annotation (highlighter and strikethrough), overtime tracking, per-question budgeting, multi-session pause/resume, and domain mastery scoring.

---

## 2. Technology Stack and Key References

| Dimension | Implementation | Primary Reference Files |
| :--- | :--- | :--- |
| **Runtime and Framework** | React 19 SPA, Vite 6, TypeScript (strict) | `package.json`, `vite.config.ts` |
| **Styling and UI** | Tailwind CSS v4, Lucide React, Motion | `src/index.css` |
| **Global State** | React Context with LocalStorage synchronization | `src/context/AppContext.tsx` |
| **Cloud Storage** | Google Identity Services (GSI) OAuth 2.0 and Google Drive API v3 | `src/services/googleWorkspaceService.ts` |
| **Document Export** | Google Docs API v1 BatchUpdate | `src/services/googleWorkspaceService.ts` |
| **Generative AI** | Google Gemini API (gemini-3.8-flash) via `@google/genai` | `src/services/geminiService.ts` |
| **File Extraction** | Client-side ZIP decompression via `JSZip` | `src/components/QuestionBanks/ImportQuestionsAiModal.tsx` |
| **Internationalization** | Context-driven i18n supporting English (`en`) and Portuguese (`pt-BR`) | `src/i18n/translations.ts`, `src/i18n/LanguageContext.tsx` |

---

## 3. Architecture Documentation Map

All architectural subsystems are documented in discrete technical Markdown files within the `docs/architecture/` folder:

### Backend and Managed Services Subsystem (`docs/architecture/backend`)

- **`docs/architecture/backend`**
  Directory containing architectural documentation for all storage mechanisms, data schemas, managed APIs, and pipelines.
- **`docs/architecture/backend/overview.md`**
  Explains the serverless BYOS architectural model, client-side isolation, data privacy, and the elimination of central backend servers.
- **`docs/architecture/backend/database-schemas.md`**
  Details the local document database schemas, storage partitions (`localStorage`), and entity models: `Certification`, `QuestionBank`, `Question`, `ExamAttempt`, `InProgressExamSession`, `Note`, and `StudentProfile`.
- **`docs/architecture/backend/data-pipeline-questions.md`**
  Documents the question lifecycle: client-side ZIP extraction via JSZip, HTML text sanitization, chunked schema extraction with Gemini AI, and database persistence.
- **`docs/architecture/backend/storage-byos-google-drive.md`**
  Covers the Google Drive API v3 client-side integration, OAuth 2.0 PKCE scopes (`drive.file`), automatic `/CertStudy` folder discovery, and JSON backup/restore serialization.
- **`docs/architecture/backend/google-docs-api.md`**
  Covers the Google Docs API v1 integration, OAuth scopes (`documents`), structural element batch injection, and formatted study note synchronization.
- **`docs/architecture/backend/google-gemini-api.md`**
  Covers the Google Gemini API integration using `@google/genai`, model selection (`gemini-3.8-flash`), prompt construction, and structured JSON output for AI tutoring and question extraction.

---

### Frontend Subsystem (`docs/architecture/frontend`)

- **`docs/architecture/frontend`**
  Directory containing architectural documentation for all user interface modules, layouts, components, and interaction patterns.
- **`docs/architecture/frontend/overview.md`**
  Presents the overall frontend layout, conditional view routing state machine in `src/App.tsx`, global header system, dark/light theme switching, and i18n translation engine.
- **`docs/architecture/frontend/page-home.md`**
  Details the certification catalog browser, ecosystem filter pills (AWS, GCP, Azure, K8s, DevOps), starter data seeding, and active study cards.
- **`docs/architecture/frontend/page-workspace.md`**
  Details the certification workspace hub, header breadcrumbs, domain overview, and tabbed sub-navigation between Study Notes, Question Banks, and Mock Exams.
- **`docs/architecture/frontend/page-question-banks.md`**
  Details question bank management, instructor/vendor grouping, manual question CRUD modal with diagram uploads, and AI-driven ZIP batch import modal.
- **`docs/architecture/frontend/page-mock-exams.md`**
  Details mock exam configuration (`MockExamConfig.tsx`), active exam runner (`ExamRunner.tsx`), docked/slide-over Item Navigator (`ItemNavigator.tsx`), per-question countdown and overtime clock, text annotations (highlight and strikethrough), multi-tier image support, Google Translate toggle, multi-session pause/resume (`InProgressExamsList.tsx`), and premature halfway finalization.
- **`docs/architecture/frontend/page-exam-results.md`**
  Details post-exam score calculations (`ExamResults.tsx`), pass/fail evaluation, time management audit, average time spent per domain, question review cards with distinct styling for correct, incorrect, and unanswered/blank items, and the embedded Gemini question tutor modal.
- **`docs/architecture/frontend/page-study-notes.md`**
  Details the Markdown note editor, text formatting toolbar, Gemini Copilot side drawer with real-time note rewriting, and Google Docs export action.
- **`docs/architecture/frontend/page-profile.md`**
  Details student profile tracking, native language configuration for exam translation, experience levels, career track preferences, and earned certification credentials.
- **`docs/architecture/frontend/modal-settings.md`**
  Details the preferences modal, Google Workspace OAuth connection status, JSON backup/restore actions, Gemini API key manager, and default timer/accommodation preferences.
