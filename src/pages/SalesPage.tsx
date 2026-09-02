import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Clock,
  Heart,
  Moon,
  Sun,
  Smile,
  Activity,
  Check,
  Star,
  ArrowRight,
  Shield,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

const faceImg =
  'https://images.pexels.com/photos/5927734/pexels-photo-5927734.jpeg?auto=compress&cs=tinysrgb&w=800';
const breathImg =
  'https://images.pexels.com/photos/6958256/pexels-photo-6958256.jpeg?auto=compress&cs=tinysrgb&w=800';
const yogaImg =
  'https://images.pexels.com/photos/10223023/pexels-photo-10223023.jpeg?auto=compress&cs=tinysrgb&w=800';

const teamPhotos = [
  'https://images.pexels.com/photos/4498516/pexels-photo-4498516.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/6739125/pexels-photo-6739125.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/6582577/pexels-photo-6582577.jpeg?auto=compress&cs=tinysrgb&w=400',
];

const benefits = [
  { icon: Clock, title: 'Stačí 10–30 minut denně', desc: 'Krátké lekce, které se vejdou i do toho nejnabitějšího dne.' },
  { icon: Sparkles, title: 'Jednoduchý systém krok za krokem', desc: 'Víme přesně, co máte dělat dnes, zítra a pozítří. Nemusíte nic vymýšlet.' },
  { icon: Check, title: 'Bez předchozí zkušenosti', desc: 'Začnete tam, kde jste. Vše je vysvětleno jednoduše a srozumitelně.' },
  { icon: Heart, title: 'Tělo + obličej + dech', desc: 'Jediný program, který propojuje fyzické cvičení, obličejovou jógu a dechové techniky.' },
  { icon: ArrowRight, title: 'Vedený onboarding', desc: 'Prvních 7 dní vás provedeme krok za krokem, abyste věděli přesně, co a proč děláte.' },
];

const transformations = [
  { icon: Activity, title: 'Méně napětí v těle', desc: 'Postupně uvolníte ztuhlá záda, krk i ramena a budete se cítit lehčeji.' },
  { icon: Moon, title: 'Klidnější spánek', desc: 'Díky dechovým technikám usnete snáze a ráno se probudíte opravdu odpočatí.' },
  { icon: Sun, title: 'Více energie', desc: 'Pravidelný pohyb a dech vrátí tělu vitální energii, kterou jste ztratili.' },
  { icon: Smile, title: 'Lepší pocit ze sebe', desc: 'Uvolněnější obličej i tělo vám vrátí pocit, že o sebe stojíte a že to zvládáte.' },
];

const testimonials = [
  {
    name: 'Marie K.',
    text: 'Po měsíci už necítím tu bolest mezi lopatkami. Stačí mi 15 minut ráno a cítím se jako nová.',
    role: 'Účetní, 42 let',
  },
  {
    name: 'Petra D.',
    text: 'Konečně něco, co zvládnu i s dětmi a plným kalendářem. Vůbec mi to nepřipadá jako povinnost.',
    role: 'Maminka, 35 let',
  },
  {
    name: 'Lucie B.',
    text: 'Face yoga i dechové techniky v jednom místě — přesně to jsem hledala. Obličej vypadá svěžeji a spím mnohem lépe.',
    role: 'Marketérka, 38 let',
  },
];

const CTAButton = ({ label = 'Začít dnes', large = false }: { label?: string; large?: boolean }) => (
  <Link
    to="/prihlaseni"
    className={`inline-flex items-center gap-2 ${large ? 'px-10 py-5 text-xl' : 'px-8 py-4 text-lg'} font-normal rounded-2xl transition-all hover:scale-105 shadow-lg text-white`}
    style={{ backgroundColor: 'var(--primary)' }}
  >
    {label}
    <ChevronRight className={large ? 'w-6 h-6' : 'w-5 h-5'} />
  </Link>
);

