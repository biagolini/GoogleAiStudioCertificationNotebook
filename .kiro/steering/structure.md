---
inclusion: always
name: project-structure
description: Folder organization and file conventions for CertStudy. Use when creating files, deciding where code belongs, or organizing components.
---

# Project Structure

```text
├── .github/workflows/deploy.yml   # GitHub Pages deployment (Bun)
├── .agents/skills/                # Antigravity skills (architecture, questions, google sync)
├── .kiro/                         # Kiro agent config, MCP settings, steering
├── docs/                          # Anonymous setup documentation
├── public/                        # Static assets, CNAME, privacy.html, terms.html
├── src/
│   ├── components/                # Modular React components
│   │   ├── Header.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── Home/                  # Certifications list / overview
│   │   ├── Workspace/             # Per-certification focused workspace
│   │   ├── MockExams/             # Exam execution, timers, results
│   │   ├── Notes/                 # Notes editor and Google Docs sync
│   │   └── QuestionBanks/         # Question management and viewing
│   ├── context/
│   │   ├── AppContext.tsx         # Global state, localStorage, JSON import/export
│   │   └── GoogleWorkspaceContext.tsx  # OAuth state, Drive/Docs sync
│   ├── data/                      # Certification presets and starter data
│   ├── i18n/
│   │   ├── LanguageContext.tsx    # useTranslation() and language switching
│   │   └── translations.ts        # Multilingual dictionaries
│   ├── services/
│   │   └── googleWorkspaceService.ts   # GSI, Drive v3, Docs v1 client
│   ├── App.tsx                    # Provider composition and tab orchestration
│   ├── main.tsx                   # React entry point
│   ├── index.css                  # Tailwind v4 configuration
│   └── types.ts                   # TypeScript interfaces and types
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Conventions

- New components go under the relevant feature folder in `src/components/`.
- Shared types belong in `src/types.ts`; do not redefine domain types locally.
- Global state and persistence flow through `AppContext`; Google connection state through `GoogleWorkspaceContext`.
- Static files that must ship as-is (including `CNAME`) belong in `public/`.
- Reference images in components and docs with relative paths.
