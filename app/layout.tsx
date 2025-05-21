import { Suspense } from "react"
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { PageTransitionProvider } from "@/components/page-transition-provider"
import { LoadingBar } from "@/components/loading-bar"
import { PageTransitionEffect } from "@/components/page-transition-effect"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Tomorrow - Book Highlights",
  description: "Manage your book highlights and receive daily inspiration",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@xz/fonts@1/serve/charter-bt-pro.min.css" />
      </head>
      <body className={inter.className}>
        <Providers>
          <Suspense fallback={null}>
            <LoadingBar />
          </Suspense>
          <Suspense fallback={null}>
            <PageTransitionEffect />
          </Suspense>
          <Suspense fallback={null}>
            <PageTransitionProvider>{children}</PageTransitionProvider>
          </Suspense>
        </Providers>
      </body>
    </html>
  )
}
