import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { BookOpen, Users, Clock, Heart, Star, Play, X } from 'lucide-react';

const MUX_PLAYBACK_ID = 'EhSTQq5o005fUeTIzHqJ8EdxOW70101U301GQXzM51Xiemg';

const founders = [
  {
    name: 'Anet',
    photo: '/images/anet_hero.png',
    playbackId: MUX_PLAYBACK_ID,
  },
  {
    name: 'Simča',
    photo: '/images/simca_hero.png',
    playbackId: MUX_PLAYBACK_ID,
  },
  {
    name: 'Paja',
    photo: '/images/paja_hero.png',
    playbackId: MUX_PLAYBACK_ID,
  },
];

export const Homepage = () => {
  const [displayText, setDisplayText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const words = ['Vnímej', 'Tvoř', 'Změň'];
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [hoveredFounder, setHoveredFounder] = useState<number | null>(null);

  useEffect(() => {
    const currentWord = words[wordIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentWord.length) {
          setDisplayText(currentWord.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 4000);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, isDeleting ? 50 : 150);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, wordIndex]);

  useEffect(() => {
    const root = document.documentElement;
    const prev = root.getAttribute('data-theme');
    root.setAttribute('data-theme', 'light');

    // ThemeProvider's own effect can fire after this one on a fresh page
    // load and re-apply the stored (possibly dark) theme, so keep forcing
    // light for as long as this page is mounted.
    const observer = new MutationObserver(() => {
      if (root.getAttribute('data-theme') !== 'light') root.setAttribute('data-theme', 'light');
    });
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      observer.disconnect();
      if (prev) root.setAttribute('data-theme', prev);
    };
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Video modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              src={`https://player.mux.com/${activeVideo}?autoplay=1`}
              style={{ width: '100%', border: 'none', aspectRatio: '16/9' }}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
              allowFullScreen
            />
          </div>
        </div>
      )}

      <section className="relative bg-[var(--bg-card)] pt-16 sm:pt-20 pb-24 sm:pb-32 md:pb-40 px-4 overflow-hidden">
        <div className="absolute top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ backgroundColor: 'var(--primary)' }} />
        <div className="absolute bottom-0 -right-32 w-80 h-80 rounded-full blur-3xl opacity-10" style={{ backgroundColor: 'var(--primary)' }} />

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="flex flex-col justify-center">
              <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-normal mb-6 leading-tight text-[var(--text)]">
                  <span style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 50%, var(--primary-dark) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    {displayText || '\u00A0'}
                  </span>
                  <br />
                  <span className="text-[var(--text)]">život</span> <span style={{ color: 'var(--primary)' }}>ve skutečný dar.</span>
                </h1>
              </div>

              <p className="text-lg sm:text-xl text-[var(--text-muted)] mb-8 max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                Online platforma pro jógu, meditaci a osobní rozvoj. Objevte sílu vědomé přítomnosti a transformujte svůj život.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                <Link
                  to="/prihlaseni"
                  className="px-8 py-4 text-lg font-normal rounded-2xl transition-all hover:scale-105 shadow-lg text-white text-center"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  Registrovat
                </Link>
                <button
                  className="px-8 py-4 text-lg font-normal rounded-2xl border-2 transition-all hover:bg-[var(--primary-soft)] flex items-center justify-center gap-2 text-[var(--text)]"
                  style={{ borderColor: 'var(--primary)' }}
                >
                  <Play className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                  Podívat se na ukázku
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8 text-sm animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600" />
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600" />
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600" />
                  </div>
                  <span className="text-[var(--text-muted)] font-normal">1200+ aktivních uživatelů</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4" style={{ color: '#FCD34D', fill: '#FCD34D' }} />
                    ))}
                  </div>
                  <span className="text-[var(--text-muted)] font-normal">4.9 hodnocení</span>
                </div>
              </div>
            </div>

            {/* Founder circles */}
            <div className="animate-in fade-in slide-in-from-right-4 duration-1000 delay-200 flex items-center justify-center pt-4 pb-8 lg:pb-4">
              <div className="relative flex items-end justify-center">

                {/* Left founder */}
                <button
                  onClick={() => setActiveVideo(founders[0].playbackId)}
                  onMouseEnter={() => setHoveredFounder(0)}
                  onMouseLeave={() => setHoveredFounder(null)}
                  className="relative group flex-shrink-0 -mr-6 sm:-mr-8 lg:-mr-12"
                  style={{ zIndex: hoveredFounder === 0 ? 30 : 10 }}
                  aria-label={founders[0].name}
                >
                  <div className="relative w-28 h-28 sm:w-40 sm:h-40 lg:w-56 lg:h-56 rounded-full overflow-hidden ring-4 ring-white shadow-2xl transition-transform duration-300 group-hover:scale-105">
                    <img src={founders[0].photo} alt={founders[0].name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-9 h-9 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-[var(--bg-card)]/90 flex items-center justify-center shadow-lg">
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ml-0.5" style={{ color: 'var(--primary)' }} />
                      </div>
                    </div>
                  </div>
                </button>

                {/* Center founder — largest, elevated */}
                <button
                  onClick={() => setActiveVideo(founders[1].playbackId)}
                  onMouseEnter={() => setHoveredFounder(1)}
                  onMouseLeave={() => setHoveredFounder(null)}
                  className="relative group flex-shrink-0 mb-5 sm:mb-8 lg:mb-12"
                  style={{ zIndex: hoveredFounder === 1 ? 30 : 20 }}
                  aria-label={founders[1].name}
                >
                  <div
                    className="relative w-36 h-36 sm:w-52 sm:h-52 lg:w-72 lg:h-72 rounded-full overflow-hidden shadow-2xl transition-transform duration-300 group-hover:scale-105"
                    style={{ outline: '4px solid var(--primary)' }}
                  >
                    <img src={founders[1].photo} alt={founders[1].name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-[var(--bg-card)]/90 flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 ml-0.5" style={{ color: 'var(--primary)' }} />
                      </div>
                    </div>
                  </div>
                </button>

                {/* Right founder */}
                <button
                  onClick={() => setActiveVideo(founders[2].playbackId)}
                  onMouseEnter={() => setHoveredFounder(2)}
                  onMouseLeave={() => setHoveredFounder(null)}
                  className="relative group flex-shrink-0 -ml-6 sm:-ml-8 lg:-ml-12"
                  style={{ zIndex: hoveredFounder === 2 ? 30 : 10 }}
                  aria-label={founders[2].name}
                >
                  <div className="relative w-28 h-28 sm:w-40 sm:h-40 lg:w-56 lg:h-56 rounded-full overflow-hidden ring-4 ring-white shadow-2xl transition-transform duration-300 group-hover:scale-105">
                    <img src={founders[2].photo} alt={founders[2].name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-9 h-9 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-[var(--bg-card)]/90 flex items-center justify-center shadow-lg">
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ml-0.5" style={{ color: 'var(--primary)' }} />
                      </div>
                    </div>
                  </div>
                </button>


              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="kurzy" className="py-16 sm:py-20 px-4 bg-[var(--bg-card)]">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl sm:text-4xl font-normal text-center text-[var(--text)] mb-12 sm:mb-16">
            Vyberte si svůj plán
          </h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="border border-[var(--border)] rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1 bg-[var(--bg-card)]">
              <h3 className="text-2xl font-normal text-[var(--text)] mb-2">Basic</h3>
              <div className="text-4xl font-normal text-[var(--text)] mb-4">
                Zdarma
              </div>
              <p className="text-[var(--text-muted)] mb-6">
                Omezený přístup k základním kurzům
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-[var(--text-muted)]">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary-soft)' }}>
                    <span style={{ color: 'var(--primary)' }} className="text-xs">✓</span>
                  </div>
                  Vybrané bezplatné lekce
                </li>
                <li className="flex items-center gap-2 text-[var(--text-muted)]">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary-soft)' }}>
                    <span style={{ color: 'var(--primary)' }} className="text-xs">✓</span>
                  </div>
                  Přístup ke komunitě
                </li>
                <li className="flex items-center gap-2 text-[var(--text-muted)]">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary-soft)' }}>
                    <span style={{ color: 'var(--primary)' }} className="text-xs">✓</span>
                  </div>
                  Sledování pokroku
                </li>
              </ul>
              <Link
                to="/prihlaseni"
                className="block w-full py-3 text-center border-2 font-normal rounded-xl hover:bg-[var(--primary-soft)] transition-colors"
                style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
              >
                Registrovat
              </Link>
            </div>

            <div className="border-2 rounded-2xl p-8 hover:shadow-2xl transition-all hover:-translate-y-1 relative bg-[var(--bg-card)]" style={{ borderColor: 'var(--primary)' }}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-white px-4 py-1 rounded-full text-sm font-normal flex items-center gap-1" style={{ backgroundColor: 'var(--primary)' }}>
                <Star className="w-4 h-4" />
                Nejoblíbenější
              </div>
              <h3 className="text-2xl font-normal text-[var(--text)] mb-2">Premium</h3>
              <div className="text-4xl font-normal text-[var(--text)] mb-4">
                299 Kč
                <span className="text-lg font-normal text-[var(--text-muted)]"> / měsíc</span>
              </div>
              <p className="text-[var(--text-muted)] mb-6">
                Přístup ke všem kurzům a komunitě
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-[var(--text-muted)]">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                    <span className="text-white text-xs">✓</span>
                  </div>
                  Všechny kurzy a lekce
                </li>
                <li className="flex items-center gap-2 text-[var(--text-muted)]">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                    <span className="text-white text-xs">✓</span>
                  </div>
                  Neomezený přístup
                </li>
                <li className="flex items-center gap-2 text-[var(--text-muted)]">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                    <span className="text-white text-xs">✓</span>
                  </div>
                  Exkluzivní komunita
                </li>
                <li className="flex items-center gap-2 text-[var(--text-muted)]">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                    <span className="text-white text-xs">✓</span>
                  </div>
                  Nové lekce každý týden
                </li>
              </ul>
              <Link
                to="/prihlaseni"
                className="block w-full py-3 text-center text-white font-normal rounded-xl hover:opacity-90 transition-all"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                Začít Premium
              </Link>
            </div>

            <div className="border border-[var(--border)] rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1 bg-[var(--bg-card)]">
              <h3 className="text-2xl font-normal text-[var(--text)] mb-2">Legend</h3>
              <div className="text-4xl font-normal text-[var(--text)] mb-4">
                499 Kč
                <span className="text-lg font-normal text-[var(--text-muted)]"> / měsíc</span>
              </div>
              <p className="text-[var(--text-muted)] mb-6">
                Vše z Premium + osobní mentoring
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-[var(--text-muted)]">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary-soft)' }}>
                    <span style={{ color: 'var(--primary)' }} className="text-xs">✓</span>
                  </div>
                  Vše z Premium
                </li>
                <li className="flex items-center gap-2 text-[var(--text-muted)]">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary-soft)' }}>
                    <span style={{ color: 'var(--primary)' }} className="text-xs">✓</span>
                  </div>
                  Osobní mentoring
                </li>
                <li className="flex items-center gap-2 text-[var(--text-muted)]">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary-soft)' }}>
                    <span style={{ color: 'var(--primary)' }} className="text-xs">✓</span>
                  </div>
                  1:1 konzultace
                </li>
                <li className="flex items-center gap-2 text-[var(--text-muted)]">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary-soft)' }}>
                    <span style={{ color: 'var(--primary)' }} className="text-xs">✓</span>
                  </div>
                  Individuální plán
                </li>
              </ul>
              <Link
                to="/prihlaseni"
                className="block w-full py-3 text-center border-2 font-normal rounded-xl hover:bg-[var(--primary-soft)] transition-colors"
                style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
              >
                Začít Legend
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="programy" className="py-16 sm:py-20 px-4 bg-[var(--bg-card)]">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl sm:text-4xl font-normal text-center text-[var(--text)] mb-12 sm:mb-16">
            Proč Deseyo?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--primary-soft)' }}>
                <BookOpen className="w-8 h-8" style={{ color: 'var(--primary)' }} />
              </div>
              <h3 className="text-xl font-normal text-[var(--text)] mb-2">
                Kvalitní lekce
              </h3>
              <p className="text-[var(--text-muted)]">
                Odborně připravené kurzy pro všechny úrovně
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--primary-soft)' }}>
                <Users className="w-8 h-8" style={{ color: 'var(--primary)' }} />
              </div>
              <h3 className="text-xl font-normal text-[var(--text)] mb-2">
                Komunita
              </h3>
              <p className="text-[var(--text-muted)]">
                Spojte se s lidmi na stejné cestě
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--primary-soft)' }}>
                <Clock className="w-8 h-8" style={{ color: 'var(--primary)' }} />
              </div>
              <h3 className="text-xl font-normal text-[var(--text)] mb-2">
                Flexibilita
              </h3>
              <p className="text-[var(--text-muted)]">
                Cvičte kdykoliv a kdekoliv vám to vyhovuje
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--primary-soft)' }}>
                <Heart className="w-8 h-8" style={{ color: 'var(--primary)' }} />
              </div>
              <h3 className="text-xl font-normal text-[var(--text)] mb-2">
                Podpora
              </h3>
              <p className="text-[var(--text-muted)]">
                Jsme tu pro vás na vaší cestě
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="o-nas" className="py-16 sm:py-20 px-4 bg-[var(--bg-card)]">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-normal mb-6 text-[var(--text)]">
            Začněte svou cestu ještě dnes
          </h2>
          <p className="text-lg sm:text-xl mb-8 text-[var(--text-muted)]">
            Připojte se k tisícům lidí, kteří již objevili sílu vnitřní rovnováhy
          </p>
          <Link
            to="/prihlaseni"
            className="inline-block px-8 py-4 text-lg font-normal rounded-xl transition-all hover:scale-105 shadow-xl hover:opacity-90"
            style={{ backgroundColor: 'var(--primary)', color: 'white' }}
          >
            Registrovat se zdarma
          </Link>
        </div>
      </section>
    </div>
  );
};
