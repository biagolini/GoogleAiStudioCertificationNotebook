# Frontend — Exam Results & Performance Analytics

> **Primary Source File**: `src/components/MockExams/ExamResults.tsx`

---

## 1. Functional Purpose

The Exam Results view delivers comprehensive performance feedback immediately following mock exam completion. It analyzes score metrics, evaluates domain-level strengths and weaknesses, audits overtime answers, and provides an AI tutor integration for post-exam doubt resolution.

---

## 2. Key Interface Subsystems

### 2.1 Scorecard Banner & Passing Verdict
- Evaluates score against the certification threshold (typically 70% or 720/1000):
  - **Passed**: Emerald status badge with passing confirmation.
  - **Failed / Needs Review**: Rose status badge with guidance.
- Core metrics displayed in responsive KPI cards:
  - Score percentage and correct/total ratio.
  - **Corretas**: Total questions answered correctly.
  - **Incorretas**: Total questions answered incorrectly.
  - **Em Branco (Não Respondidas)**: Count of questions left unanswered or skipped.
  - **Tempo Total**: Overall duration consumed during the exam.

### 2.2 Overtime Audit Toggle
- A specialized metric comparison toggle:
  - Displays what the student's score would have been strictly at the moment the timer reached `00:00:00`, compared to the final score after overtime completion.
  - Assesses time management vs conceptual knowledge.

### 2.3 Domain Mastery & Average Time Breakdown
- Interactive grid categorized by official certification domains:
  - Questions attempted in each domain (`{correct}/{total} ({percent}%)`).
  - **Tempo Médio por Questão no Domínio**: Distinctly calculated and formatted (`avgTime / Q`, e.g., `1m 24s/questão`).
  - Total time consumed in the domain (`Total: {time}`).
  - Sub-counters for correct, incorrect, and unanswered questions in each domain.
  - Color-coded progress bars indicating accuracy tier.

### 2.4 Question-by-Question Review List
- Filterable by:
  - **Todas (All Questions)**
  - **Corretas (Correct Only)**
  - **Incorretas (Incorrect Only)**
  - **Não Respondidas (Unanswered / Blank Only)**
  - **Marcadas (Flagged Only)**
- Individual Question Review Cards:
  - Distinct status badges:
    - **Não Respondida (Em branco)**: Distinct amber badge and border, accompanied by an explicit notice banner clarifying that the question was left unanswered upon submission.
    - **Correta**: Emerald badge and border.
    - **Incorreta**: Rose badge and border.
  - **Duração Gasta Registrada**: Individual duration spent on each question displayed in the card header (`Duração: {time}`), with an overtime badge if budget was exceeded.
  - Full question stem with preserved user highlights and strikethroughs.
  - Options list visually marked:
    - Emerald border/badge for the official correct answer.
    - Rose border/badge for user-selected incorrect option.
    - "Sua Resposta" badge on chosen option.
    - Option-specific comments and option-specific images (`commentImageUrl`, `imageUrl`).
  - Preserved student note captured during the exam runner session.
  - Official explanation and architectural rationale, including diagram images (`explanationImageUrl`).
  - **"Perguntar ao Gemini sobre esta questão" Button**: Launches `GeminiQuestionModal.tsx` preloaded with the question, options, student's answer, and explanation for an instant AI debrief.
