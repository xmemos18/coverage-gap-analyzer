'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Global navigation progress bar
 * Shows at the top of the page during route changes
 */
export default function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Reset progress on route change
    setLoading(false);
    setProgress(0);
  }, [pathname, searchParams]);

  // Simulate progress (Next.js doesn't expose actual loading progress)
  useEffect(() => {
    if (!loading) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 200);

    return () => clearInterval(timer);
  }, [loading]);

  if (!loading) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-1 bg-blue-100"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page loading progress"
    >
      <div
        className="h-full bg-accent transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
