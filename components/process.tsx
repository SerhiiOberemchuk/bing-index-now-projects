const steps = [
  {
    number: "01",
    title: "Consulenza",
    description: "Iniziamo con una consulenza dettagliata per comprendere i tuoi obiettivi e le sfide aziendali.",
  },
  {
    number: "02",
    title: "Proposta",
    description: "Ricevi una proposta dettagliata con ambito di lavoro, tempistiche e budget — in totale trasparenza.",
  },
  {
    number: "03",
    title: "Realizzazione",
    description: "Design, sviluppo, lancio. Passo dopo passo — ti teniamo aggiornato in ogni fase.",
  },
];

export function Process() {
  return (
    <section id="process" className="py-24 md:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 items-end mb-16">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
            Come lavoriamo
          </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-6">
              Un processo chiaro, elegante, trasparente
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Segui questi semplici passi per ottenere un sito web moderno e ottimizzato SEO, 
              adattato ai tuoi obiettivi aziendali.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-secondary p-6 text-sm text-muted-foreground leading-relaxed">
            Ogni fase è pensata per ridurre le incertezze e massimizzare la qualità finale, con
            aggiornamenti costanti e decisioni condivise.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative group"
            >
              <div className="p-8 border border-border rounded-2xl bg-card hover:border-foreground/20 transition-all duration-300 h-full hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,15,15,0.12)]">
                <span className="text-5xl md:text-6xl font-semibold text-muted/30 group-hover:text-foreground/10 transition-colors duration-300">
                  {step.number}
                </span>
                <h3 className="text-xl font-semibold mt-4 mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
              
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-border to-transparent" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
