'use client';

import { ReactNode } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const renderLine = (line: string, index: number) => {
    // Handle headings
    if (line.startsWith('### ')) {
      return (
        <h3 key={index} className="text-base font-semibold text-text-1 mt-3 mb-1">
          {renderInlineFormatting(line.slice(4))}
        </h3>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h2 key={index} className="text-lg font-semibold text-text-1 mt-3 mb-1">
          {renderInlineFormatting(line.slice(3))}
        </h2>
      );
    }
    if (line.startsWith('# ')) {
      return (
        <h1 key={index} className="text-xl font-bold text-text-1 mt-3 mb-1">
          {renderInlineFormatting(line.slice(2))}
        </h1>
      );
    }

    // Handle bullet points
    if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <li key={index} className="ml-4 text-sm leading-relaxed list-disc">
          {renderInlineFormatting(line.slice(2))}
        </li>
      );
    }

    // Handle numbered lists
    const numberedMatch = line.match(/^(\d+)\.\s(.*)$/);
    if (numberedMatch) {
      return (
        <li key={index} className="ml-4 text-sm leading-relaxed list-decimal">
          {renderInlineFormatting(numberedMatch[2])}
        </li>
      );
    }

    // Empty line
    if (line.trim() === '') {
      return <div key={index} className="h-2" />;
    }

    // Regular paragraph
    return (
      <p key={index} className="text-sm leading-relaxed">
        {renderInlineFormatting(line)}
      </p>
    );
  };

  const renderInlineFormatting = (text: string) => {
    const parts: ReactNode[] = [];
    let remaining = text;
    let keyIndex = 0;

    while (remaining.length > 0) {
      // Bold: **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(remaining.slice(0, boldMatch.index));
        }
        parts.push(
          <strong key={keyIndex++} className="font-semibold text-text-1">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
        continue;
      }

      // Italic: *text* (single asterisk, not at start of bullet)
      const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);
      if (italicMatch && italicMatch.index !== undefined) {
        if (italicMatch.index > 0) {
          parts.push(remaining.slice(0, italicMatch.index));
        }
        parts.push(
          <em key={keyIndex++} className="italic">
            {italicMatch[1]}
          </em>
        );
        remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
        continue;
      }

      // No more formatting found
      parts.push(remaining);
      break;
    }

    return parts;
  };

  const lines = content.split('\n');

  return (
    <div className={`space-y-1 ${className}`}>
      {lines.map((line, index) => renderLine(line, index))}
    </div>
  );
}
