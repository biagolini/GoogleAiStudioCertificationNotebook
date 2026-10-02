# Frontend — Question Bank Management & AI Ingestion

> **Primary Source Files**:
> - `src/components/QuestionBanks/QuestionBankManager.tsx`
> - `src/components/QuestionBanks/QuestionFormModal.tsx`
> - `src/components/QuestionBanks/ImportQuestionsAiModal.tsx`
> - `src/components/Gemini/GeminiQuestionModal.tsx`

---

## 1. Functional Purpose

The Question Bank module manages the repositories of practice questions, mock tests, and flashcards associated with the active certification. It organizes tests by instructor or vendor (e.g., Stephane Maarek, Neal Davis, Tutorials Dojo) and provides automated ingestion from raw documents using Gemini AI.

---

## 2. Key Interface Subsystems

### 2.1 Instructor & Vendor Filtering
- Extracts unique `authorOrVendor` strings across all question banks in the active certification.
- Renders an interactive filter bar at the top of the left-hand column:
  - "All Authors" pill with total count.
  - Individual author pills (e.g. *Stephane Maarek (6)*, *Neal Davis (4)*).
- Clicking an author filters the bank list exclusively to their simulations.

### 2.2 Question Bank Selection List (Left Column)
- Displays all question banks matching the active author filter.
- Each bank card shows:
  - Bank title and author headline.
  - Total question count badge.
  - Edit and Delete action controls.
- "New Bank" button launches bank creation dialog.

### 2.3 Question Browser & Search (Right Column)
- When a bank is selected, renders its questions with:
  - Keyword search input across question stems, options, and explanations.
  - Domain filter dropdown (e.g. *Storage*, *Networking*, *Compute*).
  - Question cards displaying:
    - Sequence number (`#1`, `#2`, ...).
    - Question type pill (`multiple-choice`, `scenario`, `flashcard`).
    - Domain badge.
    - Options grid with visual checkmark indicator for correct answers.
    - Official explanation box.
    - **"Dúvida com Gemini" / "Ask Gemini" button**: Opens `GeminiQuestionModal.tsx` for real-time AI walkthrough of distractors, exam tricks, and follow-up doubts.
    - Edit and delete actions.

### 2.4 Gemini AI Document Importer (`ImportQuestionsAiModal.tsx`)
- Triggered by the prominent **"Import via AI (.zip)"** button.
- Allows attaching `.zip` packages (containing `.html` or `.md` files) or direct `.html`/`.md` files.
- Workflow:
  1. Decompresses `.zip` in-browser using `JSZip`.
  2. Cleans HTML tags, scripts, and styling.
  3. Prompts user for expected question count (with presets for 10, 25, 50, 65, 75).
  4. Chunks the document and sends to Gemini (`gemini-3.8-flash`) requesting structured JSON.
  5. Shows animated progress indicator with stage status.
  6. Displays interactive preview list of all parsed questions with assigned domains and detected correct options.
  7. Atomic bulk commit into `AppContext` via `addQuestionsBulk()`.

### 2.5 Manual Question Editor Modal (`QuestionFormModal.tsx`)
- Form to add or edit individual questions:
  - Question stem with rich text.
  - Domain assignment.
  - Question type selector (`multiple-choice`, `scenario`, `flashcard`).
  - Dynamic option adder with radio/checkbox for designating correct choices.
  - Rationale and explanation textarea.
