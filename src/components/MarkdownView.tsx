import React from 'react';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

const renderInlineMarkdown = (text: string) => {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="px-1 py-0.5 rounded bg-natural-surface border border-natural-border text-[0.9em] font-mono text-[#5A5A40]">
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-extrabold text-[#5A5A40]">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

export default function MarkdownView({ content, className = '' }: MarkdownViewProps) {
  const blocks = content
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className={`space-y-4 font-sans text-natural-text-dark leading-relaxed ${className}`}>
      {blocks.map((block, blockIndex) => {
        if (block.startsWith('### ')) {
          return (
            <h3 key={blockIndex} className="text-sm font-extrabold text-natural-primary uppercase tracking-wider mt-4 mb-1">
              {renderInlineMarkdown(block.slice(4))}
            </h3>
          );
        }

        if (block.startsWith('## ')) {
          return (
            <h2 key={blockIndex} className="text-lg font-extrabold text-[#5A5A40] border-b border-natural-surface pb-1 mt-4">
              {renderInlineMarkdown(block.slice(3))}
            </h2>
          );
        }

        if (block.startsWith('# ')) {
          return (
            <h1 key={blockIndex} className="text-xl font-extrabold text-[#5A5A40] border-b border-natural-surface pb-1 mt-4">
              {renderInlineMarkdown(block.slice(2))}
            </h1>
          );
        }

        const lines = block.split('\n');
        if (lines.every((line) => line.trim().startsWith('- '))) {
          return (
            <ul key={blockIndex} className="list-disc pl-5 space-y-1.5 text-natural-text-dark my-2">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex} className="pl-1 leading-relaxed">
                  {renderInlineMarkdown(line.trim().slice(2))}
                </li>
              ))}
            </ul>
          );
        }

        if (lines.every((line) => /^\d+\.\s+/.test(line.trim()))) {
          return (
            <ol key={blockIndex} className="list-decimal pl-5 space-y-1.5 text-natural-text-dark my-2">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex} className="pl-1 leading-relaxed">
                  {renderInlineMarkdown(line.trim().replace(/^\d+\.\s+/, ''))}
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={blockIndex} className="whitespace-pre-wrap leading-relaxed">
            {renderInlineMarkdown(block)}
          </p>
        );
      })}
    </div>
  );
}
