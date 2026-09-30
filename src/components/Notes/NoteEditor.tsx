import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { useGoogleWorkspace } from '../../context/GoogleWorkspaceContext';
import { Note } from '../../types';
import {
  ArrowLeft,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  AlertCircle,
  Eye,
  Edit3,
  Cloud,
  Clock,
  Tag,
  Trash2,
  Save,
  FileText,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

interface NoteEditorProps {
  note: Note;
  onBack: () => void;
}

export default function NoteEditor({ note, onBack }: NoteEditorProps) {
  const { updateNote, deleteNote, isSyncing, lastSyncedTimestamp } = useApp();
  const { state: gState, syncNoteToDocs } = useGoogleWorkspace();
  const { t } = useTranslation();

  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tagsInput, setTagsInput] = useState(note.tags.join(', '));
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isDocsSyncing, setIsDocsSyncing] = useState(false);
  const [docsSyncSuccess, setDocsSyncSuccess] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-save debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      updateNote(note.id, {
        title: title || 'Untitled Note',
        content,
        tags: parsedTags,
      });
    }, 400);

    return () => clearTimeout(handler);
  }, [title, content, tagsInput, note.id, updateNote]);

  const handleSyncToDocs = async () => {
    setIsDocsSyncing(true);
    setDocsSyncSuccess(false);
    const res = await syncNoteToDocs({
      ...note,
      title: title || 'Untitled Note',
      content,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setIsDocsSyncing(false);
    if (res) {
      setDocsSyncSuccess(true);
      setTimeout(() => setDocsSyncSuccess(false), 3500);
    }
  };

  const calculateStats = (text: string) => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const readTime = Math.max(1, Math.ceil(words / 200));
    return { words, readTime };
  };

  const stats = calculateStats(content);

  // Formatting actions
  const applyFormat = (prefix: string, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 4));
    }, 10);
  };

  const applyBlockFormat = (linePrefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = content.substring(0, start);
    const selected = content.substring(start, end) || 'Item';
    const after = content.substring(end);

    const formatted = `${linePrefix} ${selected}`;
    setContent(`${before}\n${formatted}\n${after}`);
  };

  const renderSimpleMarkdown = (md: string) => {
    const lines = md.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('# ')) {
        return (
          <h1 key={idx} className="text-2xl font-black text-stone-900 dark:text-white mt-4 mb-2 pb-1 border-b border-stone-200 dark:border-stone-800">
            {line.substring(2)}
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-xl font-bold text-stone-900 dark:text-white mt-3 mb-1.5">
            {line.substring(3)}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-base font-bold text-stone-800 dark:text-stone-200 mt-2 mb-1">
            {line.substring(4)}
          </h3>
        );
      }
      if (line.startsWith('> ')) {
        return (
          <blockquote key={idx} className="p-3 my-2 bg-amber-500/10 dark:bg-amber-500/15 border-l-4 border-amber-500 rounded-r-lg text-stone-800 dark:text-stone-200 text-sm">
            {line.substring(2)}
          </blockquote>
        );
      }
      if (line.startsWith('- [x] ') || line.startsWith('- [ ] ')) {
        const checked = line.startsWith('- [x] ');
        return (
          <div key={idx} className="flex items-center space-x-2 my-1 text-sm text-stone-700 dark:text-stone-300">
            <input type="checkbox" checked={checked} readOnly className="rounded text-amber-500" />
            <span className={checked ? 'line-through opacity-70' : ''}>{line.substring(6)}</span>
          </div>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-sm text-stone-700 dark:text-stone-300 my-0.5">
            {line.substring(2)}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <li key={idx} className="ml-4 list-decimal text-sm text-stone-700 dark:text-stone-300 my-0.5">
            {line.replace(/^\d+\.\s/, '')}
          </li>
        );
      }
      if (line.startsWith('```')) {
        return (
          <div key={idx} className="text-xs font-mono text-amber-600 dark:text-amber-400 opacity-60">
            {line}
          </div>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed my-1 font-normal">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in duration-150">
      {/* Editor Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center space-x-3">
          <button
            id="note-editor-back-btn"
            onClick={onBack}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 transition-colors flex items-center space-x-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Notes</span>
          </button>

          <div className="flex items-center space-x-2 text-xs text-stone-500 dark:text-stone-400">
            <span className="flex items-center space-x-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>{t('notes.wordCount', { words: stats.words, readTime: stats.readTime })}</span>
            </span>
          </div>
        </div>

        {/* Right side: Drive & Docs Sync, Preview toggle, Delete */}
        <div className="flex items-center space-x-2">
          {note.googleDocUrl ? (
            <a
              id="note-open-docs-link"
              href={note.googleDocUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs"
              title="Open Google Doc in new tab"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Google Docs</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          ) : null}

          <button
            id="note-sync-docs-btn"
            type="button"
            onClick={handleSyncToDocs}
            disabled={isDocsSyncing}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-all shadow-2xs ${
              docsSyncSuccess
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                : 'border-stone-200 dark:border-stone-800 hover:border-amber-500/80 bg-stone-100/80 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400'
            }`}
            title={note.googleDocId ? 'Update document in Google Docs' : 'Create Google Doc from this note in /CertStudy folder'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDocsSyncing ? 'animate-spin text-amber-500' : ''}`} />
            <span>{isDocsSyncing ? 'Syncing...' : docsSyncSuccess ? 'Synced to Docs!' : note.googleDocId ? 'Sync Docs' : 'Save to Docs'}</span>
          </button>

          <button
            id="note-preview-toggle-btn"
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-all ${
              isPreviewMode
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                : 'border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
            }`}
          >
            {isPreviewMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isPreviewMode ? 'Edit Mode' : 'Preview'}</span>
          </button>

          <button
            id="note-delete-btn"
            type="button"
            onClick={() => {
              if (confirm('Delete this study note?')) {
                deleteNote(note.id);
                onBack();
              }
            }}
            className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
            title="Delete Note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title & Tags Input */}
      <div className="space-y-3">
        <input
          id="note-title-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('notes.noteTitlePlaceholder')}
          className="w-full text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white bg-transparent border-none focus:outline-none placeholder:text-stone-300 dark:placeholder:text-stone-700"
        />

        <div className="flex items-center space-x-2">
          <Tag className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <input
            id="note-tags-input"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder={t('notes.tagsPlaceholder')}
            className="w-full text-xs text-stone-600 dark:text-stone-400 bg-transparent border-b border-dashed border-stone-200 dark:border-stone-800 pb-1 focus:outline-none focus:border-amber-500 placeholder:text-stone-400"
          />
        </div>
      </div>

      {/* Rich Markdown Action Toolbar */}
      {!isPreviewMode && (
        <div className="flex flex-wrap items-center gap-1 p-1.5 bg-stone-100/90 dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800 rounded-xl backdrop-blur-xs">
          <button
            type="button"
            onClick={() => applyFormat('**', '**')}
            className="p-1.5 text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 rounded-lg text-xs font-bold"
            title={t('notes.formatBold')}
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('*', '*')}
            className="p-1.5 text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 rounded-lg text-xs font-bold"
            title={t('notes.formatItalic')}
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-stone-300 dark:bg-stone-700 mx-1" />
          <button
            type="button"
            onClick={() => applyBlockFormat('#')}
            className="p-1.5 text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 rounded-lg text-xs font-bold flex items-center"
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyBlockFormat('##')}
            className="p-1.5 text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 rounded-lg text-xs font-bold flex items-center"
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyBlockFormat('###')}
            className="p-1.5 text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 rounded-lg text-xs font-bold flex items-center"
            title="Heading 3"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-stone-300 dark:bg-stone-700 mx-1" />
          <button
            type="button"
            onClick={() => applyBlockFormat('-')}
            className="p-1.5 text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 rounded-lg text-xs font-bold"
            title={t('notes.formatList')}
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyBlockFormat('1.')}
            className="p-1.5 text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 rounded-lg text-xs font-bold"
            title={t('notes.formatNumbered')}
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyBlockFormat('- [ ]')}
            className="p-1.5 text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 rounded-lg text-xs font-bold"
            title={t('notes.formatTask')}
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-stone-300 dark:bg-stone-700 mx-1" />
          <button
            type="button"
            onClick={() => applyBlockFormat('>')}
            className="p-1.5 text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 rounded-lg text-xs font-bold"
            title={t('notes.formatQuote')}
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('```\n', '\n```')}
            className="p-1.5 text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 rounded-lg text-xs font-mono font-bold"
            title={t('notes.formatCode')}
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyBlockFormat('> **Key Exam Takeaway**:')}
            className="px-2 py-1 text-amber-700 dark:text-amber-300 hover:bg-white dark:hover:bg-stone-800 rounded-lg text-xs font-bold flex items-center space-x-1"
            title={t('notes.formatCallout')}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Key Takeaway</span>
          </button>
        </div>
      )}

      {/* Editor Main Canvas / Preview */}
      <div className="min-h-[450px] p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs transition-colors">
        {isPreviewMode ? (
          <div className="prose dark:prose-invert max-w-none space-y-2">
            {content.trim() ? (
              renderSimpleMarkdown(content)
            ) : (
              <p className="text-stone-400 italic text-sm">Note content is empty.</p>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            id="note-content-editor"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing notes, architecture summaries, cheat codes, or exam tips..."
            className="w-full h-full min-h-[420px] bg-transparent border-none focus:outline-none text-stone-900 dark:text-stone-100 text-sm leading-relaxed font-mono resize-none"
          />
        )}
      </div>
    </div>
  );
}
