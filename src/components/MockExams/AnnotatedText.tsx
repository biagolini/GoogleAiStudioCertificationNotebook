import React, { useMemo } from 'react';
import { TextAnnotation } from '../../types';

interface AnnotatedTextProps {
  idPrefix: string;
  field: string; // 'prompt', 'scenarioContext', 'option-{id}'
  text: string;
  annotations: TextAnnotation[];
  isReviewOnly?: boolean;
  onSelectionChange?: (field: string, selection: { start: number; end: number; text: string } | null) => void;
  className?: string;
}

interface TextSegment {
  text: string;
  isHighlighted: boolean;
  isStrikethrough: boolean;
}

export default function AnnotatedText({
  idPrefix,
  field,
  text,
  annotations,
  isReviewOnly = false,
  onSelectionChange,
  className = '',
}: AnnotatedTextProps) {
  // Filter annotations relevant to this specific field
  const fieldAnnotations = useMemo(() => {
    return annotations.filter((a) => a.targetField === field);
  }, [annotations, field]);

  // Compute character-level styling segments
  const segments = useMemo(() => {
    if (!text) return [];
    if (fieldAnnotations.length === 0) {
      return [{ text, isHighlighted: false, isStrikethrough: false }];
    }

    const n = text.length;
    const isHigh = new Array(n).fill(false);
    const isStrike = new Array(n).fill(false);

    fieldAnnotations.forEach((a) => {
      const s = Math.max(0, Math.min(a.startOffset, n));
      const e = Math.max(0, Math.min(a.endOffset, n));
      for (let i = s; i < e; i++) {
        if (a.type === 'highlight') isHigh[i] = true;
        if (a.type === 'strikethrough') isStrike[i] = true;
      }
    });

    const result: TextSegment[] = [];
    let currentSegment: TextSegment = {
      text: text[0],
      isHighlighted: isHigh[0],
      isStrikethrough: isStrike[0],
    };

    for (let i = 1; i < n; i++) {
      if (isHigh[i] === currentSegment.isHighlighted && isStrike[i] === currentSegment.isStrikethrough) {
        currentSegment.text += text[i];
      } else {
        result.push(currentSegment);
        currentSegment = {
          text: text[i],
          isHighlighted: isHigh[i],
          isStrikethrough: isStrike[i],
        };
      }
    }
    result.push(currentSegment);
    return result;
  }, [text, fieldAnnotations]);

  const handleMouseUp = () => {
    if (isReviewOnly || !onSelectionChange) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      onSelectionChange(field, null);
      return;
    }

    const selectedStr = selection.toString();
    // Locate offset in this element's text content
    const container = document.getElementById(`${idPrefix}-${field}`);
    if (!container || !container.contains(selection.anchorNode)) {
      return;
    }

    // Compute relative character offset
    try {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(container);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      const startOffset = preCaretRange.toString().length;
      const endOffset = startOffset + selectedStr.length;

      onSelectionChange(field, {
        start: startOffset,
        end: endOffset,
        text: selectedStr,
      });
    } catch (e) {
      // fallback
    }
  };

  return (
    <div
      id={`${idPrefix}-${field}`}
      onMouseUp={handleMouseUp}
      className={`select-text leading-relaxed ${className}`}
    >
      {segments.map((seg, idx) => {
        let spanClass = '';
        if (seg.isHighlighted && seg.isStrikethrough) {
          spanClass = 'exam-highlight exam-strikethrough';
        } else if (seg.isHighlighted) {
          spanClass = 'exam-highlight';
        } else if (seg.isStrikethrough) {
          spanClass = 'exam-strikethrough';
        }

        if (!spanClass) {
          return <span key={idx}>{seg.text}</span>;
        }

        return (
          <span key={idx} className={spanClass}>
            {seg.text}
          </span>
        );
      })}
    </div>
  );
}
