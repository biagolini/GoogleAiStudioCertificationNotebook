# Frontend — Mock Exam Simulation & Runner

> **Primary Source Files**:
> - `src/components/MockExams/MockExamConfig.tsx`
> - `src/components/MockExams/ExamRunner.tsx`
> - `src/components/MockExams/ItemNavigator.tsx`
> - `src/components/MockExams/ImageModal.tsx`
> - `src/components/MockExams/AnnotatedText.tsx`
> - `src/components/MockExams/AttemptHistory.tsx`
> - `src/services/translationService.ts`

---

## 1. Functional Purpose

The Mock Exam subsystem replicates official certification test environments. It allows students to configure exam parameters, execute timed or untimed sessions, navigate items freely via an Item Navigator, annotate text (highlighter and strikethrough), translate questions into their native language using Google Translate, view images and architectural diagrams, evaluate per-option comments in instant feedback mode, track individual question budgets with overtime detection, record personal notes per question, and review past attempts.

---

## 2. Key Interface Subsystems

### 2.1 Exam Configurator (`MockExamConfig.tsx`)
- Allows student to customize simulation parameters before starting:
  - **Question Bank Source**: Specific bank, multiple banks, or all questions across the certification.
  - **Question Count**: All questions or custom sample (e.g. 20, 40, 65).
  - **Feedback Mode**:
    - *Instant Feedback* (study mode): Explanations and per-option comments revealed immediately after selecting an answer and clicking "Submit & Check Answer".
    - *Final Review* (strict simulation): Answers, comments, and explanations hidden until test submission.
  - **Accommodation Toggle**: Enables extra +30 minutes (ESL/ADA) by default based on student profile settings.
  - **Timer Controls**: Timed simulation vs untimed practice.
- Displays past attempt history for the active certification via `AttemptHistory.tsx`.

### 2.2 Exam Runner (`ExamRunner.tsx`)
- Fullscreen focus mode for distraction-free testing.
- **Top Control Bar**:
  - Live overall countdown timer showing remaining test duration.
  - Item Navigator trigger button displaying live ratio (e.g., `Answered 14/65`).
  - Text Annotation controls (Highlight and Strikethrough), active on text selection.
  - Quick domain tag badge.

### 2.3 Dedicated Per-Question Clock
- Each question possesses its own dedicated timer calculating the exact time spent on that item:
  - **Budget Calculation**: Derived from total exam duration divided by total questions (e.g., 130 min / 65 questions = 2 min 00s per question).
  - **Countdown Phase**: Counts down from the allotted budget (`MM:SS`) in a neutral card.
  - **Overtime Phase**: When the question budget expires (*estouro de tempo*), the clock turns **pulsing red** and counts **UP** (`+MM:SS`), highlighting how much excess overtime was spent on this specific item.
  - Displays total accumulated seconds on the question.

### 2.4 Real-Time Translation via Google Translate (`translationService.ts`)
- One-click translation of the active question into the student's native language (configured in Student Profile, e.g. Portuguese, Spanish, French, German, Italian, etc.):
  - Translates question prompt, scenario context, all alternative options, per-option comments, and general rationale.
  - Public client-side Google Translate endpoint with fallback to Gemini API when available.
  - Zero-latency caching per question ID and language.
  - "Mostrar Original / Show Original" button restores the original technical text instantly.

### 2.5 Multi-Tier Image Architecture (`ImageModal.tsx`)
- Questions support visual artifacts at 4 independent lifecycle stages:
  1. **Prompt Image (`q.imageUrl`)**: Architectural diagram or problem topology, visible before and after answering.
  2. **Option Images (`opt.imageUrl`)**: Visual choices or diagrams per alternative, visible before and after answering.
  3. **Option Comment Images (`opt.commentImageUrl`)**: Explanatory diagrams justifying why an option is right or wrong, visible in instant-feedback mode after answering.
  4. **Question Explanation Image (`q.explanationImageUrl`)**: Solution architecture or cheat-sheet, visible after answering.
- Lightbox modal with zoom and pan for high-resolution diagrams.

### 2.6 Per-Alternative Comments in Instant Feedback
- In Instant Feedback mode, clicking "Check Answer" renders individualized rationale callouts under **each alternative**:
  - Green-tinted container explaining why the correct choice is accurate.
  - Neutral-tinted containers explaining distractor mechanics and common exam traps.
  - General question rationale banner summarizing concepts and official documentation links.

### 2.7 Interactive Item Navigator (`ItemNavigator.tsx`)
- Comprehensive item navigation panel accessible as a slide-over drawer or docked desktop sidebar:
  - Metric counters: Total, Answered, Unanswered, and Flagged.
  - Quick filter tabs: "All", "Unanswered", "Flagged", "Answered".
  - Interactive grid of question buttons with badges:
    - Active question ring.
    - Filled badge for answered questions.
    - Yellow flag for marked questions.
    - Red overtime dot for questions that exceeded their allotted budget.
    - In instant mode: Green check / Red cross.
  - Quick jump to "Next Unanswered Question" (`fallbackUnansweredIndex`).

### 2.8 Text Annotation Engine (`AnnotatedText.tsx`)
- Enables selecting any text in prompt or alternatives.
- Floating quick tooltip on selection:
  - 🖍️ **Highlight**: Yellow emphasis marker.
  - ✂️ **Strikethrough**: Visually strikes through text to rule out distractor choices.
- Click-to-remove annotation support and persistence across exam navigation.

### 2.9 Multi-Session Pause & Resume Engine (`InProgressExamsList.tsx`)
- Students can pause active mock exams at any time:
  - Saves current question index, question order, elapsed overall time, elapsed per-question time, answers selected, flags, notes, and annotations to `localStorage` (`certstudy_in_progress_sessions_v1`).
  - Supports **multiple simultaneous in-progress sessions** across the same or different certifications.
  - Dedicated **"Simulados em Andamento"** tab in `MockExamConfig.tsx` lists all paused sessions with progress percentage, time spent, date paused, and one-click **"Continuar Simulado"** or **"Descartar"** actions.

### 2.10 Premature & Halfway Finalization
- Students can choose to end and submit an exam at **any moment** (not only after answering every question):
  - "Encerrar" button is permanently accessible in both the top toolbar and bottom footer.
  - Submitting early opens a confirmation dialog showing exact count of answered vs unanswered questions.
  - Immediately transitions to `ExamResults.tsx`, saving the attempt in history and recording all unanswered items as "Em Branco" for targeted study and review.

