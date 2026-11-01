'use client';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';
import { ReactNode } from 'react';

export function Providers({ children, ...props }: ThemeProviderProps & { children: ReactNode }) {
  // React 19 / Next.js 16 fix: suppress the <script> tag warning
  // by setting type="application/json" so React does not try to execute it.
  const scriptProps = typeof window === 'undefined' ? undefined : ({ type: 'application/json' } as const);

  return (
    <NextThemesProvider {...props} scriptProps={scriptProps}>
      {children}
    </NextThemesProvider>
  );
}
