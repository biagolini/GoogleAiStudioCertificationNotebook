---
inclusion: auto
name: question-curation
description: Standards and schema for authoring and validating certification questions, mock exams, scenarios, and flashcards. Use when adding certification tracks or expanding question banks.
---

# Question Curation

## Supported Question Types

Defined by `QuestionType` in `src/types.ts`:

1. `multiple-choice`: single or multi-select (`allowMultipleAnswers: true`). Provide at least four options with meaningful distractors and mark the correct answer(s) via `QuestionOption.isCorrect`.
2. `scenario`: practical or troubleshooting scenario. May include `scenarioDetails.context`, `scenarioDetails.codeSnippet` (YAML, CLI command, log output), `scenarioDetails.language`, and `scenarioDetails.scenarioType` (`yaml`, `command`, `symptom`). May accept a free-text answer via `expectedFreeText`.
3. `flashcard`: rapid recall with `flashcard.frontPrompt`, `flashcard.backAnswer`, and optional `flashcard.commandSnippet`.

## Schema

Every question must conform to the `Question` interface in `src/types.ts`. Key fields: `id`, `certId`, `bankId`, `type`, `prompt`, `domainTag`, optional `options`, `allowMultipleAnswers`, `scenarioDetails`, `expectedFreeText`, `flashcard`, `explanation`, `createdAt`, `updatedAt`. Do not invent fields outside this interface; if a new field is needed, update `src/types.ts` first.

## Quality Checklist

- Align `domainTag` with the official vendor exam blueprint for the target certification.
- Always provide an `explanation` that states why the correct answer is right and why the distractors are wrong, grounded in official vendor documentation.
- Distractors must reflect real misconceptions or antipatterns, not absurd choices.
- Keep code blocks cleanly indented and free of escaped-markdown artifacts.
- Validate AWS-related technical claims using the AWS documentation MCP tools before publishing questions.

## Import/Export

- Question banks and mock exams import and export as JSON. Treat imported JSON as untrusted input: validate structure and types before merging into state.
