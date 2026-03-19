import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'Insta Client Engine',
  description: 'Daily prospect outreach for health coaches and personal trainers',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ margin: 0, padding: 0, background: '#FFFFFF' }}>{children}</body>
    </html>
  )
}
