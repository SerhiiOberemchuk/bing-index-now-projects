import { Code, Palette, Search, Smartphone, Zap, Globe } from "lucide-react";

const services = [
  {
    icon: Code,
    title: "Sviluppo Web",
    description: "Creiamo applicazioni web veloci, affidabili e scalabili utilizzando tecnologie moderne.",
  },
  {
    icon: Palette,
    title: "Design UI/UX",
    description: "Progettiamo interfacce intuitive che garantiscono la migliore esperienza utente.",
  },
  {
    icon: Search,
    title: "Ottimizzazione SEO",
    description: "Ottimizziamo i siti per i motori di ricerca affinché i clienti trovino la tua attività.",
  },
  {
    icon: Smartphone,
    title: "Design Responsivo",
    description: "Il tuo sito apparirà perfetto su qualsiasi dispositivo, dallo smartphone al desktop.",
  },
  {
    icon: Zap,
    title: "Product Design",
    description: "Ciclo completo di creazione di prodotti digitali dal concept al lancio.",
  },
  {
    icon: Globe,
    title: "Branding",
    description: "Sviluppiamo un'identità visiva unica che distingue il tuo brand.",
  },
];

export function Services() {
  return (
    <section id="services" className="py-24 md:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-16">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
            I nostri servizi
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Gamma completa di soluzioni web
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {"Dall'idea alla realizzazione, ti accompagniamo in ogni fase del progetto."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="group p-8 bg-card border border-border rounded-lg hover:border-foreground/20 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mb-6 group-hover:bg-foreground group-hover:text-background transition-colors duration-300">
                <service.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
