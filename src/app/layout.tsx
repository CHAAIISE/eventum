import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Navbar } from "@/components/navbar"
import { Providers } from "@/components/providers" 

import "./globals.css"
import "@mysten/dapp-kit/dist/index.css"

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Eventum | Web3 Event Management",
  description: "The future of on-chain events on Sui Network",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen bg-background selection:bg-cyan-500/30`}
      >
        {/* Un seul Provider qui gère tout */}
        <Providers>
          <Navbar />
          <main className="pt-16 min-h-screen">{children}</main>
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}