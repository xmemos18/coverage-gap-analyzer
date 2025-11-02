/**
 * Client-side providers wrapper
 * Wraps all client-side context providers for the application
 */

'use client';

import { ReactNode } from 'react';
import { ToastProvider } from '@/hooks/useToast';

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
