import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SW-Vista Authentication System',
  description: 'A secure authentication and authorization system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-white dark:bg-black text-black dark:text-white min-h-screen`}>
        <ThemeProvider defaultTheme="system" storageKey="theme">
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
