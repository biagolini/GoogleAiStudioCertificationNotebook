# Backend Subsystem — Serverless BYOS Architecture & Managed Services

> **Target Audience**: AI Agents and Engineers examining backend persistence, security boundaries, and Google Managed Services integration.

---

## 1. Architectural Philosophy: The Serverless BYOS Model

CertStudy implements a **Bring Your Own Storage (BYOS)** and **Bring Your Own Key (BYOK)** architecture. Unlike traditional multi-tenant SaaS platforms that store user data on shared relational or NoSQL database clusters, CertStudy operates with:

1. **Zero Central Database**: No user credentials, notes, or exam attempts are transmitted to or stored on an application database.
2. **Zero Central Server Dependency**: The application is deployed as a purely static Single Page Application (SPA).
3. **Client-Side Data Authority**: The browser's local sandbox (`localStorage`) is the primary authoritative datastore for active sessions.
4. **Direct First-Party Google Managed Services**: When cloud features are needed, the client application communicates directly with Google's public REST and SDK endpoints using the user's authenticated OAuth 2.0 bearer token or personal Gemini API key.

---

## 2. Managed Google Services Topology

```text
[ Browser Client Application (CertStudy) ]
    │
    ├── 1. Local Storage Engine (Browser Sandbox)
    │      ├── certstudy_certifications_v1
    │      ├── certstudy_notes_v1
    │      ├── certstudy_banks_v1
    │      ├── certstudy_questions_v1
    │      ├── certstudy_attempts_v1
    │      └── certstudy_profile_v1
    │
    ├── 2. Google Identity Services (GSI OAuth 2.0)
    │      └── Client-side popup token flow
    │          Scopes: drive.file, documents
    │
    ├── 3. Google Drive API v3 (Storage BYOS)
    │      ├── Find or create "/CertStudy" folder
    │      └── Read / Write "certstudy_cloud_backup.json"
    │
    ├── 4. Google Docs API v1 (Document Synchronization)
    │      ├── Create blank Google Doc
    │      └── BatchUpdate structural text and headings
    │
    └── 5. Google Gemini API (AI Reasoning Engine)
           ├── Model: gemini-3.8-flash
           ├── SDK: @google/genai TypeScript SDK
           ├── Ingestion: Batch document chunking and JSON parsing
           ├── Q&A: Distractor explanation and doubt tutor
           └── Notes: Context-aware Markdown co-authoring
```

---

## 3. Security, Token Management & Privacy Safeguards

- **Access Token Lifecycle**:
  - OAuth tokens from Google Identity Services are held in React Context in memory (`src/context/GoogleWorkspaceContext.tsx`).
  - Tokens are never persisted to `localStorage` or external storage to prevent cross-site exposure.
  - If a token expires during long study sessions, GSI initiates a silent refresh or prompts re-authentication.
- **Scope Restriction**:
  - The application requests solely `https://www.googleapis.com/auth/drive.file` (access ONLY to files created by CertStudy, never the user's whole Drive) and `https://www.googleapis.com/auth/documents`.
- **Gemini API Key Isolation**:
  - The API key is stored in browser `localStorage` under `certstudy_gemini_api_key_v1`.
  - It is used strictly for direct calls to `https://generativelanguage.googleapis.com` via `@google/genai`.
