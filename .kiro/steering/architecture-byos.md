---
inclusion: always
name: architecture-byos
description: Core architecture, state management, and Bring Your Own Storage rules for CertStudy. Use when modifying contexts, persistence, backup serialization, or storage flow.
---

# Architecture and BYOS

## State Management

Two React Context providers own application state, composed in `src/App.tsx` (LanguageProvider wraps AppProvider wraps GoogleWorkspaceProvider):

1. `AppContext` (`src/context/AppContext.tsx`): certifications, question banks, questions, notes, and mock exam sessions. It persists to browser `localStorage` on every change and handles full JSON backup import/export.
2. `GoogleWorkspaceContext` (`src/context/GoogleWorkspaceContext.tsx`): OAuth connection state, the authenticated profile, and automatic backup sync with Google Drive. It calls `googleWorkspaceService` to manage GSI tokens.

## BYOS Rules (non-negotiable)

- No central database. Never introduce a server-side database (custom MongoDB, PostgreSQL, central Firebase collections) or any component that incurs recurring infrastructure cost.
- No telemetry or third-party tracking without explicit user instruction.
- Data flow:
  1. Local first: every user interaction mutates local state and immediately saves to `localStorage`.
  2. Cloud backup: when Drive is connected, the app finds or creates a root folder named `CertStudy` on the user's personal Google Drive.
  3. Single canonical backup file (JSON) inside that folder containing the full export (certifications, question banks, questions, notes, exam sessions).
  4. Notes can also be exported as real Google Docs documents.
- The app must remain fully functional offline when no Google account is connected.

## Coding Conventions

- Functional components with hooks. Keep components modular under `src/components/`.
- Tailwind CSS classes only; no inline styles. Always support dark mode with `dark:` variants.
- Import icons only from `lucide-react`.
- Reuse the shared types in `src/types.ts` (`Certification`, `Question`, `QuestionBank`, `Note`, `ExamAttempt`, `UserSettings`, etc.).
- Handle API and storage failures gracefully; never surface uncaught exceptions to the UI.
- Verify `bun run build` (or `npm run build`) passes with zero TypeScript errors before finishing.
