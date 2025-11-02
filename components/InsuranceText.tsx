'use client';

import InsuranceTerm from './InsuranceTerm';
import { getAllTerms } from '@/lib/insurance-terms';

interface InsuranceTextProps {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Automatically detects and wraps insurance terms with tooltips
 * Scans text for known insurance terms and adds tooltips
 */
export default function InsuranceText({ text, position = 'top' }: InsuranceTextProps) {
  const allTerms = getAllTerms();

  // Create a regex pattern that matches any of our insurance terms
  // Sort by length (longest first) to match "Medicare Advantage" before "Medicare"
  const sortedTerms = [...allTerms].sort((a, b) => b.length - a.length);

  // Escape special regex characters and create pattern
  const pattern = sortedTerms
    .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');

  const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  // Reset regex lastIndex
  regex.lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add the matched term with tooltip
    const matchedText = match[0];
    const termKey = allTerms.find(term =>
      term.toLowerCase() === matchedText.toLowerCase()
    );

    if (termKey) {
      parts.push(
        <InsuranceTerm
          key={`${termKey}-${match.index}`}
          term={termKey}
          position={position}
        >
          {matchedText}
        </InsuranceTerm>
      );
    } else {
      parts.push(matchedText);
    }

    lastIndex = match.index + matchedText.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // If no matches found, return original text
  if (parts.length === 0) {
    return <>{text}</>;
  }

  return <>{parts}</>;
}
