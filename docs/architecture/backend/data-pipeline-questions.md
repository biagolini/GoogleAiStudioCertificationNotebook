# Backend — Question Data Pipeline & Ingestion Lifecycle

> **Primary Source References**:
> - `src/services/geminiService.ts` (`parseQuestionsFromDocument`)
> - `src/components/QuestionBanks/ImportQuestionsAiModal.tsx`
> - `src/context/AppContext.tsx` (`addQuestion`, `addQuestionsBulk`)

---

## 1. Pipeline Overview

This document details the lifecycle of how certification exam questions are parsed, sanitized, structured, and committed into the client-side datastore. Questions enter the system through three distinct ingress paths:

1. **Ingress Path A (Automated Document Ingestion via Gemini AI)**: Raw `.zip`, `.html`, or `.md` files parsed in batches.
2. **Ingress Path B (Manual Authoring)**: Interactive form in `QuestionFormModal.tsx`.
3. **Ingress Path C (JSON Restore & Starter Kit)**: Structured import from Google Drive or default catalog seeds.

---

## 2. Ingress Path A: The AI Document Ingestion Engine

```text
[ User Upload (.zip / .html / .md) ]
                │
                ▼
      [ In-Browser Decompression ]  (JSZip)
                │
                ▼
      [ HTML Text Sanitization ]    (DOMParser: strip <script>, <style>, <nav>)
                │
                ▼
      [ Chunking & Batching ]       (Split into ~15 Q chunks via boundary regex)
                │
                ▼
      [ Gemini AI Inference ]       (gemini-3.8-flash with responseMimeType: json)
                │
                ▼
      [ Schema Normalization ]      (Validate option IDs, ensure correct answers)
                │
                ▼
      [ Pre-Commit Review Screen ]  (Student inspects parsed list in UI)
                │
                ▼
      [ Atomic Bulk Storage ]       (addQuestionsBulk -> localStorage persistence)
```

### 2.1 File Extraction & Sanitization
1. **ZIP Extraction**: `JSZip.loadAsync()` reads the binary archive entirely in client memory. It scans entries for files ending with `.html`, `.htm`, `.md`, `.markdown`, or `.txt`.
2. **HTML Sanitization**: If the extracted document is HTML, the pipeline parses it through the browser's native `DOMParser`, removing non-content nodes (`script`, `style`, `noscript`, `svg`, `nav`, `footer`, `header`) and extracting readable text while preserving headings, lists, and bold text.

### 2.2 Intelligent Chunking Strategy
To prevent token output truncation when processing long exams (e.g. 65 or 75 questions):
- The pipeline utilizes a regex boundary detector:
  `/(?=(?:^|\n)(?:Question|Questão|Q\.?|#)\s*\d+[\.\:\-\)])|(?=(?:^|\n)\d+[\.\:\-\)]\s+[A-Z\u00C0-\u00FF])/gi`
- Questions are grouped into batches of 12 to 18 questions (or character windows of ~25,000 characters).
- Each batch is dispatched sequentially to `gemini-3.8-flash` with progress telemetry emitted to the UI (`stage` and `percent`).

### 2.3 Gemini Prompt & Structured JSON Extraction
- **Model**: `gemini-3.8-flash`.
- **Configuration**: `responseMimeType: 'application/json'`.
- **System Instruction**:
  - Directs Gemini to extract the question stem, all alternatives, and explanations.
  - Passes the active certification's official domain tags (e.g. *Security, Compute, Storage*) to categorize each question automatically.
  - Detects multi-response requirements (e.g. *Select TWO* -> `allowMultipleAnswers: true`).

### 2.4 Schema Normalization & Validation
Before reaching the database, raw JSON objects undergo defensive normalization:
1. **Option ID Assignment**: Normalizes options into `{ id: 'opt-1', text: string, isCorrect: boolean }`.
2. **Correctness Fallback**: Ensures at least one option is marked as `isCorrect: true`. If document formatting lacked explicit indicators, infers from the explanation or marks option 1 to avoid broken state.
3. **Domain Reconciliation**: If the model assigned an unmapped domain, matches to the closest official certification domain.

---

## 3. Database Ingestion & Persistence (`AppContext.tsx`)

Once confirmed by the user, the questions are passed to `addQuestionsBulk()`:
1. **ID Generation**: Assigns an immutable, collision-resistant primary key:
   `q-${timestamp}-${index}-${randomString}`
2. **Foreign Key Binding**:
   - `certId = activeCert.id`
   - `bankId = targetBankId` (selected existing bank or newly created bank)
3. **State Mutation**:
   - Appends all new questions into the React state array `questions`.
   - Serializes the updated array to `localStorage.setItem('certstudy_questions_v1', JSON.stringify(updated))`.
4. **Study Activity Hook**:
   - Invokes `touchCertificationStudyTime(certId)` to update `lastStudiedAt` on the parent certification.
