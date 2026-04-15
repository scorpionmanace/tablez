import { useState, useRef, useEffect } from 'react';
import type { FC, KeyboardEvent } from 'react';
import type { CellComment, TableTheme } from '../types';

interface CommentPopoverProps {
  comments: CellComment[];
  commentMode: boolean;
  theme: TableTheme;
  position: { top: number; left: number };
  onAdd: (text: string) => void;
  onDelete: (id: string) => void;
  onResolve: (id: string) => void;
  onClose: () => void;
}

function relativeTime(ts?: string | number): string {
  if (!ts) return '';
  const ms = typeof ts === 'number' ? ts : Date.parse(ts);
  if (isNaN(ms)) return '';
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export const CommentPopover: FC<CommentPopoverProps> = ({
  comments,
  commentMode,
  theme,
  position,
  onAdd,
  onDelete,
  onResolve,
  onClose,
}) => {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const borderColor = theme.tokens?.borderColor ?? '#e2e8f0';
  const bgColor = theme.tokens?.backgroundColor ?? '#fff';
  const textColor = theme.tokens?.textColor ?? '#334155';
  const primaryColor = theme.tokens?.primaryColor ?? '#3b82f6';
  const headerBg = theme.tokens?.headerBackgroundColor ?? '#f8fafc';
  const fontSize = theme.tokens?.fontSize ?? '13px';
  const radius = theme.tokens?.borderRadius ?? '6px';

  // Auto-focus input in comment mode
  useEffect(() => {
    if (commentMode) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commentMode]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleSubmit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setDraft('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Flip position so the popover stays on-screen
  const popoverWidth = 280;
  const left =
    position.left + popoverWidth > window.innerWidth ? position.left - popoverWidth : position.left;
  const top = position.top + 300 > window.innerHeight ? position.top - 300 : position.top;

  const unresolvedComments = comments.filter((c) => !c.resolved);
  const resolvedComments = comments.filter((c) => c.resolved);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top,
        left,
        width: popoverWidth,
        zIndex: 10000,
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: radius,
        boxShadow:
          theme.tokens?.boxShadow ??
          '0 10px 30px -5px rgba(0,0,0,0.15), 0 4px 10px -3px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 380,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: headerBg,
          borderBottom: `1px solid ${borderColor}`,
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 600, fontSize, color: textColor }}>
          Comments {unresolvedComments.length > 0 && `(${unresolvedComments.length})`}
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: textColor,
            opacity: 0.5,
            fontSize: 16,
            lineHeight: 1,
            padding: '0 2px',
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Comment list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {unresolvedComments.length === 0 && !commentMode && (
          <p
            style={{
              margin: 0,
              padding: '12px',
              fontSize,
              color: `${textColor}80`,
              textAlign: 'center',
            }}
          >
            No comments yet.
          </p>
        )}

        {unresolvedComments.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            theme={theme}
            onDelete={onDelete}
            onResolve={onResolve}
          />
        ))}

        {resolvedComments.length > 0 && (
          <>
            <div
              style={{
                padding: '4px 12px',
                fontSize: '11px',
                color: `${textColor}60`,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Resolved
            </div>
            {resolvedComments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                theme={theme}
                onDelete={onDelete}
                onResolve={onResolve}
                resolved
              />
            ))}
          </>
        )}
      </div>

      {/* New comment input — always visible so users can add even in hover mode */}
      <div
        style={{
          borderTop: `1px solid ${borderColor}`,
          padding: '8px 10px',
          flexShrink: 0,
          backgroundColor: bgColor,
        }}
      >
        <textarea
          ref={inputRef}
          rows={2}
          placeholder="Add a comment… (Ctrl+Enter to submit)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            resize: 'none',
            border: `1px solid ${borderColor}`,
            borderRadius: '4px',
            padding: '6px 8px',
            fontSize,
            fontFamily: 'inherit',
            color: textColor,
            backgroundColor: bgColor,
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = primaryColor)}
          onBlur={(e) => (e.currentTarget.style.borderColor = borderColor)}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6, gap: 6 }}>
          <button
            onClick={onClose}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              border: `1px solid ${borderColor}`,
              borderRadius: '4px',
              background: 'transparent',
              cursor: 'pointer',
              color: textColor,
            }}
          >
            Cancel
          </button>
          <button
            disabled={!draft.trim()}
            onClick={handleSubmit}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: draft.trim() ? primaryColor : `${primaryColor}60`,
              color: '#fff',
              cursor: draft.trim() ? 'pointer' : 'default',
              fontWeight: 600,
            }}
          >
            Comment
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Individual comment item ─────────────────────────────── */

interface CommentItemProps {
  comment: CellComment;
  theme: TableTheme;
  onDelete: (id: string) => void;
  onResolve: (id: string) => void;
  resolved?: boolean;
}

const CommentItem: FC<CommentItemProps> = ({ comment, theme, onDelete, onResolve, resolved }) => {
  const textColor = theme.tokens?.textColor ?? '#334155';
  const primaryColor = theme.tokens?.primaryColor ?? '#3b82f6';
  const fontSize = theme.tokens?.fontSize ?? '13px';
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '8px 12px',
        opacity: resolved ? 0.55 : 1,
        position: 'relative',
      }}
    >
      {/* Author + timestamp row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
          marginBottom: 3,
        }}
      >
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: resolved ? `${textColor}80` : primaryColor,
          }}
        >
          {comment.author ?? 'Anonymous'}
        </span>
        {!!comment.timestamp && (
          <span style={{ fontSize: '11px', color: `${textColor}60` }}>
            {relativeTime(comment.timestamp)}
          </span>
        )}
      </div>

      {/* Text */}
      <p
        style={{
          margin: 0,
          fontSize,
          color: textColor,
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {comment.text}
      </p>

      {/* Actions — shown on hover */}
      {!!hovered && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 8,
            display: 'flex',
            gap: 4,
          }}
        >
          {!resolved && (
            <button
              title="Mark as resolved"
              onClick={() => onResolve(comment.id)}
              style={actionBtnStyle}
            >
              ✓
            </button>
          )}
          <button
            title="Delete comment"
            onClick={() => onDelete(comment.id)}
            style={{ ...actionBtnStyle, color: '#ef4444' }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

const actionBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 14,
  lineHeight: 1,
  padding: '1px 4px',
  borderRadius: 3,
  color: '#64748b',
};
