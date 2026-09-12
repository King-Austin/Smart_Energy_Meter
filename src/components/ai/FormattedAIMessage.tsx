import React from 'react';

interface FormattedAIMessageProps {
  content: string;
}

/**
 * Parses markdown-like AI advisor responses into human-readable, beautifully styled HTML.
 * Handles:
 * - Bold text (**text**)
 * - Bulleted lists (- item, * item, • item)
 * - Numbered lists (1. item)
 * - Clean paragraph separation
 * - Metric/currency highlights
 */
export const FormattedAIMessage: React.FC<FormattedAIMessageProps> = ({ content }) => {
  if (!content) return null;

  // Split into paragraphs by double newline
  const paragraphs = content.split(/\n\n+/);

  const parseInline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    // Match bold: **text**
    const boldRegex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <strong key={`bold-${match.index}`} className="font-bold text-slate-950 dark:text-white">
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div className="space-y-3 text-xs leading-relaxed text-slate-800 dark:text-neutral-200">
      {paragraphs.map((para, pIdx) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        const lines = trimmed.split('\n');
        
        // If all or some lines are bullet/numbered items
        const hasBullets = lines.some(l => /^[-*•]\s+/.test(l.trim()) || /^\d+\.\s+/.test(l.trim()));

        if (hasBullets) {
          return (
            <div key={`block-${pIdx}`} className="space-y-1.5">
              {lines.map((line, lIdx) => {
                const isBullet = /^[-*•]\s+/.test(line.trim());
                const isNumber = /^\d+\.\s+/.test(line.trim());

                if (isBullet) {
                  const cleanLine = line.trim().replace(/^[-*•]\s+/, '');
                  return (
                    <div key={`li-${lIdx}`} className="flex items-start gap-2 pl-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ff5b26] mt-1.5 shrink-0" />
                      <span className="flex-1">{parseInline(cleanLine)}</span>
                    </div>
                  );
                } else if (isNumber) {
                  const match = line.trim().match(/^(\d+\.)\s+(.*)/);
                  return (
                    <div key={`num-${lIdx}`} className="flex items-start gap-2 pl-1">
                      <span className="font-bold text-[#ff5b26] shrink-0">{match ? match[1] : '•'}</span>
                      <span className="flex-1">{parseInline(match ? match[2] : line)}</span>
                    </div>
                  );
                }

                return (
                  <p key={`p-line-${lIdx}`} className="leading-relaxed">
                    {parseInline(line)}
                  </p>
                );
              })}
            </div>
          );
        }

        // Standard paragraph
        return (
          <p key={`p-${pIdx}`} className="leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={`line-${lIdx}`}>
                {parseInline(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};

export default FormattedAIMessage;

