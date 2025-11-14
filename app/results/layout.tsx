import { ReactNode } from 'react';

export default function ResultsLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Results page has its own navigation (ResultsNavigation)
  // So we don't render the global Navigation component here
  return <>{children}</>;
}
