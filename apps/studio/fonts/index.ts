import { Inter, Source_Code_Pro } from 'next/font/google'

export const customFont = Inter({
  subsets: ['latin'],
  variable: '--font-custom',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

export const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  fallback: ['Source Code Pro', 'Office Code Pro', 'Menlo', 'monospace'],
  variable: '--font-source-code-pro',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})
