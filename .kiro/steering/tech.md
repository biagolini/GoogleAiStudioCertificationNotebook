---
inclusion: always
name: tech-stack
description: Technology stack, tooling, build, and verification standards for CertStudy. Use when adding dependencies, configuring the build, or running verification.
---

# Technology Stack

## Core

- Framework: React 19 (SPA)
- Language: TypeScript in strict mode
- Build tool: Vite 6 (base is set to relative, `base: './'`, in `vite.config.ts`)
- Styling: Tailwind CSS v4 (via `@tailwindcss/vite`)
- Icons: `lucide-react` only
- Animation and effects: `motion` and `canvas-confetti`

## Integrations

- Authentication: Google Identity Services (GSI) OAuth 2.0 token client
- APIs: Google Drive API v3 and Google Docs API v1
- Client wrapper: `src/services/googleWorkspaceService.ts`

## Package Management and CI

- Bun is the primary package manager in CI/CD; npm is fully supported for local work.
- The lockfile committed to the repo is `bun.lock`. Do not commit `package-lock.json`.
- Deployment target: GitHub Pages (static SPA) via `.github/workflows/deploy.yml`, using Bun and a custom domain (`CNAME` lives in `public/` so Vite copies it into `dist/`).

## Commands

```bash
# Install
bun install            # or: npm install

# Dev server (port 3000)
bun dev                # or: npm run dev

# Type-check only
bun run lint           # runs tsc --noEmit

# Production build (must pass with zero errors before completing a change)
bun run build          # or: npm run build
```

## Verification Standard

- Always run the build after making changes and fix any TypeScript errors before considering the work done.
- Keep `tsc --noEmit` clean (no type errors or warnings).
- Do not introduce dependencies that require a backend, server, or paid service.

## Environment Variables

- `VITE_GOOGLE_CLIENT_ID` is optional. The app runs fully offline via localStorage without it.
- Never commit real secrets or client IDs. Use anonymized placeholders in documentation (`your-client-id.apps.googleusercontent.com`, `yourdomain.com`, `your-email@example.com`).
