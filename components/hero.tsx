"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_#1a1a1a,_#0b0b12_45%,_#07070c_100%)] text-background">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0f_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0f_1px,transparent_1px)] bg-[size:80px_80px] opacity-40" />
        <div className="absolute -top-32 -left-28 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(124,168,255,0.5),_transparent_70%)] blur-[120px] motion-safe:animate-float-slow" />
        <div className="absolute top-32 right-12 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(96,255,220,0.35),_transparent_70%)] blur-[120px] motion-safe:animate-float-medium" />
        <div className="absolute bottom-10 left-1/3 h-52 w-52 rounded-full bg-[radial-gradient(circle,_rgba(186,140,255,0.35),_transparent_70%)] blur-[120px] motion-safe:animate-float-fast" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="max-w-4xl">
          <p className="text-xs uppercase tracking-[0.35em] text-background/60 mb-6 flex items-center gap-3">
            <span className="inline-flex h-2 w-2 rounded-full bg-accent shadow-[0_0_18px_rgba(124,168,255,0.9)]" />
            Full-cycle web agency
          </p>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.08] tracking-tight mb-8">
            <span className="text-background/40">OBRIYM</span>
            <br />
            <span className="text-balance bg-[linear-gradient(90deg,#ffffff,#cfe4ff,#b0ffe8,#ffffff)] bg-[length:200%_200%] bg-clip-text text-transparent motion-safe:animate-gradient-shift">
              Dalla prima scintilla al lancio completo
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-background/70 max-w-2xl mb-10 leading-relaxed">
            Pianifichiamo, progettiamo, sviluppiamo e lanciamo prodotti digitali 
            che fanno un impatto reale. Siti web veloci e ottimizzati SEO e applicazioni web.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              asChild 
              size="lg" 
              className="bg-background text-foreground hover:bg-background/90 shadow-[0_18px_60px_rgba(160,190,255,0.35)]"
            >
              <Link href="#contact" className="gap-2">
                Discuti il progetto
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              size="lg"
              className="border-background/30 text-background hover:bg-background/10 bg-transparent"
            >
              <Link href="#projects">
                Vedi i lavori
              </Link>
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-background/50">
            <span className="rounded-full border border-white/10 px-4 py-2">Brand experience</span>
            <span className="rounded-full border border-white/10 px-4 py-2">UI/UX + Dev</span>
            <span className="rounded-full border border-white/10 px-4 py-2">SEO oriented</span>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="w-6 h-10 border-2 border-background/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-background/60 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
