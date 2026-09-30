---
name: certstudy-architecture
description: Guidelines and patterns for CertStudy application architecture, state management, Bring-Your-Own-Storage (BYOS) sync, and bilingual internationalization. Use when refactoring components, modifying AppContext, or updating storage serialization.
---

# CertStudy Architecture Skill

This skill guides the Antigravity agent when modifying the core architecture, data persistence layers, or user interfaces of **CertStudy**.

## 1. State Management & Contexts

The application relies on two primary React Context providers in `src/context/`:

1. **`AppContext` (`src/context/AppContext.tsx`)**:
   - Manages certifications, question banks, study notes, and active mock exam sessions.
   - Synchronizes local state to browser `localStorage` on every change.
   - Handles full JSON backup imports/exports (`exportAllDataAsJson`, `importDataFromJson`).
2. **`GoogleWorkspaceContext` (`src/context/GoogleWorkspaceContext.tsx`)**:
   - Manages OAuth connection state, user authentication profile, and automatic backup synchronization with Google Drive.
   - Interacts with `googleWorkspaceService` to handle Google Identity Services (GSI) tokens.

## 2. Bring Your Own Storage (BYOS) Model

- **No Central Database**: Never introduce remote server-side databases (such as custom MongoDB, PostgreSQL, or central Firebase collections) that incur infrastructure costs.
- **Data Flow**:
  1. Browser Local: All user interactions mutate local state and save to `localStorage` immediately.
  2. Cloud Backup: When connected to Google Drive, the app automatically finds or creates a dedicated root folder named `CertStudy` on the user's personal Google Drive.
  3. Single Backup File: The app saves a canonical JSON backup named `certstudy-backup.json` inside this folder.
  4. Google Docs Export: Individual study notes can be exported as real Google Docs documents via the Google Docs API.

## 3. Bilingual Internationalization (i18n)

- Language preference is stored in `localStorage` under `certstudy_language`.
- All user-facing strings must use `useTranslation()` from `src/i18n/LanguageContext.tsx`.
- Whenever adding new strings, add keys to both `en` and `pt-BR` dictionaries in `src/i18n/translations.ts`.

## 4. Coding Conventions

- **Component Design**: Keep components modular inside `src/components/`. Use functional components with hooks.
- **Styling**: Tailwind CSS classes only. Avoid inline styles. Respect light and dark mode classes (`dark:...`).
- **Icons**: Import only from `lucide-react`.
- **Validation**: Ensure `bun run build` passes with zero TypeScript warnings or errors before committing changes.
