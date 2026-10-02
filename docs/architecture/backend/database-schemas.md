# Backend — Database Schemas & Entity Contracts

> **Target Source File**: `src/types.ts` and `src/context/AppContext.tsx`

---

## 1. Storage Keys & Table Partitioning

In the BYOS client-side model, browser `localStorage` acts as a document store partitioned across distinct table keys:

| LocalStorage Key | Entity Type | Primary Key Format | Foreign Keys |
| :--- | :--- | :--- | :--- |
| `certstudy_certifications_v1` | `Certification[]` | `cert-{timestamp}-{random}` | None |
| `certstudy_notes_v1` | `Note[]` | `note-{timestamp}-{random}` | `certId` |
| `certstudy_banks_v1` | `QuestionBank[]` | `bank-{timestamp}-{random}` | `certId` |
| `certstudy_questions_v1` | `Question[]` | `q-{timestamp}-{idx}-{random}` | `certId`, `bankId` |
| `certstudy_attempts_v1` | `ExamAttempt[]` | `attempt-{timestamp}-{random}` | `certId` |
| `certstudy_in_progress_sessions_v1` | `InProgressExamSession[]` | `session-{timestamp}` | `certId` |
| `certstudy_profile_v1` | `StudentProfile` | Singleton | None |
| `certstudy_settings_v1` | `AppSettings` | Singleton | None |
| `certstudy_gemini_api_key_v1`| `string` | Raw API Key | None |
| `certstudy_custom_client_id` | `string` | OAuth Client ID | None |

---

## 2. Entity Specifications

### 2.1 Certification (`Certification`)
Represents an official certification credential being studied.
- `id` (string, PK): Unique identifier.
- `name` (string): Credential name (e.g., *AWS Certified Solutions Architect - Associate*).
- `code` (string, optional): Short exam identifier (e.g., `SAA-C03`).
- `version` (string, optional): Exam blueprint version.
- `icon` (string): Lucide icon identifier.
- `color` (string): Tailwind CSS color theme token.
- `examDurationMinutes` (number): Official standard testing duration.
- `accommodationMinutes` (number): Extra time accommodation (+30 min).
- `domains` (`CertificationDomain[]`): Official domain weights.
  - `name`: Domain label (e.g., *Design Secure Architectures*).
  - `order`: Sequence index.
  - `description`: Coverage summary.
- `createdAt`, `lastStudiedAt` (number): Epoch millisecond timestamps.

### 2.2 Question Bank (`QuestionBank`)
Represents an individual practice test, mock exam, or collection created by an instructor.
- `id` (string, PK): Unique identifier.
- `certId` (string, FK -> `Certification.id`): Scopes bank to a specific certification.
- `name` (string): Title of the simulation (e.g., *Practice Exam 1 - High Availability*).
- `authorOrVendor` (string, optional): Instructor or publisher name (e.g., *Stephane Maarek*, *Neal Davis*, *Tutorials Dojo*). Allows grouping multiple exams under one instructor.
- `description` (string, optional): Summary or notes on the test.
- `domainTags` (string[]): Exam domains covered in this simulation.
- `createdAt`, `updatedAt` (number): Timestamps.

### 2.3 Question (`Question`)
The core exam unit.
- `id` (string, PK): Unique question identifier.
- `certId` (string, FK -> `Certification.id`).
- `bankId` (string, FK -> `QuestionBank.id`).
- `type` (`'multiple-choice' | 'scenario' | 'flashcard'`): Interaction archetype.
- `prompt` (string): Complete question stem. Supports Markdown, code blocks, and diagrams.
- `domainTag` (string): Exact certification domain classification.
- `imageUrl` (string, optional): Architectural diagram or topology image for the question stem (visible before answering).
- `explanationImageUrl` (string, optional): Explanatory diagram for the general rationale (visible after answering).
- `options` (`QuestionOption[]`, optional):
  - `id`: Option identifier (`opt-1`, `opt-2`).
  - `text`: Choice text.
  - `isCorrect` (boolean): Correctness indicator.
  - `comment` or `explanation` (string, optional): Explains why this specific option is valid or invalid.
  - `imageUrl` (string, optional): Diagram embedded inside this option.
  - `commentImageUrl` (string, optional): Diagram explaining the comment of this option.
