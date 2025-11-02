'use client';

import Tooltip from './Tooltip';
import { getInsuranceTerm } from '@/lib/insurance-terms';

interface InsuranceTermProps {
  term: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode;
}

/**
 * Wrapper component that adds tooltips to insurance terms
 * Automatically looks up the definition from the insurance terms dictionary
 */
export default function InsuranceTerm({
  term,
  position = 'top',
  children
}: InsuranceTermProps) {
  const termData = getInsuranceTerm(term);

  // If no definition found, just return the text without tooltip
  if (!termData) {
    return <>{children || term}</>;
  }

  return (
    <Tooltip
      content={termData.definition}
      example={termData.example}
      position={position}
    >
      {children || term}
    </Tooltip>
  );
}
