import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Ticket, Wallet, Menu, Compass, Calendar, Settings } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function Navbar() {
  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl rounded-full border border-white/10 bg-[#03132b]/80 backdrop-blur-md shadow-xl shadow-black/20">
      <div className="px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg group-hover:shadow-cyan-500/25 transition-all">
            <Ticket className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Eventum
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-white transition-colors flex items-center gap-2"
          >
            <Compass className="h-4 w-4" />
            Explore
          </Link>
          <Link
            href="/my-events"
            className="text-sm font-medium text-muted-foreground hover:text-white transition-colors flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            My Events
          </Link>
          <Link
            href="/manage"
            className="text-sm font-medium text-muted-foreground hover:text-white transition-colors flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Manage
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button className="hidden md:flex bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-0 shadow-lg shadow-cyan-900/20 rounded-full font-medium">
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </Button>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] border-l border-white/10 bg-background/95 backdrop-blur-xl">
              <div className="flex flex-col gap-6 mt-8">
                <Link href="/" className="flex items-center gap-3 text-lg font-medium">
                  <Compass className="h-5 w-5 text-cyan-400" />
                  Explore
                </Link>
                <Link href="/my-events" className="flex items-center gap-3 text-lg font-medium">
                  <Calendar className="h-5 w-5 text-blue-400" />
                  My Events
                </Link>
                <Link href="/manage" className="flex items-center gap-3 text-lg font-medium">
                  <Settings className="h-5 w-5 text-cyan-400" />
                  Manage
                </Link>
                <Button className="w-full mt-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-0">
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
