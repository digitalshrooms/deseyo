import { Instagram, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';

const FooterHeading = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-xs font-normal uppercase tracking-widest mb-5" style={{ color: 'var(--text-subtle)' }}>
    {children}
  </h3>
);

const FooterLink = ({ to, href, children }: { to?: string; href?: string; children: React.ReactNode }) => {
  const className = 'text-sm transition-colors hover:opacity-80';
  const style = { color: 'var(--text-muted)' };
  return to ? (
    <Link to={to} className={className} style={style}>{children}</Link>
  ) : (
    <a href={href} className={className} style={style}>{children}</a>
  );
};

export const Footer = () => {
  return (
    <footer className="mt-auto" style={{ backgroundColor: 'var(--bg-elevated)', borderTop: '1px solid var(--border)' }}>
      <div className="container mx-auto px-4">
        <div className="py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2 flex flex-col">
            <img src="/images/deseyo_logo_vertikalni.png" alt="Deseyo" className="h-7 w-auto mb-4 object-contain" style={{ objectPosition: 'left' }} />
            <p className="text-sm mb-5 leading-relaxed max-w-xs" style={{ color: 'var(--text-muted)' }}>
              Objevuj lekce wellness a vytvářej si svoji cestu ke zdravému životnímu stylu bez poplatků.
            </p>
            <Link
              to="/prihlaseni"
              className="inline-flex w-fit px-5 py-2.5 text-sm rounded-full font-normal text-white transition-all hover:opacity-90"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              Začít zdarma
            </Link>
          </div>

          <div className="flex flex-col">
            <FooterHeading>O nákupu</FooterHeading>
            <ul className="space-y-3">
              <li><FooterLink to="/zasady-ochrany-osobnich-udaju">Zásady ochrany osobních údajů</FooterLink></li>
              <li><FooterLink to="/podminky-uzivani">Podmínky užívání</FooterLink></li>
              <li><FooterLink to="/obchodni-podminky">Obchodní podmínky</FooterLink></li>
            </ul>
          </div>

          <div className="flex flex-col">
            <FooterHeading>Deseyo</FooterHeading>
            <ul className="space-y-3">
              <li><FooterLink href="#">O společnosti</FooterLink></li>
              <li><FooterLink href="#">Kariéra</FooterLink></li>
            </ul>
          </div>

          <div className="flex flex-col">
            <FooterHeading>Podpora</FooterHeading>
            <ul className="space-y-3 mb-6">
              <li className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Mail: <a href="mailto:podpora@deseyo.cz" className="transition-colors hover:opacity-80" style={{ color: 'var(--text-muted)' }}>podpora@deseyo.cz</a>
              </li>
              <li className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Tel: <a href="tel:+420774695769" className="transition-colors hover:opacity-80" style={{ color: 'var(--text-muted)' }}>+420 774 695 769</a>
              </li>
              <li><FooterLink to="/kontakt">Další kontakty</FooterLink></li>
            </ul>
            <div className="flex gap-3">
              <a
                href="#"
                aria-label="Instagram"
                className="flex items-center justify-center w-9 h-9 rounded-full transition-all hover:opacity-80"
                style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)' }}
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                aria-label="YouTube"
                className="flex items-center justify-center w-9 h-9 rounded-full transition-all hover:opacity-80"
                style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)' }}
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="#"
                aria-label="TikTok"
                className="flex items-center justify-center w-9 h-9 rounded-full transition-all hover:opacity-80"
                style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)' }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="py-8" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs text-center mb-5" style={{ color: 'var(--text-subtle)' }}>Bezpečné platby zajišťuje GoPay</p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8 opacity-60">
            <img src="/images/gopay-logo.png" alt="GoPay" className="h-7 object-contain" />
            <img src="/images/verified-by-visa.png" alt="Verified by VISA" className="h-7 object-contain" />
            <img src="/images/visa.png" alt="VISA" className="h-7 object-contain" />
            <img src="/images/visa-electron.png" alt="VISA Electron" className="h-7 object-contain" />
            <img src="/images/mastercard-secure-code.png" alt="Mastercard SecureCode" className="h-7 object-contain" />
            <img src="/images/mastercard.png" alt="Mastercard" className="h-7 object-contain" />
            <img src="/images/mastercard-electronic.png" alt="Mastercard ELECTRONIC" className="h-7 object-contain" />
            <img src="/images/maestro.png" alt="Maestro" className="h-7 object-contain" />
          </div>
        </div>

        <div className="py-5 text-center text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-subtle)' }}>
          © 2026 Deseyo | Všechna práva vyhrazena.
        </div>
      </div>
    </footer>
  );
};
