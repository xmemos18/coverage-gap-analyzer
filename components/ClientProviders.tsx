/**
 * Client-side providers wrapper
 * Wraps all client-side context providers for the application
 */

'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { ToastProvider } from '@/hooks/useToast';

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <ToastProvider>
        {children}
      </ToastProvider>
    </ThemeProvider>
  );
}
