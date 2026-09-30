---
inclusion: always
name: product-overview
description: Project context and guiding principles for CertStudy. Use when planning features, reviewing changes, or making product decisions.
---

# Product Overview

CertStudy is a free, personal study companion for professional IT certifications (AWS, Google Cloud, Microsoft Azure, Kubernetes, Terraform, CompTIA, Cisco, and others). It is a 100% client-side single-page application with a Bring Your Own Storage (BYOS) architecture, giving users full privacy, zero infrastructure cost, and cross-device sync through their own Google Drive and Google Docs.

## Core Value Propositions

- Zero infrastructure cost: no backend servers or paid databases.
- Data ownership and privacy (BYOS): mock exams, answers, notes, and progress belong to the user. Nothing is stored on third-party servers.
- Cross-device sync (PC and mobile) via the user's personal Google Drive folder (/CertStudy).
- Native Google Docs integration for exporting study notes.
- Fully open and customizable: clone, add questions, or share the deployed link.

## Main Features

- Mock exams with real-exam mode (countdown timer), ESL accommodation (+30 minutes), flag for review, and practice/study mode with instant feedback and explanations.
- History and performance analytics (score, pass rate, per-domain breakdown).
- Notes editor with one-click sync to Google Docs.
- Question bank supporting single-choice, multiple-response, scenario, and flashcard question types, with JSON import/export.
- Google Drive backup and restore.
- Dark and light mode, responsive UI, and multilingual support.

## Guiding Principles

- Preserve the client-side, no-backend model. Never add remote databases, telemetry, or third-party tracking.
- Protect user privacy and data ownership in every design decision.
- Keep the app fully functional offline via localStorage even without a connected Google account.
- Add every user-facing string to all supported language dictionaries.
- Validate technical claims in question banks against official vendor documentation.
