'use client';  // For Next.js 13+

import { ThemeProvider } from 'next-themes';
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgb(59 130 246)',
            color: '#fff',
            borderRadius: '8px',
          },
          success: { style: { background: 'rgb(16 185 129)' } },
          error: { style: { background: 'rgb(239 68 68)' } },
        }}
      />
    </ThemeProvider>
  );
}
