# CertStudy - Open IT Certification Study Companion

[![Live Site](https://img.shields.io/badge/Live_Site-study.biagolini.click-blue?style=flat&logo=googlechrome&logoColor=white)](https://study.biagolini.click/)
[![GitHub Pages](https://img.shields.io/badge/Deployed_on-GitHub_Pages-222222?style=flat&logo=githubpages&logoColor=white)](https://study.biagolini.click/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

Live Application: [https://study.biagolini.click/](https://study.biagolini.click/)

---

## LEGAL AND SECURITY DISCLAIMER: EXPERIMENTAL VIBE-CODED PROJECT

PLEASE READ CAREFULLY BEFORE USING, RUNNING, OR DEPLOYING THIS SOFTWARE:

1. **Developed via Vibe Coding with AI**: This project was developed entirely through conversational "vibe coding" in direct collaboration with an autonomous generative AI coding engine (Google AI Studio Build, an AI software engineering agent powered by Google Gemini models). The AI functioned as the primary implementation engineer executing code generation, refactoring, and integration from natural language briefs.
2. **Strictly Exploratory and Educational Scope**: The explicit purpose of building this project was to test, evaluate, and benchmark the AI tool itself as a development partner for rapid application ideation and implementation. The goal is technological study and educational experimentation only, NOT the creation of an enterprise-grade, certified, or production-ready software application.
3. **No Formal Security Audits**: This codebase has NOT undergone formal security audits, code verification, third-party penetration testing, or vulnerability assessments. CONSEQUENTLY, THIS SOFTWARE MUST NOT BE CONSIDERED SECURE.
4. **NEVER Connect Personal or Sensitive Accounts**:
   - DO NOT connect real personal Google accounts, corporate credentials, or sensitive Google Drive/Docs data.
   - If testing cloud integration features (Google Identity Services OAuth or Google Gemini API), use EXCLUSIVELY disposable sandbox or burner accounts with no sensitive data.
5. **Complete Disclaimer of Liability**: The authors, creators, and contributors explicitly disclaim all liability, responsibility, and warranties (express or implied) for any security vulnerabilities, credential leaks, data loss, account suspension, or any direct or indirect damages arising from the use, execution, hosting, or modification of this project. You run, deploy, and interact with this software entirely at your own risk.

---

## Overview

CertStudy is a personal certification preparation and practice exam engine designed for cloud and infrastructure certifications (AWS, Google Cloud, Microsoft Azure, Kubernetes CKA/CKAD, Terraform, Linux, CompTIA, and others).

The platform uses a 100% Client-Side Single Page Application (SPA) architecture combined with Bring Your Own Storage (BYOS). All study data, custom questions, exam attempts, and notes reside in browser local storage (`localStorage`) by default, with optional one-click cloud backup and sync via Google Drive and formatted document export via Google Docs.

---

## Architectural Documentation

A complete set of technical specifications written for AI agents and software engineers is maintained in the `docs/` directory:

- Central Architecture Guide: [`docs/architecture.md`](docs/architecture.md)
- Subsystem Documentation Tree: [`docs/architecture/`](docs/architecture/)
  - Frontend subsystem guides: [`docs/architecture/frontend/`](docs/architecture/frontend/)
  - Backend and managed services guides: [`docs/architecture/backend/`](docs/architecture/backend/)

Refer to [`docs/architecture.md`](docs/architecture.md) for detailed descriptions and direct paths to every system component.

---

## Key Features

### Mock Exam Simulation Engine
- **Exam Modes**: Real simulation mode with countdown timers and Instant Feedback mode with inline rationale for each option.
- **Item Navigator**: Full drawer and dockable sidebar displaying all questions with answered, unanswered, flagged, and overtime indicators.
- **Per-Question Time Budgeting**: Automatically calculates budgeted time per question (total exam time divided by number of questions). The clock counts down, turns red upon budget expiration, and tracks overtime seconds.
- **Multi-Session Pause and Resume**: Students can pause exams at any time and resume later. Supports multiple concurrent paused sessions across different exams and certifications.
- **Flexible Finalization**: Students can submit an exam early at any moment. Unanswered questions are logged as blank items and clearly highlighted in the results view for targeted revision.
- **Text Annotation Engine**: Select any text in the prompt or alternatives to highlight in yellow or strike through to eliminate distractors.
- **Multi-Tier Diagrams**: Supports images across question stems, options, per-option comments, and general explanations with a zoomable lightbox modal.
- **Client-Side Google Translate**: Toggle between original technical text and the student's native language with cached translations.

### Performance Analytics and Review
- **Passing Verdict**: Compares score against official passing thresholds (e.g. 70%).
- **Domain Performance Breakdown**: Calculates questions attempted, score percentage, total time consumed, and average time spent per question for each certification domain.
- **Question Categorization**: Reviews questions separated into Correct, Incorrect, and Unanswered (Blank) items, with warning banners for unattempted questions.
- **Interactive AI Tutor**: Ask doubts about specific exam questions using the built-in Gemini AI modal.

### Question Bank Management
- **Hierarchical Organization**: Categorizes questions by certification, question bank, instructor/vendor, and domain tag.
- **Question Types**: Multiple choice (single and multi-select), scenario-based questions with terminal/code blocks, and flashcards.
- **AI Batch Importer**: Upload ZIP archives containing HTML or Markdown files; client-side JSZip and Gemini AI extract and structure questions automatically into JSON.

### Markdown Notes and Google Docs Export
- Note editor with rich formatting and category tagging.
- Real-time Gemini Copilot side drawer to summarize, expand, or rewrite notes.
- Direct sync to the student's personal Google Docs account via Google Docs API v1.

---

## Technology Stack

- **Frontend Framework**: React 19 SPA with TypeScript (strict mode)
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS v4
- **Icons and Animation**: Lucide React and Motion
- **Cloud Integration**: Google Identity Services (GSI) OAuth 2.0 PKCE, Google Drive API v3, Google Docs API v1
- **Artificial Intelligence**: Google Gemini API via `@google/genai` TypeScript SDK
- **Archive Extraction**: JSZip
- **Deployment**: Static SPA hosted on GitHub Pages with custom domain support

---

## Local Development Setup

### Prerequisites
- Node.js 18 or higher (or Bun)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/cbiagolini/certstudy.git
cd certstudy
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables (Optional)
Copy the example environment configuration:
```bash
cp .env.example .env
```
For default offline usage, no credentials are required. To enable Google Drive and Docs integration, add your Google Cloud OAuth Client ID to `VITE_GOOGLE_CLIENT_ID`.

### 4. Run the Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 5. Build for Production
```bash
npm run build
```

---

## GitHub Pages Deployment

The live production deployment is active at:
[https://study.biagolini.click/](https://study.biagolini.click/)

Automated deployment is configured in `.github/workflows/deploy.yml` using Bun and GitHub Actions:

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: updates to study platform"
   git push origin main
   ```
2. In your repository on GitHub, navigate to **Settings > Pages**.
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. If using a custom domain, set the domain in `public/CNAME` (e.g. `study.biagolini.click`).
5. Deployment will trigger automatically on every push to the `main` branch.

---

## Google Cloud OAuth 2.0 Configuration

When enabling Google Drive and Google Docs synchronization:

1. Create a project in Google Cloud Console.
2. Enable **Google Drive API** and **Google Docs API**.
3. Configure the OAuth Consent Screen (External user type) with scopes:
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/documents`
4. Under Credentials, create an OAuth 2.0 Client ID (Web Application type).
5. In **Authorized JavaScript origins**, add your exact domain URLs without a trailing slash:
   - `http://localhost:3000`
   - `https://study.biagolini.click`
   - `https://<your-username>.github.io`
6. Set `VITE_GOOGLE_CLIENT_ID` in your `.env` file or repository GitHub Actions secrets.

For detailed setup instructions, refer to:
- [`docs/google-cloud-oauth-setup.md`](docs/google-cloud-oauth-setup.md)
- [`docs/google-oauth-app-verification-and-demo-video.md`](docs/google-oauth-app-verification-and-demo-video.md)
- [`docs/oauth-homepage-domain-verification.md`](docs/oauth-homepage-domain-verification.md)

---

## Project Structure

```text
├── .github/
│   └── workflows/
│       └── deploy.yml            # Automated GitHub Actions deployment pipeline
├── docs/
│   ├── architecture.md           # Central architecture index and component mapping
│   ├── architecture/
│   │   ├── backend/              # Serverless storage, schemas, and API protocols
│   │   └── frontend/             # Component hierarchy, views, and interaction models
│   ├── google-cloud-oauth-setup.md
│   ├── google-oauth-app-verification-and-demo-video.md
│   └── oauth-homepage-domain-verification.md
├── public/
│   └── CNAME                     # Custom domain binding (study.biagolini.click)
├── src/
│   ├── components/               # Modular React UI components
│   │   ├── Header.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── Home/
│   │   ├── MockExams/
│   │   ├── Notes/
│   │   ├── QuestionBanks/
│   │   └── Workspace/
│   ├── context/                  # AppContext and GoogleWorkspaceContext
│   ├── data/                     # Certification presets and starter questions
│   ├── i18n/                     # Internationalization dictionaries
│   ├── services/                 # Drive, Docs, Gemini, and Translation services
│   ├── App.tsx                   # View router orchestrator
│   ├── index.css                 # Tailwind CSS entry point
│   ├── main.tsx                  # React entry point
│   └── types.ts                  # TypeScript data contracts and interfaces
├── .env.example                  # Environment variable reference
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## License

This project is released under the **MIT License**.
