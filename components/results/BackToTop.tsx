'use client';

import { useState, useEffect } from 'react';
import { ScaleButton } from '@/components/animations';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling down 500px
      setIsVisible(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible) return null;

  return (
    <ScaleButton
      onClick={scrollToTop}
      className="fixed bottom-4 left-4 z-40 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-4 shadow-xl hover:shadow-2xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 border-2 border-white/20 ring-2 ring-white/30 print:hidden lg:bottom-8 lg:left-8"
      ariaLabel="Back to top"
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </ScaleButton>
  );
}
