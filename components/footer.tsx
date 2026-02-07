import Link from "next/link";

const navigation = [
  { name: "Servizi", href: "#services" },
  { name: "Progetti", href: "#projects" },
  { name: "Processo", href: "#process" },
  { name: "Contatti", href: "#contact" },
];

const social = [
  { name: "Telegram", href: "https://t.me/obriym" },
  { name: "LinkedIn", href: "https://linkedin.com" },
  { name: "Upwork", href: "https://upwork.com" },
  { name: "Instagram", href: "https://instagram.com" },
];

export function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="text-xl font-bold tracking-tight">
              OBRIYM
            </Link>
            <p className="mt-4 text-muted-foreground max-w-sm leading-relaxed">
              Agenzia web full-cycle. Dalla prima scintilla al lancio completo — 
              creiamo prodotti digitali che fanno un impatto reale.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Navigazione</h3>
            <ul className="space-y-3">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Social</h3>
            <ul className="space-y-3">
              {social.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {new Date().getFullYear()} OBRIYM. Tutti i diritti riservati.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy-policy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/cookie-policy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cookie Policy
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            Fatto con amore in Ucraina
          </p>
        </div>
      </div>
    </footer>
  );
}
