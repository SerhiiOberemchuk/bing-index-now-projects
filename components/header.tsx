"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-foreground/70 text-background backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-semibold tracking-[0.2em] text-background">
            OBRIYM
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="#services"
              className="text-xs uppercase tracking-[0.2em] text-background/70 hover:text-background transition-colors"
            >
              Servizi
            </Link>
            <Link
              href="#projects"
              className="text-xs uppercase tracking-[0.2em] text-background/70 hover:text-background transition-colors"
            >
              Progetti
            </Link>
            <Link
              href="#process"
              className="text-xs uppercase tracking-[0.2em] text-background/70 hover:text-background transition-colors"
            >
              Come lavoriamo
            </Link>
            <Link
              href="#contact"
              className="text-xs uppercase tracking-[0.2em] text-background/70 hover:text-background transition-colors"
            >
              Contatti
            </Link>
          </nav>

          <div className="hidden md:block">
            <Button asChild className="bg-background text-foreground hover:bg-background/90">
              <Link href="#contact">Inizia un progetto</Link>
            </Button>
          </div>

          <button
            className="md:hidden p-2 text-background"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-foreground border-b border-white/10 text-background">
          <nav className="flex flex-col px-4 py-4 gap-4">
            <Link
              href="#services"
              className="text-sm text-background/70 hover:text-background transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Servizi
            </Link>
            <Link
              href="#projects"
              className="text-sm text-background/70 hover:text-background transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Progetti
            </Link>
            <Link
              href="#process"
              className="text-sm text-background/70 hover:text-background transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Come lavoriamo
            </Link>
            <Link
              href="#contact"
              className="text-sm text-background/70 hover:text-background transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Contatti
            </Link>
            <Button asChild className="w-full mt-2">
              <Link href="#contact" onClick={() => setIsMenuOpen(false)}>
                Inizia un progetto
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
