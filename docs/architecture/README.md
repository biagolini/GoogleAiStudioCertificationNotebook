# CertStudy — System Architecture & Component Specification

> **AI Reader & Agent Index**: This technical reference document is optimized for ingestion by autonomous coding and analysis agents (such as Google Antigravity `agy` and Gemini LLMs). It details the complete architecture, data models, state flows, frontend views, and managed backend services of the **CertStudy** platform.

---

## 1. System Vision & Architectural Philosophy

**CertStudy** is an offline-capable, client-side certification preparation companion and exam simulation engine built with React 19, TypeScript, Tailwind CSS, Google Workspace APIs (Drive & Docs), and Google Gemini AI (`gemini-3.8-flash`).

### Core Architectural Tenets
1. **Bring Your Own Storage (BYOS)**:
   - Zero centralized application servers or paid multi-tenant databases.
   - All state is persisted locally in client browser storage (`localStorage`).
   - Cloud backup and cross-device sync are executed directly against the user's personal Google Drive account in an application-scoped folder (`/CertStudy`).
2. **Bring Your Own Key (BYOK) for AI Capabilities**:
   - Zero intermediate AI proxy servers or third-party telemetry.
   - Client calls the official Google Gemini API directly using the modern `@google/genai` TypeScript SDK.
   - User provides their free Google AI Studio API key stored solely in local client storage.
3. **Domain-Driven Exam Fidelity**:
   - Question banks, exams, and flashcards adhere to official cloud provider blueprints (AWS, Azure, GCP, Kubernetes, Terraform, Linux, MongoDB).
   - Simulates real test conditions: configurable durations, ADA/ESL accommodations (+30m), text annotation (highlighter and strikethrough), overtime tracking, and domain mastery scoring.

---

## 2. Technology Stack & Key References

| Dimension | Implementation | Primary Reference Files |
| :--- | :--- | :--- |
| **Runtime & Framework** | React 19 SPA, Vite 6, TypeScript (strict) | `package.json`, `vite.config.ts` |
| **Styling & UI** | Tailwind CSS v4, Lucide React, Motion | `src/index.css` |
| **Global State** | React Context + Custom Reducer Hook with LocalStorage sync | `src/context/AppContext.tsx` |
| **Cloud Storage** | Google Identity Services (GSI) OAuth 2.0 + Google Drive API v3 | `src/services/googleWorkspaceService.ts` |
| **Document Export** | Google Docs API v1 BatchUpdate | `src/services/googleWorkspaceService.ts` |
| **Generative AI** | Google Gemini API (`gemini-3.8-flash`) via `@google/genai` | `src/services/geminiService.ts` |
| **File Extraction** | Client-side ZIP decompression via `JSZip` | `src/components/QuestionBanks/ImportQuestionsAiModal.tsx` |
| **Internationalization** | Context-driven i18n supporting `en` and `pt-BR` | `src/i18n/translations.ts`, `src/i18n/LanguageContext.tsx` |

---

## 3. Architecture Documentation Map

The system documentation is organized into two dedicated subdirectories:

### Frontend Subsystem (`docs/architecture/frontend/`)
- [`overview.md`](frontend/overview.md) — View routing, shell layout, i18n, dark/light theme, and state lifecycle.
- [`page-home.md`](frontend/page-home.md) — Catalog browser, ecosystem filter, starter kit initialization, active study cards.
- [`page-workspace.md`](frontend/page-workspace.md) — Certification workspace hub, domain mastery summary, contextual navigation.
- [`page-question-banks.md`](frontend/page-question-banks.md) — Question bank catalog, instructor/vendor tabs, AI ZIP batch importer, question CRUD.
- [`page-mock-exams.md`](frontend/page-mock-exams.md) — Simulation configurator, exam runner, custom timer, text annotation, question notes.
- [`page-exam-results.md`](frontend/page-exam-results.md) — Scoreboard, pass/fail thresholds, domain analytics, overtime audit, Gemini question tutor.
- [`page-study-notes.md`](frontend/page-study-notes.md) — Markdown note editor, format toolbar, Gemini Copilot side drawer, Google Docs sync.
- [`page-profile.md`](frontend/page-profile.md) — Student profile, career tracks, provider preferences, earned credentials ledger.
- [`modal-settings.md`](frontend/modal-settings.md) — Drive cloud sync, JSON backup/restore, Gemini API key manager, accommodations.

### Backend & Managed Services Subsystem (`docs/architecture/backend/`)
- [`overview.md`](backend/overview.md) — Serverless BYOS architectural model, client-side isolation, data privacy.
- [`database-schemas.md`](backend/database-schemas.md) — Entity-relationship schema, key definitions, JSON storage contracts.
- [`data-pipeline-questions.md`](backend/data-pipeline-questions.md) — Question lifecycle: ZIP extraction, HTML sanitization, Gemini chunked parsing, database insertion.
- [`storage-byos-google-drive.md`](backend/storage-byos-google-drive.md) — Drive API v3 protocol, OAuth scope management, folder discovery, backup serialization.
- [`google-docs-api.md`](backend/google-docs-api.md) — Docs API v1 protocol, structural element batch injection, note synchronization.
- [`google-gemini-api.md`](backend/google-gemini-api.md) — Gemini `@google/genai` integration, `gemini-3.8-flash` configuration, prompt engineering, structured JSON.
