import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { Note } from '../../types';
import {
  Plus,
  Search,
  FileText,
  Clock,
  Tag,
  Trash2,
  ExternalLink,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import NoteEditor from './NoteEditor';

export default function NotesList() {
  const { activeCert, getNotesForActiveCert, addNote, deleteNote } = useApp();
  const { t } = useTranslation();

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  if (!activeCert) return null;

  const notes = getNotesForActiveCert();

  // Selected note for active editing
  const activeEditingNote = notes.find((n) => n.id === selectedNoteId) || null;

  if (activeEditingNote) {
    return <NoteEditor note={activeEditingNote} onBack={() => setSelectedNoteId(null)} />;
  }

  const handleCreateNote = () => {
    const newNote = addNote({
      certId: activeCert.id,
      title: 'Untitled Note',
      content: `# ${activeCert.name} - Study Summary\n\n## Core Concepts\n- Key points here...\n\n> **Exam Tip**: Remember key limits and defaults.`,
      tags: [],
    });
    setSelectedNoteId(newNote.id);
  };

  // Collect all unique tags for filter pills
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags))).filter(Boolean);

  const filteredNotes = notes.filter((n) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.tags.some((tag) => tag.toLowerCase().includes(q));

    const matchesTag = selectedTag ? n.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  const formatNoteDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-150">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white">
            {t('notes.title')}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {t('notes.subtitle')}
          </p>
        </div>

        <button
          id="notes-add-btn"
          onClick={handleCreateNote}
          className="flex items-center space-x-2 px-4 py-2 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>{t('notes.addNote')}</span>
        </button>
      </div>

      {/* Search & Tag Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="notes-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('notes.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-900 dark:text-white placeholder:text-stone-400"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                selectedTag === null
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {t('notes.allTags')}
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                  selectedTag === tag
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white dark:bg-stone-900 border border-dashed border-stone-300 dark:border-stone-800 rounded-3xl space-y-4 max-w-lg mx-auto mt-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-stone-900 dark:text-white">
              {t('notes.emptyTitle')}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              {t('notes.emptyDesc')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
            <button
              id="notes-empty-create-btn"
              onClick={handleCreateNote}
              className="w-full sm:w-auto px-4 py-2 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <span className="flex items-center justify-center space-x-1.5">
                <Plus className="w-4 h-4" />
                <span>{t('notes.addNote')}</span>
              </span>
            </button>

            {(activeCert.exportIntroQuestions || activeCert.exportIntroTranscripts || activeCert.exportIntroChat) && (
              <button
                onClick={() => {
                  if (activeCert.exportIntroQuestions) {
                    addNote({
                      certId: activeCert.id,
                      title: `${activeCert.code || 'Exam'} - Practice Questions Guide`,
                      content: activeCert.exportIntroQuestions,
                      tags: ['ExamGuide', 'Questions'],
                    });
                  }
                  if (activeCert.exportIntroTranscripts) {
                    addNote({
                      certId: activeCert.id,
                      title: `${activeCert.code || 'Exam'} - Lesson Transcripts Synthesis`,
                      content: activeCert.exportIntroTranscripts,
                      tags: ['Transcripts', 'Theory'],
                    });
                  }
                  if (activeCert.exportIntroChat) {
                    addNote({
                      certId: activeCert.id,
                      title: `${activeCert.code || 'Exam'} - Study Discussions & Reference`,
                      content: activeCert.exportIntroChat,
                      tags: ['Discussions', 'Reference'],
                    });
                  }
                }}
                className="w-full sm:w-auto px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all"
              >
                <span>Load Official Intro Guides</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.map((note) => {
            const wordCount = note.content.trim() ? note.content.trim().split(/\s+/).length : 0;
            const previewSnippet = note.content
              .replace(/^[#>-]+\s/gm, '')
              .replace(/[`*_[\]]/g, '')
              .slice(0, 140);

            return (
              <div
                key={note.id}
                id={`note-card-${note.id}`}
                onClick={() => setSelectedNoteId(note.id)}
                className="group relative bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800/90 rounded-2xl p-5 hover:border-amber-500/50 dark:hover:border-amber-400/40 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-stone-900 dark:text-white text-base group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                      {note.title || 'Untitled Note'}
                    </h3>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      {note.googleDocId && (
                        <span className="w-2 h-2 rounded-full bg-blue-500" title="Synced to Google Docs" />
                      )}
                      <span className="text-[11px] text-stone-400 dark:text-stone-500 font-mono">
                        {formatNoteDate(note.updatedAt)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-3 mb-4 leading-relaxed font-sans">
                    {previewSnippet || 'No additional content...'}
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-stone-100 dark:border-stone-800/70">
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.tags.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                        >
                          #{tag}
                        </span>
                      ))}
                      {note.tags.length > 3 && (
                        <span className="text-[10px] text-stone-400 self-center">
                          +{note.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-stone-400 dark:text-stone-500 pt-1">
                    <span>{wordCount} words</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center space-x-0.5">
                      <span>Open</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
