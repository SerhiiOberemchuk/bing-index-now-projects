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
        <div className="max-w-2xl mb-16">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Come lavoriamo
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            3 semplici passi verso un sito moderno
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Segui questi semplici passi per ottenere un sito web moderno e ottimizzato SEO, 
            adattato ai tuoi obiettivi aziendali.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative group"
            >
              <div className="p-8 border border-border rounded-lg bg-card hover:border-foreground/20 transition-colors duration-300 h-full">
                <span className="text-6xl md:text-7xl font-bold text-muted/30 group-hover:text-foreground/10 transition-colors duration-300">
                  {step.number}
                </span>
                <h3 className="text-xl font-semibold mt-4 mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
              
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
