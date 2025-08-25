import './northwestern-colors.css';
import { Inter } from 'next/font/google';
import React from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Chronos',
  description: 'Northwest University Scheduling Portal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // For now, use system preference for dark mode
  // In the future, you can add a toggle and store preference in localStorage or cookies
  return (
    <html lang="en" className="dark:bg-northwestern-dark bg-white">
      <body className={inter.className + ' min-h-screen bg-white dark:bg-northwestern-dark text-gray-900 dark:text-gray-100'}>
        {children}
      </body>
    </html>
  );
}
