---
name: curate-questions
description: Standards and schemas for curating, formatting, and validating certification question banks, mock exams, scenario questions, and flashcards in CertStudy. Use when adding new certification tracks or expanding question banks.
---

# Curate Questions Skill

This skill governs the addition and maintenance of certification question banks in `src/data/questionBanks.ts` and dynamic user imports.

## 1. Supported Question Types

CertStudy supports three distinct learning modalities defined in `src/types.ts`:

1. **`multiple-choice`**:
   - Single or multi-select (`allowMultipleAnswers: true`).
   - Requires at least 4 options with clear distractor logic.
   - Requires exactly 1 correct answer (or multiple if `allowMultipleAnswers` is enabled).
2. **`scenario`**:
   - Practical or incident-troubleshooting scenario.
   - Can include `scenarioDetails.codeSnippet` (e.g., Kubernetes YAML manifests, Terraform snippets, AWS IAM JSON policies, Dockerfiles, or bash terminal commands).
   - Can specify `scenarioDetails.scenarioType` (`yaml`, `command`, `symptom`).
3. **`flashcard`**:
   - Rapid-recall format with `flashcard.frontPrompt` and `flashcard.backAnswer`.
   - Optional `flashcard.commandSnippet` for CLI memorization (e.g., `kubectl`, `gcloud`, `aws`).

## 2. Question Schema Standard

Every `Question` object must strictly adhere to:

```typescript
export interface Question {
  id: string; // Unique string identifier (e.g., "aws-saa-q1")
  certId: string; // Target certification ID matching certifications in src/data/certifications.ts
  bankId: string; // Associated question bank ID
  type: QuestionType; // 'multiple-choice' | 'scenario' | 'flashcard'
  prompt: string; // Clear, grammatically sound question or prompt
  domainTag: string; // Exact match or relevant domain from certification
  options?: QuestionOption[]; // Array of { id: string, text: string, isCorrect: boolean }
  allowMultipleAnswers?: boolean;
  scenarioDetails?: {
    context?: string;
    codeSnippet?: string;
    language?: string;
    scenarioType?: 'yaml' | 'command' | 'symptom';
  };
  expectedFreeText?: string;
  flashcard?: {
    frontPrompt: string;
    backAnswer: string;
    commandSnippet?: string;
  };
  explanation?: string; // Comprehensive explanation of WHY the correct answer is right and why distractors are wrong
  createdAt: number;
}
```

## 3. Pedagogical Quality Checklist

When curating questions for certifications (e.g., AWS SAA-C03, GCP Cloud Engineer, CKA, CompTIA Security+):

1. **Relevance to Exam Blueprint**: The `domainTag` must align with official vendor exam guides.
2. **Detailed Explanations**: Always provide an `explanation` that elaborates on the underlying architectural decision, best practice, or official vendor documentation.
3. **Distractor Quality**: Wrong answers must represent common misconceptions or antipatterns rather than absurd choices.
4. **Formatting**: Code blocks and terminal outputs must use clean indentation without escaped markdown anomalies.
