# Backend — Google Gemini API & Generative Intelligence Engine

> **Primary Source File**: `src/services/geminiService.ts`

---

## 1. Architectural Role

CertStudy integrates Google Gemini AI as its core reasoning engine for exam tutoring, document parsing, and study note co-authoring. The system utilizes the official `@google/genai` TypeScript SDK with model **`gemini-3.8-flash`**.

---

## 2. API Key Management & BYOK Protocol

- **Zero Central Key Stash**: There are no shared API keys on a backend server.
- **Client-Side BYOK**:
  - The student obtains a free API key from [Google AI Studio (aistudio.google.com/apikey)](https://aistudio.google.com/apikey).
  - Stored in browser `localStorage` under `certstudy_gemini_api_key_v1`.
  - Fallback support for developer staging environments via `import.meta.env.VITE_GEMINI_API_KEY`.
- **Initialization**:
  - Instantiates `new GoogleGenAI({ apiKey })` directly in client memory per request.

---

## 3. Operational Capabilities

### 3.1 Exam Question Tutor (`explainQuestion`)
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

### 3.2 Study Notes Copilot (`assistNote`)
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

### 3.3 Batch Document Question Parser (`parseQuestionsFromDocument`)
- **Invoked From**: `ImportQuestionsAiModal.tsx`.
- **Capability**:
  - Reads raw text from unzipped `.html` or `.md` files.
  - Slices large documents into ~15-question batches using regex boundary detection.
  - Enforces strict JSON output via `responseMimeType: 'application/json'`.
  - Emits real-time progress callbacks (`stage` and `percent`) to the UI.
  - Returns structured `Question` arrays ready for database insertion.
