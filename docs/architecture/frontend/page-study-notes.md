# Frontend — Study Notes & AI Copilot Workspace

> **Primary Source Files**:
> - `src/components/Notes/NotesList.tsx`
> - `src/components/Notes/NoteEditor.tsx`
> - `src/components/Notes/NoteGeminiCopilot.tsx`

---

## 1. Functional Purpose

The Study Notes module provides an authoring and revision environment for technical certification notes. It combines a Markdown editor with a live split-screen Gemini AI Copilot capable of reading active notes, explaining concepts, and writing or replacing Markdown content with one click, as well as direct synchronization to Google Docs in Google Drive.

---

## 2. Key Interface Subsystems

### 2.1 Notes List View (`NotesList.tsx`)
- Displays all notes associated with the active certification.
- Features:
  - Search bar filtering by title, tags, and content keywords.
  - Tag filter pills (e.g. `#vpc`, `#s3`, `#iam`).
  - Note cards with word count, reading time estimation, last updated date, and Google Docs sync status indicator.
  - "New Note" trigger button.

### 2.2 Note Editor Canvas (`NoteEditor.tsx`)
- Dual-mode editor:
  - **Edit Mode**: Fast monospace textarea with auto-save debounce (400ms) to `AppContext`.
  - **Preview Mode**: Clean rendered Markdown with typography styles for headings, bullet points, task checkboxes, callout quotes, and code blocks.
- **Rich Markdown Quick Toolbar**:
  - Headers (`H1`, `H2`, `H3`), bold, italic, code blocks, task lists (`- [ ]`), ordered lists, blockquotes, and exam takeaway callouts (`> **Key Exam Takeaway**:`).
- **Header Actions**:
  - Live word count and reading time indicator.
  - **"Copiloto Gemini" Toggle Button**: Expands container to wide layout (`max-w-7xl`) and docks the AI Copilot side-by-side.
  - **"Sync to Google Docs" Action Button**: Automatically pushes the note into a formatted Google Doc inside the user's `/CertStudy` Google Drive folder, returning a direct link.
  - Delete and Back navigation buttons.

### 2.3 Gemini AI Study Copilot Drawer (`NoteGeminiCopilot.tsx`)
- Docks to the right side of the editor in split-screen mode (`lg:col-span-5`).
- **Live Context Reading**: Continuously reads note title, tags, and Markdown text in real time.
- **Quick Action Command Pills**:
  - ⚡ **"Melhorar Formatação" / Format & Polish**: Restructures messy notes into clean Markdown with clear headings and emphasis.
  - 📌 **"Resumo para Prova" / Exam Summary**: Synthesizes high-density cheat sheets with key exam takeaways.
  - 🗂️ **"Gerar Flashcards" / Generate Flashcards**: Extracts practical Q&A flashcard pairs for active recall.
  - 💡 **"Aprofundar & Exemplos" / Deep Dive**: Adds architectural diagrams, use cases, and CLI commands.
  - 🎯 **"Pegadinhas & Dicas" / Exam Traps**: Flags common exam distractors and gotchas related to the note's topic.
- **Direct Markdown Note Manipulation**:
  - When Gemini suggests new or revised Markdown content, it renders an interactive preview card with one-click actions:
    - 🔄 **"Substituir Nota" / Replace Note**: Atomically replaces the editor's textarea content.
    - ➕ **"Adicionar ao Final" / Append to Bottom**: Appends the generated Markdown to the end of the current note.
    - 📋 **"Copiar Markdown" / Copy**: Copies the snippet to the system clipboard.
- **Interactive Conversation Stream**:
  - Maintains conversation history so students can ask iterative follow-up questions while drafting notes.
