import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Informativa sui cookie utilizzati dal sito web OBRIYM. Scopri come utilizziamo i cookie e come gestirli.",
  alternates: {
    canonical: "https://obriym.online/cookie-policy",
  },
  openGraph: {
    title: "Cookie Policy | OBRIYM",
    description:
      "Informativa sui cookie utilizzati dal sito web OBRIYM. Scopri come utilizziamo i cookie e come gestirli.",
    url: "https://obriym.online/cookie-policy",
  },
};

export default function CookiePolicy() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Torna alla home
          </Link>
        </Button>

        <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
        <p className="text-muted-foreground mb-8">
          Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT")}
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Cosa sono i cookie?</h2>
            <p className="text-muted-foreground leading-relaxed">
              I cookie sono piccoli file di testo che vengono memorizzati sul tuo dispositivo 
              (computer, tablet o smartphone) quando visiti un sito web. Questi file permettono 
              al sito di ricordare le tue azioni e preferenze per un periodo di tempo, così 
              non devi reinserirle ogni volta che torni sul sito o navighi da una pagina all&apos;altra.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Come utilizziamo i cookie</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Il nostro sito web utilizza i seguenti tipi di cookie:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Cookie tecnici necessari:</strong> Essenziali per il 
                funzionamento del sito web. Senza questi cookie, il sito non può funzionare correttamente.
              </li>
              <li>
                <strong className="text-foreground">Cookie analitici:</strong> Ci aiutano a capire come i 
                visitatori interagiscono con il nostro sito web raccogliendo informazioni in forma anonima.
              </li>
              <li>
                <strong className="text-foreground">Cookie di preferenza:</strong> Permettono al sito di 
                ricordare le scelte che hai fatto (come la lingua o la regione) per offrirti 
                funzionalità più personalizzate.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Cookie di terze parti</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizziamo servizi di terze parti che potrebbero impostare i propri cookie:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
              <li>
                <strong className="text-foreground">Vercel Analytics:</strong> Per analizzare il traffico 
                del sito e migliorare le prestazioni.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Come gestire i cookie</h2>
            <p className="text-muted-foreground leading-relaxed">
              Puoi controllare e/o eliminare i cookie come desideri. Puoi eliminare tutti i cookie 
              già presenti sul tuo dispositivo e impostare la maggior parte dei browser per impedire 
              che vengano memorizzati. Tuttavia, se lo fai, potresti dover regolare manualmente 
              alcune preferenze ogni volta che visiti il sito e alcune funzionalità potrebbero non funzionare.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Durata dei cookie</h2>
            <p className="text-muted-foreground leading-relaxed">
              I cookie possono essere &quot;di sessione&quot; (vengono eliminati quando chiudi il browser) 
              o &quot;persistenti&quot; (rimangono sul tuo dispositivo per un periodo di tempo determinato 
              o fino a quando non li elimini manualmente).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contatti</h2>
            <p className="text-muted-foreground leading-relaxed">
              Per qualsiasi domanda relativa alla nostra Cookie Policy, puoi contattarci all&apos;indirizzo 
              email: <a href="mailto:info@obriym.online" className="text-foreground underline">info@obriym.online</a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
