"use client"

export function Footer() {
    return (
        <footer className="border-t border-white/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                    <span className="text-sm text-muted-foreground">Powered by</span>

                    {/* Walrus Logo */}
                    <a
                        href="https://walrus.xyz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                        <img
                            src="/walrus_logo.svg"
                            alt="Walrus"
                            className="h-6"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling!.textContent = 'Walrus';
                            }}
                        />
                        <span className="text-sm font-semibold text-white"></span>
                    </a>

                    <span className="text-white/20">•</span>

                    {/* Enoki Logo */}
                    <a
                        href="https://enoki.mystenlabs.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                        <img
                            src="/enoki-logo.svg"
                            alt="Enoki"
                            className="h-6"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling!.textContent = 'Enoki';
                            }}
                        />
                        <span className="text-sm font-semibold text-white"></span>
                    </a>
                </div>
            </div>
        </footer>
    )
}
