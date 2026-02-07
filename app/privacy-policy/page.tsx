import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Informativa sulla privacy di OBRIYM. Scopri come trattiamo e proteggiamo i tuoi dati personali secondo il GDPR.",
  alternates: {
    canonical: "https://obriym.online/privacy-policy",
  },
  openGraph: {
    title: "Privacy Policy | OBRIYM",
    description:
      "Informativa sulla privacy di OBRIYM. Scopri come trattiamo e proteggiamo i tuoi dati personali secondo il GDPR.",
    url: "https://obriym.online/privacy-policy",
  },
};

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Torna alla home
          </Link>
        </Button>

        <h1 className="text-4xl font-bold mb-8">Informativa sulla Privacy</h1>
        <p className="text-muted-foreground mb-8">
          Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT")}
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Titolare del trattamento</h2>
            <p className="text-muted-foreground leading-relaxed">
              OBRIYM è il titolare del trattamento dei dati personali raccolti attraverso questo sito web.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Dati raccolti</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Raccogliamo i seguenti tipi di dati personali:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Dati di contatto:</strong> Nome, indirizzo email 
                forniti tramite il modulo di contatto.
              </li>
              <li>
                <strong className="text-foreground">Dati di navigazione:</strong> Informazioni tecniche 
                come indirizzo IP, tipo di browser, pagine visitate, raccolte automaticamente.
              </li>
              <li>
                <strong className="text-foreground">Dati del progetto:</strong> Informazioni sul servizio 
                richiesto e budget indicato nel modulo di contatto.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Finalità del trattamento</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              I tuoi dati personali vengono trattati per le seguenti finalità:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Rispondere alle tue richieste di contatto</li>
              <li>Fornire informazioni sui nostri servizi</li>
              <li>Migliorare il nostro sito web e i nostri servizi</li>
              <li>Adempiere agli obblighi legali</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Base giuridica</h2>
            <p className="text-muted-foreground leading-relaxed">
              Il trattamento dei tuoi dati si basa sul tuo consenso (per le richieste di contatto), 
              sul nostro legittimo interesse (per migliorare i servizi) e sugli obblighi legali 
              a cui siamo soggetti.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Conservazione dei dati</h2>
            <p className="text-muted-foreground leading-relaxed">
              I tuoi dati personali vengono conservati per il tempo necessario a soddisfare le 
              finalità per cui sono stati raccolti, e comunque non oltre i termini previsti dalla legge.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">I tuoi diritti</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Ai sensi del GDPR, hai i seguenti diritti:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Diritto di accesso ai tuoi dati personali</li>
              <li>Diritto di rettifica dei dati inesatti</li>
              <li>Diritto alla cancellazione (&quot;diritto all&apos;oblio&quot;)</li>
              <li>Diritto alla limitazione del trattamento</li>
              <li>Diritto alla portabilità dei dati</li>
              <li>Diritto di opposizione al trattamento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Sicurezza dei dati</h2>
            <p className="text-muted-foreground leading-relaxed">
              Adottiamo misure di sicurezza tecniche e organizzative appropriate per proteggere 
              i tuoi dati personali da accessi non autorizzati, perdita o distruzione.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contatti</h2>
            <p className="text-muted-foreground leading-relaxed">
              Per esercitare i tuoi diritti o per qualsiasi domanda relativa al trattamento dei 
              tuoi dati personali, puoi contattarci all&apos;indirizzo email:{" "}
              <a href="mailto:info@obriym.online" className="text-foreground underline">info@obriym.online</a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
