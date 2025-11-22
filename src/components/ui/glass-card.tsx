import type React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  gradient?: boolean
  hoverEffect?: boolean
}

export function GlassCard({ children, className, gradient = false, hoverEffect = false, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl",
        hoverEffect &&
          "hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300",
        className,
      )}
      {...props}
    >
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none" />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
