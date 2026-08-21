import { Instagram, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="container mx-auto px-4">
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="flex flex-col">
            <h3 className="text-white font-bold text-lg mb-6">Začni zdarma</h3>
            <p className="text-gray-400 text-sm mb-6">Objevuj lekce wellness a vytvářej si svoji cestu ke zdravému životnímu stylu bez poplatků.</p>
                    <Link
                      to="/prihlaseni"
                      className="px-3 sm:px-5 py-2 text-xs sm:text-sm rounded-xl hover:opacity-90 transition-all font-semibold text-white"
                      style={{ backgroundColor: '#198379' }}
                    >
                      Registrovat
                    </Link>
          </div>

          <div className="flex flex-col">
            <h3 className="text-white font-bold text-lg mb-6">O NÁKUPU</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/zasady-ochrany-osobnich-udaju" className="hover:text-white transition-colors">Zásady ochrany osobních údajů</Link></li>
              <li><Link to="/podminky-uzivani" className="hover:text-white transition-colors">Podmínky užívání</Link></li>
              <li><Link to="/obchodni-podminky" className="hover:text-white transition-colors">Obchodní podmínky</Link></li>
            </ul>
          </div>

          <div className="flex flex-col">
            <h3 className="text-white font-bold text-lg mb-6">DESEYO</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">O společnosti</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Kariéra</a></li>
            </ul>
          </div>

          <div className="flex flex-col">
            <h3 className="text-white font-bold text-lg mb-6">PODPORA</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <p className="text-gray-400">Mail: <a href="mailto:podpora@deseyo.cz" className="hover:text-white transition-colors">podpora@deseyo.cz</a></p>
              </li>
              <li>
                <p className="text-gray-400">Tel: <a href="tel:+420774695769" className="hover:text-white transition-colors">+420 774 695 769</a></p>
              </li>
              <li><Link to="/kontakt" className="hover:text-white transition-colors">Další kontakty</Link></li>
            </ul>
            <div className="pt-4 border-t border-gray-700 mt-4">
              <p className="text-white font-semibold mb-3">Sledujte nás</p>
              <div className="flex gap-4">
                <a href="#" className="hover:text-white transition-colors" aria-label="Instagram">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="hover:text-white transition-colors" aria-label="YouTube">
                  <Youtube className="w-5 h-5" />
                </a>
                <a href="#" className="hover:text-white transition-colors" aria-label="TikTok">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 py-12">
          <div className="text-center mb-8">
            <p className="text-gray-400 text-sm mb-6">Bezpečné platby zajišťujě GoPay</p>
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
              <img src="/images/gopay-logo.png" alt="GoPay" className="h-8 object-contain" />
              <img src="/images/verified-by-visa.png" alt="Verified by VISA" className="h-8 object-contain" />
              <img src="/images/visa.png" alt="VISA" className="h-8 object-contain" />
              <img src="/images/visa-electron.png" alt="VISA Electron" className="h-8 object-contain" />
              <img src="/images/mastercard-secure-code.png" alt="Mastercard SecureCode" className="h-8 object-contain" />
              <img src="/images/mastercard.png" alt="Mastercard" className="h-8 object-contain" />
              <img src="/images/mastercard-electronic.png" alt="Mastercard ELECTRONIC" className="h-8 object-contain" />
              <img src="/images/maestro.png" alt="Maestro" className="h-8 object-contain" />
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-sm text-gray-500">
            © 2026 Deseyo | Všechna práva vyhrazena.
          </div>
        </div>
      </div>
    </footer>
  );
};
