"use client";

import React from "react";
import { useState, useTransition } from "react";
import { Mail, Send, ArrowUpRight, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
type ContactFormData = {
  name: string;
  email: string;
  service: string;
  budget: string;
  details: string;
};

async function sendContactEmail(data: ContactFormData): Promise<{ success: boolean; message: string }> {
  const response = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

const budgetOptions = [
  "Fino a 1000€",
  "1000€ - 2000€",
  "2000€ - 5000€",
  "5000€+",
];

const serviceOptions = [
  "Branding",
  "Sito Web",
  "App Mobile",
  "Product Design",
  "Ottimizzazione SEO",
  "Altro",
];

export function Contact() {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedService || !selectedBudget || !name || !email) {
      setMessage({ type: "error", text: "Per favore compila tutti i campi obbligatori." });
      return;
    }

    startTransition(async () => {
      const result = await sendContactEmail({
        name,
        email,
        service: selectedService,
        budget: selectedBudget,
        details,
      });

      setMessage({ type: result.success ? "success" : "error", text: result.message });

      if (result.success) {
        setName("");
        setEmail("");
        setDetails("");
        setSelectedService(null);
        setSelectedBudget(null);
      }
    });
  };

  return (
    <section id="contact" className="py-24 md:py-32 bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-background/60 mb-4">
              Contattaci
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              Hai un progetto? <br />
              Parliamone!
            </h2>
            <p className="text-lg text-background/70 leading-relaxed mb-10 max-w-md">
              Inizia una conversazione e scopri come possiamo realizzare la tua idea.
            </p>

            <div className="space-y-6">
              <a
                href="mailto:info@obriym.com"
                className="flex items-center gap-3 text-background/80 hover:text-background transition-colors group"
              >
                <Mail className="h-5 w-5" />
                <span>info@obriym.com</span>
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a
                href="https://t.me/obriym"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-background/80 hover:text-background transition-colors group"
              >
                <Send className="h-5 w-5" />
                <span>@obriym</span>
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>

          <div className="bg-background/5 rounded-lg p-8 border border-background/10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {message && (
                <div
                  className={`p-4 rounded-lg flex items-center gap-3 ${
                    message.type === "success"
                      ? "bg-green-500/20 text-green-300"
                      : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {message.type === "success" && <CheckCircle className="h-5 w-5" />}
                  <span>{message.text}</span>
                </div>
              )}

              <div>
                <Label htmlFor="help" className="text-background/80 mb-3 block">
                  Come possiamo aiutarti? *
                </Label>
                <div className="flex flex-wrap gap-2">
                  {serviceOptions.map((service) => (
                    <button
                      key={service}
                      type="button"
                      onClick={() => setSelectedService(service)}
                      className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                        selectedService === service
                          ? "bg-background text-foreground border-background"
                          : "border-background/30 text-background/80 hover:border-background/60"
                      }`}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="budget" className="text-background/80 mb-3 block">
                  Il tuo budget? *
                </Label>
                <div className="flex flex-wrap gap-2">
                  {budgetOptions.map((budget) => (
                    <button
                      key={budget}
                      type="button"
                      onClick={() => setSelectedBudget(budget)}
                      className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                        selectedBudget === budget
                          ? "bg-background text-foreground border-background"
                          : "border-background/30 text-background/80 hover:border-background/60"
                      }`}
                    >
                      {budget}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="details" className="text-background/80 mb-3 block">
                  Dettagli aggiuntivi
                </Label>
                <Textarea
                  id="details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Raccontaci del tuo progetto..."
                  className="bg-transparent border-background/30 text-background placeholder:text-background/40 min-h-[120px] focus:border-background/60"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-background/80 mb-3 block">
                    Il tuo nome *
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome"
                    required
                    className="bg-transparent border-background/30 text-background placeholder:text-background/40 focus:border-background/60"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-background/80 mb-3 block">
                    La tua email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                    className="bg-transparent border-background/30 text-background placeholder:text-background/40 focus:border-background/60"
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isPending}
                className="w-full bg-background text-foreground hover:bg-background/90 disabled:opacity-70"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Invio in corso...
                  </>
                ) : (
                  "Invia richiesta"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
