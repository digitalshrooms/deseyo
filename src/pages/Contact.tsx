import {
  Mail,
  Phone,
  Instagram,
  Facebook,
  Send,
  ChevronDown,
  Shield,
  Heart,
  Users,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const BRAND = '#198379';
const BRAND_LIGHT = '#e8f5f3';
const BRAND_MID = '#1aa88c';

const FAQ_ITEMS = [
  {
    q: 'Jak dlouho trvá odpověď na dotaz?',
    a: 'Snažíme se odpovídat co nejdříve v pracovní dny. Na komplexnější dotazy si vyhrazujeme až 48 hodin. Nikdy vás nenecháme bez odpovědi.',
  },
  {
    q: 'Jak funguje členství na DESEYO?',
    a: 'Po registraci získáte přístup do svého profilu a bezplatného obsahu. Prémiové lekce, programy a živé přenosy jsou dostupné s předplatným Basic, Premium nebo Legend.',
  },
  {
    q: 'Mohu kdykoli zrušit předplatné?',
    a: 'Ano, předplatné můžete zrušit kdykoliv bez sankcí přímo ve svém profilu v sekci Nastavení. Přístup vám zůstane do konce zaplaceného období.',
  },
  {
    q: 'Co dělat při technickém problému?',
    a: 'Popište problém co nejpodrobněji ve formuláři níže nebo napište na podpora@deseyo.cz. Připojte snímek obrazovky, pokud je to možné. Technické dotazy řešíme přednostně.',
  },
  {
    q: 'Nabízíte firemní nebo skupinové členství?',
    a: 'Ano, nabízíme skupinová řešení pro firmy, komunity i wellness centra. Napište nám přes kategorii „Chci navázat spolupráci" a domluvíme se individuálně.',
  },
  {
    q: 'Kde najdu faktury a daňové doklady?',
    a: 'Veškeré doklady k platbám najdete ve svém profilu v sekci Platby a předplatné. Doklady jsou dostupné ke stažení ve formátu PDF.',
  },
];

const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        border: `1px solid ${open ? '#c8e6e2' : '#f0f0f0'}`,
        backgroundColor: open ? '#fafffe' : '#ffffff',
        boxShadow: open ? '0 2px 12px rgba(25,131,121,0.08)' : '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      <button
        className="w-full flex items-center justify-between px-7 py-5 text-left gap-5 focus:outline-none"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span
          className="font-semibold text-[15px] leading-snug transition-colors duration-200"
          style={{ color: open ? BRAND : '#1a1a1a' }}
        >
          {q}
        </span>
        <span
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
          style={{ backgroundColor: open ? BRAND : BRAND_LIGHT }}
        >
          <ChevronDown
            className="w-4 h-4 transition-transform duration-300"
            style={{ color: open ? '#fff' : BRAND, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? '180px' : '0px', opacity: open ? 1 : 0 }}
      >
        <p className="px-7 pb-6 text-gray-500 text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  );
};

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    otherTopic: '',
    message: '',
    gdpr: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
    }, 1200);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({ name: '', email: '', category: '', otherTopic: '', message: '', gdpr: false });
  };

  const inputClass =
    'w-full px-5 py-3.5 border border-gray-200 rounded-xl text-sm outline-none transition-all bg-gray-50 focus:bg-white focus:border-[#198379] focus:ring-3 focus:ring-[#198379]/8 placeholder-gray-400 text-gray-800';

  return (
    <div className="bg-white">

      {/* ── HERO ── */}
      <section className="pt-24 pb-20 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8"
            style={{ backgroundColor: BRAND_LIGHT, color: BRAND }}
          >
            <Heart className="w-3.5 h-3.5" />
            Jsme tu pro vás
          </div>
          <h1 className="text-5xl sm:text-[56px] font-bold text-gray-900 mb-6 leading-[1.1] tracking-tight">
            Kontaktujte&nbsp;nás
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed max-w-lg mx-auto">
            Napište nám ohledně kurzů, programů, technických problémů nebo spolupráce. Každá zpráva se počítá.
          </p>
        </div>
      </section>

      {/* ── MAIN GRID ── */}
      <section className="pb-28 px-6">
        <div className="mx-auto max-w-[1120px]">
          <div className="grid lg:grid-cols-2 gap-10 items-start">

            {/* ══ LEFT COLUMN ══ */}
            <div className="flex flex-col gap-4">

              {/* Contact cards */}
              <a
                href="mailto:podpora@deseyo.cz"
                className="group flex items-center gap-5 px-7 py-6 rounded-2xl transition-all duration-200"
                style={{
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                  backgroundColor: '#ffffff',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 20px rgba(25,131,121,0.12)';
                  (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = '#c8e6e2';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 1px 6px rgba(0,0,0,0.05)';
                  (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = '#f0f0f0';
                }}
              >
                <div
                  className="w-13 h-13 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: BRAND_LIGHT, width: '52px', height: '52px' }}
                >
                  <Mail className="w-5 h-5" style={{ color: BRAND }} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9ca3af' }}>
                    E-mail
                  </p>
                  <p className="font-semibold text-gray-900 text-[15px] group-hover:text-[#198379] transition-colors">
                    podpora@deseyo.cz
                  </p>
                </div>
              </a>

              <div
                className="flex items-center gap-5 px-7 py-6 rounded-2xl"
                style={{
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                  backgroundColor: '#ffffff',
                }}
              >
                <div
                  className="rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: BRAND_LIGHT, width: '52px', height: '52px' }}
                >
                  <Phone className="w-5 h-5" style={{ color: BRAND }} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9ca3af' }}>
                    Telefon
                  </p>
                  <p className="font-semibold text-gray-900 text-[15px]">+420 774 695 769</p>
                </div>
              </div>

              <div
                className="flex items-start gap-5 px-7 py-6 rounded-2xl"
                style={{
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                  backgroundColor: '#ffffff',
                }}
              >
                <div
                  className="rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: BRAND_LIGHT, width: '52px', height: '52px' }}
                >
                  <Users className="w-5 h-5" style={{ color: BRAND }} />
                </div>
                <div className="flex flex-col gap-3 pt-0.5">
                  <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>
                    Komunita & sociální sítě
                  </p>
                  <a
                    href="https://instagram.com/deseyo.cz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 group/ig"
                  >
                    <span
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover/ig:scale-110"
                      style={{ backgroundColor: BRAND_LIGHT }}
                    >
                      <Instagram className="w-3.5 h-3.5" style={{ color: BRAND }} />
                    </span>
                    <span className="text-sm font-medium text-gray-700 group-hover/ig:text-[#198379] transition-colors">
                      Instagram
                    </span>
                  </a>
                  <a
                    href="https://facebook.com/deseyo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 group/fb"
                  >
                    <span
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover/fb:scale-110"
                      style={{ backgroundColor: BRAND_LIGHT }}
                    >
                      <Facebook className="w-3.5 h-3.5" style={{ color: BRAND }} />
                    </span>
                    <span className="text-sm font-medium text-gray-700 group-hover/fb:text-[#198379] transition-colors">
                      Facebook
                    </span>
                  </a>
                </div>
              </div>

              {/* ── FAQ ── */}
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-[3px] h-5 rounded-full" style={{ backgroundColor: BRAND }} />
                  <h2 className="text-base font-bold text-gray-900 tracking-tight">Časté dotazy</h2>
                </div>
                <div className="flex flex-col gap-2.5">
                  {FAQ_ITEMS.map((item) => (
                    <FaqItem key={item.q} q={item.q} a={item.a} />
                  ))}
                </div>
              </div>
            </div>

            {/* ══ RIGHT COLUMN ══ */}
            <div className="lg:sticky lg:top-24">
              <div
                className="rounded-3xl p-10"
                style={{
                  border: '1px solid #ebebeb',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.07)',
                  backgroundColor: '#ffffff',
                }}
              >
                {submitted ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                      style={{ backgroundColor: BRAND_LIGHT }}
                    >
                      <CheckCircle className="w-8 h-8" style={{ color: BRAND }} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Zpráva odeslána</h3>
                    <p className="text-gray-500 max-w-xs leading-relaxed mb-8 text-sm">
                      Děkujeme za váš dotaz. Ozveme se vám co nejdříve.
                    </p>
                    <button
                      onClick={handleReset}
                      className="px-7 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                      style={{ backgroundColor: BRAND_LIGHT, color: BRAND }}
                    >
                      Napsat další zprávu
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-9">
                      <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Napište nám</h2>
                      <p className="text-gray-400 text-sm">Vyplňte formulář a ozveme se vám co nejdříve.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label htmlFor="name" className="text-sm font-semibold text-gray-700">
                            Jméno <span style={{ color: BRAND }}>*</span>
                          </label>
                          <input
                            type="text"
                            id="name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={inputClass}
                            placeholder="Vaše jméno"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label htmlFor="email" className="text-sm font-semibold text-gray-700">
                            E-mail <span style={{ color: BRAND }}>*</span>
                          </label>
                          <input
                            type="email"
                            id="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className={inputClass}
                            placeholder="vas@email.cz"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label htmlFor="category" className="text-sm font-semibold text-gray-700">
                          Kategorie dotazu <span style={{ color: BRAND }}>*</span>
                        </label>
                        <div className="relative">
                          <select
                            id="category"
                            required
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className={inputClass + ' appearance-none cursor-pointer'}
                          >
                            <option value="" disabled>Vyberte kategorii…</option>
                            <option value="technicke">Technický problém</option>
                            <option value="jine">Jiné</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                      </div>

                      {formData.category === 'jine' && (
                        <div className="flex flex-col gap-2">
                          <label htmlFor="otherTopic" className="text-sm font-semibold text-gray-700">
                            Čeho se váš dotaz týká? <span style={{ color: BRAND }}>*</span>
                          </label>
                          <input
                            type="text"
                            id="otherTopic"
                            required
                            value={formData.otherTopic}
                            onChange={(e) => setFormData({ ...formData, otherTopic: e.target.value })}
                            className={inputClass}
                            placeholder="Popište stručně téma vašeho dotazu…"
                          />
                        </div>
                      )}

                      <div className="flex flex-col gap-2">
                        <label htmlFor="message" className="text-sm font-semibold text-gray-700">
                          Zpráva <span style={{ color: BRAND }}>*</span>
                        </label>
                        <textarea
                          id="message"
                          required
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          rows={5}
                          className={inputClass + ' resize-none'}
                          placeholder="Popište váš dotaz co nejpodrobněji…"
                        />
                      </div>

                      {/* GDPR */}
                      <div
                        className="flex items-start gap-3.5 p-4 rounded-xl"
                        style={{ backgroundColor: '#f9fffe', border: '1px solid #e0f0ee' }}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <div
                            className="w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all duration-150"
                            style={{
                              borderColor: formData.gdpr ? BRAND : '#d1d5db',
                              backgroundColor: formData.gdpr ? BRAND : '#ffffff',
                            }}
                            onClick={() => setFormData({ ...formData, gdpr: !formData.gdpr })}
                            role="checkbox"
                            aria-checked={formData.gdpr}
                          >
                            {formData.gdpr && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <input
                            type="checkbox"
                            id="gdpr"
                            required
                            checked={formData.gdpr}
                            onChange={(e) => setFormData({ ...formData, gdpr: e.target.checked })}
                            className="sr-only"
                          />
                        </div>
                        <label
                          htmlFor="gdpr"
                          className="text-xs text-gray-500 leading-relaxed cursor-pointer select-none"
                          onClick={() => setFormData({ ...formData, gdpr: !formData.gdpr })}
                        >
                          Souhlasím se{' '}
                          <Link
                            to="/ochrana-osobnich-udaju"
                            className="font-semibold underline underline-offset-2 transition-colors"
                            style={{ color: BRAND }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            zpracováním osobních údajů
                          </Link>{' '}
                          za účelem odpovědi na můj dotaz. Vaše data jsou v bezpečí a nebudou sdílena s třetími stranami.{' '}
                          <span className="text-red-400">*</span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={sending || !formData.gdpr}
                        className="w-full py-4 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: BRAND,
                          boxShadow: formData.gdpr ? '0 4px 16px rgba(25,131,121,0.3)' : 'none',
                        }}
                        onMouseEnter={(e) => {
                          if (!sending && formData.gdpr) {
                            const btn = e.currentTarget as HTMLButtonElement;
                            btn.style.transform = 'translateY(-1px)';
                            btn.style.boxShadow = '0 6px 24px rgba(25,131,121,0.38)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          const btn = e.currentTarget as HTMLButtonElement;
                          btn.style.transform = 'translateY(0)';
                          btn.style.boxShadow = formData.gdpr ? '0 4px 16px rgba(25,131,121,0.3)' : 'none';
                        }}
                      >
                        {sending ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Odesílám…
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Odeslat zprávu
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-2 pt-1">
                        <Shield className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#9ca3af' }} />
                        <p className="text-xs text-gray-400">
                          Zabezpečeno SSL · Vaše údaje zpracováváme v souladu s GDPR
                        </p>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="px-6 pb-28">
        <div className="mx-auto max-w-[1120px]">
          <div
            className="relative rounded-3xl px-10 sm:px-16 py-14 overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-10"
            style={{ background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_MID} 100%)` }}
          >
            <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full blur-3xl opacity-[0.15] bg-white pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full blur-3xl opacity-[0.12] bg-white pointer-events-none" />

            <div className="relative z-10 text-center sm:text-left max-w-xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-5 bg-white/20 text-white">
                <Users className="w-3.5 h-3.5" />
                Komunita DESEYO
              </div>
              <h2 className="text-2xl sm:text-[28px] font-bold text-white mb-3 leading-tight tracking-tight">
                Přidejte se ke komunitě DESEYO
              </h2>
              <p className="text-white/75 text-sm sm:text-[15px] leading-relaxed">
                Tisíce žen na společné cestě k rovnováze, pohybu a osobnímu růstu. Začněte svou cestu ještě dnes — první krok je zdarma.
              </p>
            </div>

            <div className="relative z-10 flex-shrink-0">
              <Link
                to="/prihlaseni"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-sm transition-all duration-200 bg-white hover:scale-105"
                style={{ color: BRAND, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
              >
                Registrovat
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
