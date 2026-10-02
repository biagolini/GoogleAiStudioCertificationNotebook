# Backend — Google Gemini API & Generative Intelligence Engine

> **Primary Source File**: `src/services/geminiService.ts`

---

## 1. Architectural Role

CertStudy integrates Google Gemini AI as its core reasoning engine for exam tutoring, document parsing, study note co-authoring, and technical exam translation. The system utilizes the official `@google/genai` TypeScript SDK with primary model **`gemini-3.8-flash`** and automated resilience fallbacks to **`gemini-flash-latest`** and **`gemini-3.1-flash-lite`**.

---

## 2. API Key Management & BYOK Protocol

- **Zero Central Key Stash**: There are no shared API keys, proxy servers, or telemetry collectors on a backend server.
- **Client-Side BYOK (Bring Your Own Key)**:
  - The student obtains a personal API key from [Google AI Studio (aistudio.google.com/apikey)](https://aistudio.google.com/apikey).
  - Persisted locally in browser storage under the key `certstudy_gemini_api_key_v1`.
  - Fallback support for developer staging environments via `import.meta.env.VITE_GEMINI_API_KEY`.
- **Direct Client Execution**:
  - The client instantiates `new GoogleGenAI({ apiKey })` directly in browser memory per request.
  - Network requests flow straight from the client browser to Google's public endpoint (`https://generativelanguage.googleapis.com`).

---

## 3. Free-Tier vs. Paid (Pay-As-You-Go) API Keys

Google AI Studio provides two distinct service tiers for developer API keys. Users should understand the differences and constraints of each tier.

### 3.1 Free-of-Charge Tier (Default)
When generating an API key without a linked Google Cloud billing account, Google provisions the key on the **Free Tier**:
- **Pricing**: $0.00 USD (no credit card required).
- **Rate Limits**: Enforces strict requests-per-minute (RPM) and requests-per-day (RPD) quotas.
- **Shared Infrastructure**: Free tier calls are routed to shared, non-guaranteed global model pools.
- **High-Demand Saturation (HTTP 503 UNAVAILABLE)**:
  - During global demand surges, Google's public endpoints return HTTP 503 with the payload:
    ```json
    {"error":{"code":503,"message":"This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.","status":"UNAVAILABLE"}}
    ```
  - **Important**: This is not an application bug or an authentication error. The key is fully valid and authenticated, but Google's public servers are temporarily rejecting requests due to global capacity saturation.
  - Spikes are generally temporary and resolve within minutes.

### 3.2 Paid Tier (Pay-As-You-Go via Google Cloud)
Users seeking zero rate-limiting drops, dedicated throughput, and no 503 demand errors can upgrade their Google AI Studio project to **Pay-As-You-Go**:
- **Activation**:
  1. Navigate to [Google AI Studio API Keys](https://aistudio.google.com/apikey).
  2. Select **"Set up billing"** on the project and associate a valid Google Cloud Billing Account.
- **Benefits**:
  - Eliminates HTTP 503 high-demand rejections by routing requests to dedicated Tier 1 production clusters.
  - Unlocks higher RPM/TPM quotas.
  - Enables optional access to large-scale reasoning models such as `gemini-3.1-pro-preview`.

### 3.3 Separate User Billing and Cost Disclaimer
- **Independent Financial Responsibility**:
  - Any financial cost incurred from enabling Pay-As-You-Go billing is billed **directly by Google Cloud to the user's personal Google Cloud account**.
  - CertStudy is a 100% free, static client-side open-source project. CertStudy does not charge, collect, manage, broker, or subsidize API usage fees.
- **Typical Cost Expectations**:
  - Google Gemini Flash models (`gemini-3.8-flash`, `gemini-flash-latest`) are billed at micro-cent rates (approximately $0.075 per 1,000,000 input tokens and $0.30 per 1,000,000 output tokens).
  - An average tutoring session consumes 600 to 1,000 tokens per question.
  - For normal individual study routines (hundreds of question breakdowns per month), total monthly costs typically remain between **$0.10 and $1.00 USD**.
- **Spending Protection & Safety Caps**:
  - Users can set hard daily quotas and budget caps in Google Cloud Console to ensure spending never exceeds a chosen ceiling (e.g., $5.00 USD):
    - **Budget Alerts**: Configure automated email notifications at 50%, 90%, and 100% thresholds via [Google Cloud Billing Budgets](https://console.cloud.google.com/billing).
    - **Daily Request Caps**: Enforce a strict daily request limit (e.g., 300 requests/day) in [Google Cloud Generative Language API Quotas](https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas). Once reached, Google stops accepting requests, preventing accidental charges.

---

## 4. Resilience Engine & Error Diagnostics

To safeguard the user experience against upstream Google API capacity drops, `geminiService.ts` incorporates a multi-stage resilience architecture:

### 4.1 Automated Model Fallback (`generateWithFallback`)
When executing generative tasks, the engine iterates through candidate models in order:
1. `gemini-3.8-flash` (Primary default)
2. `gemini-flash-latest` (Secondary fallback)
3. `gemini-3.1-flash-lite` (Tertiary fallback)

If the primary model returns HTTP 503 (`UNAVAILABLE`), the engine logs a warning, introduces a 600ms backoff interval, and seamlessly executes the request against the fallback candidate without failing the user's workflow.

### 4.2 Error Diagnostic Normalizer (`parseErrorDiagnostics`)
When errors occur during connection testing or active requests, the service analyzes the raw response and classifies it into standard patterns:
- **HTTP 503 (High Demand)**: Flags that the API key is verified and authenticated, while informing the user that Google's public free-tier servers are at peak capacity.
- **HTTP 429 (Resource Exhausted)**: Identifies requests-per-minute quota exhaustion and advises a 1-2 minute cooldown window.
- **HTTP 400 (API_KEY_INVALID)**: Identifies malformed, truncated, or invalid keys.
- **HTTP 403 (Permission Denied)**: Identifies IP restrictions or disabled GCP project states.

### 4.3 Dual Error Presentation in UI
In both `SettingsModal.tsx` and `GeminiApiKeyModal.tsx`:
1. The **raw technical payload/JSON** is preserved in a monospaced code viewer for debugging.
2. An **interactive diagnostic card** provides human-readable context, confirms key validity, explains the root cause, and provides actionable recommendations.

---

## 5. Operational Capabilities

### 5.1 Exam Question Tutor (`explainQuestion`)
- **Invoked From**: `QuestionBankManager.tsx` and `ExamResults.tsx`.
- **Input Context**:
  - Full question stem, code blocks, scenario details.
  - All options (with marked correct answers and student's selection).
  - Domain tag and blueprint context.
  - Student's specific doubt or question.
  - Multi-turn conversation history.
- **System Instruction**:
  - Persona: Senior Technical Certification Tutor.
  - Deconstructs why the correct option satisfies the scenario constraints.
  - Explains why distractors are incorrect, suboptimal, or exam traps.
  - Highlights exam trigger words (*"most cost-effective"*, *"least operational overhead"*).

### 5.2 Study Notes Copilot (`assistNote`)
- **Invoked From**: `NoteGeminiCopilot.tsx` in `NoteEditor.tsx`.
- **Live Context**:
  - Active note title, certification name, and raw Markdown body text.
- **Preset Action Routines**:
  - `improve`: Polishes formatting, heading hierarchy, tables, and callouts.
  - `summarize`: Generates high-density executive cheat sheets.
  - `flashcards`: Extracts Q&A flashcards for active recall.
  - `expand`: Adds architectural depth, CLI examples, and use cases.
  - `exam_tips`: Dissects exam pitfalls for the covered topic.
- **Delimited Markdown Extraction Protocol**:
  - When Gemini suggests new or revised text for the note, it encloses the Markdown inside explicit boundary markers:
    ```text
    <<<MARKDOWN_NOTE_START>>>
    (pure markdown content)
    <<<MARKDOWN_NOTE_END>>>
    ```
  - The client regex extracts this block, rendering interactive **"Replace Note"** and **"Append to Bottom"** buttons in the UI.

### 5.3 Batch Document Question Parser (`parseQuestionsFromDocument`)
- **Invoked From**: `ImportQuestionsAiModal.tsx`.
- **Capability**:
  - Reads raw text from unzipped `.html` or `.md` files.
  - Slices large documents into ~15-question batches using regex boundary detection.
  - Enforces strict JSON output via `responseMimeType: 'application/json'`.
  - Emits real-time progress callbacks (`stage` and `percent`) to the UI.
  - Returns structured `Question` arrays ready for database insertion.

### 5.4 Question Translation Engine (`translateQuestion`)
- **Invoked From**: `ExamRunner.tsx`.
- **Capability**:
  - Translates question stems, option text, option explanations, and master rationales into the student's native language.
  - Preserves technical cloud terminology (AWS IAM, VPC, S3, Kubernetes Pods, CLI commands, policy JSON keys).
  - In-memory caching for zero-latency toggling between original and translated questions.