export const SalesPage = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const prev = root.getAttribute('data-theme');
    root.setAttribute('data-theme', 'light');
    const observer = new MutationObserver(() => {
      if (root.getAttribute('data-theme') !== 'light') root.setAttribute('data-theme', 'light');
    });
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      if (prev) root.setAttribute('data-theme', prev);
    };
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Sticky mini-nav with CTA */}
      <div
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled ? 'shadow-md' : ''
        }`}
        style={{
          backgroundColor: scrolled ? 'var(--bg-card)' : 'transparent',
          borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        }}
      >
        <div className="container mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/images/logo.png" alt="Deseyo" className="h-8 object-contain" />
          </Link>
          <Link
            to="/prihlaseni"
            className="px-5 py-2.5 rounded-xl text-white text-sm font-normal transition-all hover:scale-105"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            Vyzkoušet 7 dní
          </Link>
        </div>
      </div>

      {/* HERO — 5-second message */}
      <section className="relative pt-28 pb-16 px-4 overflow-hidden">
        <div className="absolute top-20 -left-40 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ backgroundColor: 'var(--primary)' }} />
        <div className="absolute bottom-0 -right-32 w-80 h-80 rounded-full blur-3xl opacity-10" style={{ backgroundColor: 'var(--primary)' }} />
        <div className="container mx-auto max-w-4xl relative z-10 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-normal mb-5 leading-tight text-[var(--text)] max-w-2xl mx-auto">
            Už žádné tělesné napětí
          </h1>
          <p className="text-lg sm:text-xl text-[var(--text-muted)] mb-8 max-w-2xl mx-auto leading-relaxed">
            Deseyo tě krok za krokem provede jednoduchým denním rituálem těla, obličeje a dechu. Stačí 10–30 minut denně — bez zkušeností, bez tlaku.
          </p>
          <div className="mb-12">
            <CTAButton label="Začít jednoduše" />
          </div>
        </div>
        <div className="relative mx-auto max-w-5xl px-4">
          <img
            src="/images/hero_ukazka.png"
            alt="Ukázka aplikace Deseyo"
            className="w-full h-auto rounded-2xl"
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-2xl pointer-events-none"
            style={{ background: 'linear-gradient(to top, white 0%, rgba(255,255,255,0) 100%)' }}
          />
        </div>
      </section>

      {/* BRIDGE — one-line summary of what Deseyo is */}
      <section className="pb-16 px-4 text-center">
        <p className="text-lg sm:text-xl font-normal text-[var(--text)] mb-4 max-w-xl mx-auto">
          Deseyo tě provede jednoduchým rituálem — den za dnem, krok za krokem.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {['Tělo', 'Obličej', 'Dech'].map((label) => (
            <span
              key={label}
              className="px-4 py-1.5 rounded-full text-sm font-normal"
              style={{ backgroundColor: 'var(--primary-soft)', color: 'var(--primary-dark)' }}
            >
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* SOLUTION — what Deseyo is */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-medium tracking-wide uppercase mb-4" style={{ color: 'var(--primary)' }}>
                Co je Deseyo
              </p>
              <h2 className="text-3xl sm:text-4xl font-normal text-[var(--text)] mb-6 leading-tight">
                Provedeme vás krok za krokem
              </h2>
              <p className="text-lg text-[var(--text-muted)] mb-6 leading-relaxed">
                Deseyo je online program, který vás každý den provede krátkou lekcí. Střídáme fyzickou jógu pro tělo, obličejovou jógu pro uvolnění obličeje a dechové techniky pro klidnou mysl.
              </p>
              <p className="text-lg text-[var(--text-muted)] mb-8 leading-relaxed">
                Nemusíte nic vymýšlet. Otevřete aplikaci, pustíte dnešní lekci a za 15 minut jste hotovi. Prvních 7 dní vás navíc provedeme onboardingem, abyste přesně věděli, co a proč děláte.
              </p>
              <CTAButton label="Začít dnes" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <img src={yogaImg} alt="Fyzio jóga" className="w-full h-48 object-cover" />
                <div className="p-4 bg-[var(--bg-card)]">
                  <p className="font-medium text-[var(--text)] text-sm">Fyzio jóga</p>
                  <p className="text-xs text-[var(--text-muted)]">Pro uvolnění zad a krku</p>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg mt-8">
                <img src={faceImg} alt="Face jóga" className="w-full h-48 object-cover" />
                <div className="p-4 bg-[var(--bg-card)]">
                  <p className="font-medium text-[var(--text)] text-sm">Face jóga</p>
                  <p className="text-xs text-[var(--text-muted)]">Pro uvolněný obličej</p>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <img src={breathImg} alt="Dechové techniky" className="w-full h-48 object-cover" />
                <div className="p-4 bg-[var(--bg-card)]">
                  <p className="font-medium text-[var(--text)] text-sm">Dechové techniky</p>
                  <p className="text-xs text-[var(--text-muted)]">Pro klid a lepší spánek</p>
                </div>
              </div>
              <div className="rounded-2xl p-6 flex flex-col items-center justify-center text-center" style={{ backgroundColor: 'var(--primary-soft)' }}>
                <p className="text-3xl font-normal text-[var(--text)] mb-1">3 v 1</p>
                <p className="text-sm text-[var(--text-muted)]">Tělo, obličej i dech v jednom programu</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-20 px-4" style={{ backgroundColor: 'var(--bg-elevated)' }}>
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl sm:text-4xl font-normal text-center text-[var(--text)] mb-4">
            Proč to zvládnete s Deseyo
          </h2>
          <p className="text-lg text-[var(--text-muted)] text-center mb-12 max-w-2xl mx-auto">
            Vše je navrženo tak, aby se to vešlo do vašeho dne — i toho nejnabitějšího.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl p-6 border transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--primary-soft)' }}>
                  <b.icon className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                </div>
                <h3 className="text-lg font-normal text-[var(--text)] mb-2">{b.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT PREVIEW */}
      <section id="ukazka" className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl sm:text-4xl font-normal text-center text-[var(--text)] mb-4">
            Podívejte se, jak to funguje
          </h2>
          <p className="text-lg text-[var(--text-muted)] text-center mb-12 max-w-2xl mx-auto">
            Otevřete lekci, cvičíte podle videa, hotovo. Žádné plánování, žádné hledání.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Otevřete dnešní lekci', desc: 'Aplikace vám řekne, co máte dělat dnes. Nemusíte nic řešit.' },
              { step: '2', title: 'Cvičíte 15–30 minut', desc: 'Pustíte video a jdete. Vše je vysvětleno krok za krokem.' },
              { step: '3', title: 'Cítíte úlevu', desc: 'Postupně uvolníte napětí, získáte energii a lépe spíte.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-normal" style={{ backgroundColor: 'var(--primary)' }}>
                  {s.step}
                </div>
                <h3 className="text-lg font-normal text-[var(--text)] mb-2">{s.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <CTAButton label="Vyzkoušet 7 dní" large />
          </div>
        </div>
      </section>

      {/* TRANSFORMATION / RESULTS */}
      <section className="py-20 px-4" style={{ backgroundColor: 'var(--bg-elevated)' }}>
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl sm:text-4xl font-normal text-center text-[var(--text)] mb-4">
            Co získáte
          </h2>
          <p className="text-lg text-[var(--text-muted)] text-center mb-12 max-w-2xl mx-auto">
            Cíle, ke kterým vás Deseyo krok za krokem dovede.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {transformations.map((t) => (
              <div
                key={t.title}
                className="rounded-2xl p-6 text-center border transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--primary-soft)' }}>
                  <t.icon className="w-7 h-7" style={{ color: 'var(--primary)' }} />
                </div>
                <h3 className="text-base font-medium text-[var(--text)] mb-2">{t.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST — team */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl sm:text-4xl font-normal text-center text-[var(--text)] mb-4">
            Kdo za Deseyo stojí
          </h2>
          <p className="text-lg text-[var(--text-muted)] text-center mb-12 max-w-2xl mx-auto">
            Deseyo tvoří tým fyzioterapeutů a lektorek jógy s lety praxe.
          </p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { name: 'Bc. Klára Nováková', role: 'Fyzioterapeutka', photo: teamPhotos[0] },
              { name: 'Veronika Svobodová', role: 'Lektorka jógy', photo: teamPhotos[1] },
              { name: 'Mgr. Hana Dvořáková', role: 'Obličejová jóga', photo: teamPhotos[2] },
            ].map((m) => (
              <div key={m.name} className="text-center">
                <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 shadow-lg ring-4 ring-white">
                  <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-lg font-normal text-[var(--text)] mb-1">{m.name}</h3>
                <p className="text-sm text-[var(--text-muted)]">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-4" style={{ backgroundColor: 'var(--bg-elevated)' }}>
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl sm:text-4xl font-normal text-center text-[var(--text)] mb-12">
            Co říkají uživatelky
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl p-6 border"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4" style={{ color: '#FCD34D', fill: '#FCD34D' }} />
                  ))}
                </div>
                <p className="text-[var(--text-muted)] leading-relaxed mb-4 italic">"{t.text}"</p>
                <div>
                  <p className="font-medium text-[var(--text)] text-sm">{t.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-normal text-[var(--text)] mb-4">
            Začněte ještě dnes
          </h2>
          <p className="text-lg text-[var(--text-muted)] mb-8 max-w-xl mx-auto">
            Vyzkoušejte Deseyo 7 dní a uvidíte, jak se vaše tělo a mysl mění. Zrušit můžete kdykoliv.
          </p>
          <div className="inline-block rounded-2xl p-8 border-2 mb-8" style={{ borderColor: 'var(--primary)', backgroundColor: 'var(--primary-soft)' }}>
            <p className="text-sm text-[var(--text-muted)] mb-2">Od</p>
            <p className="text-5xl font-normal text-[var(--text)] mb-2">
              199 Kč<span className="text-lg text-[var(--text-muted)]"> / měsíc</span>
            </p>
            <p className="text-sm text-[var(--text-muted)]">Plný přístup ke všem lekcím, onboarding i komunita</p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <CTAButton label="Začít jednoduše" large />
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <Shield className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              Zabezpečená platba přes GoPay · Zrušit můžete kdykoliv
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 px-4" style={{ backgroundColor: 'var(--primary)' }}>
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-normal text-white mb-4">
            Prvních 15 minut můžete změnit vše
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            Otevřete dnešní lekci, uvolníte napětí v zádech a krku a ucítíte úlevu. Začněte dnes.
          </p>
          <Link
            to="/prihlaseni"
            className="inline-flex items-center gap-2 px-10 py-5 text-xl font-normal rounded-2xl bg-white transition-all hover:scale-105 shadow-xl"
            style={{ color: 'var(--primary-dark)' }}
          >
            Začít dnes
            <ChevronRight className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-4" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <img src="/images/logo.png" alt="Deseyo" className="h-8 object-contain" />
            <div className="flex gap-6 text-sm text-[var(--text-muted)]">
              <Link to="/zasady-ochrany-osobnich-udaju" className="hover:text-[var(--text)] transition-colors">Ochrana osobních údajů</Link>
              <Link to="/podminky-uzivani" className="hover:text-[var(--text)] transition-colors">Podmínky užívání</Link>
              <Link to="/obchodni-podminky" className="hover:text-[var(--text)] transition-colors">Obchodní podmínky</Link>
              <Link to="/kontakt" className="hover:text-[var(--text)] transition-colors">Kontakt</Link>
            </div>
          </div>
          <p className="text-center text-xs text-[var(--text-muted)] mt-6">
            © {new Date().getFullYear()} Deseyo. Všechna práva vyhrazena.
          </p>
        </div>
      </footer>
    </div>
  );
};