- `allowMultipleAnswers` (boolean, optional): Set to true when question requires selecting multiple options (e.g. *Select TWO*).
- `scenarioDetails` (object, optional):
  - `context`, `codeSnippet`, `language`, `scenarioType` (`'yaml' | 'command' | 'symptom'`), `imageUrl`.
- `flashcard` (object, optional):
  - `frontPrompt`, `backAnswer`, `commandSnippet`.
- `explanation` (string, optional): Detailed technical rationale explaining correct and incorrect options.
- `createdAt`, `updatedAt` (number): Timestamps.

### 2.4 Exam Attempt & Review Record (`ExamAttempt`)
Stores the complete audit trail of a completed or prematurely ended exam simulation.
- `id` (string, PK): Unique attempt identifier.
- `certId` (string, FK -> `Certification.id`).
- `date` (number): Epoch timestamp when test was submitted.
- `mode` (`'instant-feedback' | 'final-review'`): Exam interaction mode.
- `useTimer`, `useAccommodation` (boolean).
- `durationMinutesConfigured` (number): Base allotted time.
- `totalTimeSpentSeconds` (number): Total duration consumed during the exam session.
- `totalQuestions` (number): Total question count in this exam instance.
- `correctCount` (number): Count of successfully answered questions.
- `scorePercent` (number): Percentage score achieved (0-100).
- `isOvertimeOverall` (boolean): Flag indicating whether candidate continued after timer reached zero.
- `stoppedOnTimeScore` (object, optional):
  - `answeredCount`, `correctCount`, `scorePercent`.
- `questionRecords` (`QuestionAttemptRecord[]`):
  - `questionId` (string, FK -> `Question.id`).
  - `selectedOptionIds` (string[]): Options chosen by student. Empty array if unanswered / em branco.
  - `userTextAnswer` (string, optional): Free text response.
  - `flashcardSelfRating` (`'easy' | 'good' | 'hard' | 'unrated'`): Self-assessment rating.
  - `isCorrect` (boolean): Accuracy status. False if left unanswered.
  - `timeSpentSeconds` (number): Individual seconds spent on this question.
  - `isOvertime` (boolean): Whether question time exceeded the per-question budget.
  - `flagged` (boolean): Review flag status.
  - `noteText` (string): Scratchpad note captured during the exam.
  - `annotations` (`TextAnnotation[]`):
    - `id`, `targetField`, `startOffset`, `endOffset`, `selectedText`, `type` (`highlight` | `strikethrough`).
  - `answeredAtTimestamp` (number, optional): Relative timestamp in seconds when question was committed.
- `bankIds` (string[]): Question bank IDs that provided questions for this simulation.
- `domainFilter` (string, optional): Specific domain filter applied to this attempt.

### 2.5 In-Progress Paused Exam Session (`InProgressExamSession`)
Stores active uncompleted exam sessions, enabling multi-session pause and resume.
- `id` (string, PK): Session identifier (`session-{timestamp}`).
- `certId` (string, FK -> `Certification.id`).
- `certName` (string, optional): Denormalized credential name for cross-certification display.
- `config` (`MockExamConfigOptions`): Exact exam parameters (duration, timer, feedback mode, accommodation, domain filter).
- `questionIds` (string[]): Ordered array of question IDs in this specific randomized test.
- `currentIndex` (number): Index of the question where the student paused.
- `records` (`Record<string, QuestionAttemptRecord>`): Map of question records with answers, individual time elapsed, notes, and annotations captured up to the pause point.
- `totalElapsedSeconds` (number): Cumulative exam timer elapsed so far.
- `questionTimeElapsed` (number): Seconds elapsed on the current question when paused.
- `lastPausedAt`, `createdAt` (number): Epoch timestamps.

### 2.6 Study Note (`Note`)
- `id` (string, PK).
- `certId` (string, FK -> `Certification.id`).
- `title` (string): Title of the note.
- `content` (string): Full Markdown body text.
- `tags` (string[]): Tag array (e.g. `['s3', 'security', 'lifecycle']`).
- `googleDocId`, `googleDocUrl` (string, optional): Linked Google Docs identifier and view URL.
- `createdAt`, `updatedAt`, `lastSyncedToDocsAt` (number).
