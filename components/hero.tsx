"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-foreground text-background">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="max-w-4xl">
          <p className="text-sm uppercase tracking-[0.3em] text-background/60 mb-6">
            Full-cycle web agency
          </p>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-8">
            <span className="text-background/40">OBRIYM</span>
            <br />
            <span className="text-balance">
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
              className="bg-background text-foreground hover:bg-background/90"
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
