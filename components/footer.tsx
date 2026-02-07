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
    <footer className="bg-foreground text-background border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <Link href="/" className="text-xl font-semibold tracking-[0.2em]">
              OBRIYM
            </Link>
            <p className="mt-4 text-background/70 max-w-sm leading-relaxed">
              Agenzia web full-cycle. Dalla prima scintilla al lancio completo — 
              creiamo prodotti digitali che fanno un impatto reale.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em] text-background/50">
              <span className="rounded-full border border-white/10 px-3 py-2">Strategia</span>
              <span className="rounded-full border border-white/10 px-3 py-2">Design</span>
              <span className="rounded-full border border-white/10 px-3 py-2">Engineering</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Navigazione</h3>
            <ul className="space-y-3">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-background/70 hover:text-background transition-colors"
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
                    className="text-background/70 hover:text-background transition-colors"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-background/60">
          <p>
            {new Date().getFullYear()} OBRIYM. Tutti i diritti riservati.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy-policy"
              className="text-background/60 hover:text-background transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/cookie-policy"
              className="text-background/60 hover:text-background transition-colors"
            >
              Cookie Policy
            </Link>
          </div>
          <p>Fatto con amore in Ucraina</p>
        </div>
      </div>
    </footer>
  );
}
