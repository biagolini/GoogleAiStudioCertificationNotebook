# AGENTS.md — Antigravity Agent Guidelines for CertStudy

Welcome to **CertStudy**! This repository is a client-side certification study and mock exam preparation companion built with React, TypeScript, Tailwind CSS, and Google Workspace integration (Google Drive & Docs).

When working on this repository via Antigravity CLI (`agy`), follow the guidelines, architectural rules, and project-specific skills defined below.

---

## 1. Project Technology Stack

- **Framework**: React 19 (SPA with Vite)
- **Language**: TypeScript (`strict` mode)
- **Styling**: Tailwind CSS
- **Icons**: `lucide-react`
- **Build & Package Management**: Bun (primary in CI/CD) and npm (fully supported)
- **Deployment Target**: GitHub Pages (Static SPA) with custom domain support (`CNAME`)
- **Storage Architecture**: **BYOS (Bring Your Own Storage)**
  - Zero centralized servers or paid databases.
  - Browser persistence via `localStorage`.
  - Cloud persistence & note export via **Google Identity Services (GSI) OAuth 2.0** (`drive.file` and `documents` scopes).

---

## 2. Core Architectural Principles

1. **Client-Side Exclusivity (No Backend Dependencies)**:
   - All state, mock exams, question banks, and notes must work 100% offline using `localStorage` even if the user never connects a Google account.
2. **Bring Your Own Storage (BYOS)**:
   - When Google Workspace is connected, files are written directly to the user's personal Google Drive folder (`/CertStudy`) or Google Docs documents.
   - Do NOT introduce any third-party telemetry, remote tracking, or external databases without explicit user instruction.
3. **Bilingual Support (i18n)**:
   - The app supports English (`en`) and Portuguese (`pt-BR`).
   - Any new user-facing strings must be added to `src/i18n/translations.ts`.
4. **Anonymity & Security**:
   - Never commit sensitive API keys, client secrets, or personal email addresses to version-controlled files.
   - Google Client IDs are public strings in single-page apps, but documentation examples should always use anonymized placeholders (`yourdomain.com`, `your-email@example.com`).

---

## 3. Directory Structure

```text
├── .agents/
│   └── skills/
│       ├── certstudy-architecture/     # System architecture & BYOS storage guide
│       ├── curate-questions/           # Certification question bank authoring
│       └── google-workspace-sync/      # Drive & Docs OAuth integration workflows
├── .github/workflows/deploy.yml       # GitHub Actions automated Bun deployment
├── docs/                              # Anonymous setup documentation
├── public/                            # Static assets, CNAME, privacy & terms
├── src/
│   ├── components/                    # Modular React components
│   ├── context/                       # AppContext & GoogleWorkspaceContext
│   ├── data/                          # Default certifications & question banks
│   ├── i18n/                          # Internationalization strings
│   ├── services/                      # Google Workspace Drive & Docs API client
│   └── types.ts                       # TypeScript interfaces & types
└── AGENTS.md                          # This file
```

---

## 4. Antigravity Skills

The following workspace skills are configured in `.agents/skills/`:

| Skill Name | Activation Trigger | Description |
| :--- | :--- | :--- |
| `certstudy-architecture` | Changes to state, storage, or layout | Deep dive into context providers, BYOS backup schema, and i18n. |
| `curate-questions` | Adding or updating question banks | Standards for certification domains, question schemas, and distractors. |
| `google-workspace-sync` | Modifying Google Drive/Docs APIs or OAuth | Safe API practices, token renewal, and folder hierarchy. |

---

## 5. Development & Verification Commands

```bash
# Install dependencies
bun install
# or
npm install

# Start local dev server
bun dev
# or
npm run dev

# Run TypeScript compilation and build
bun run build
# or
npm run build
```
