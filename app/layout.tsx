import type { Metadata } from 'next'
import { Noto_Sans_TC } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const notoSansTC = Noto_Sans_TC({
  variable: '--font-noto-sans-tc',
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
})

export const metadata: Metadata = {
  title: '瞎掰王 | 9UPPER',
  description: '每個人都在說話，但誰在說真話？找出老實人，贏得瞎掰王！',
  openGraph: {
    title: '瞎掰王 | 9UPPER',
    description: '每個人都在說話，但誰在說真話？找出老實人，贏得瞎掰王！',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-Hant" className={`${notoSansTC.variable} h-full`}>
      <body className="min-h-full">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
