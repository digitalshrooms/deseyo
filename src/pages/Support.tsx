import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: 'Jak mohu zmenit svuj plan?',
    answer: 'Svuj plan muzete zmenit v sekci Muj prostor.',
    category: 'Plany'
  },
  {
    question: 'Co je to MED?',
    answer: 'MED (Minimalni efektivni davka) je doporucene minimum 3 dni pohybu tydne.',
    category: 'Plany'
  },
  {
    question: 'Jak mohu sledovat svuj pokrok?',
    answer: 'Vas pokrok muzete sledovat v sekci Moje cesta.',
    category: 'Pokrok'
  },
];

export const Support = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#191b1f' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <HelpCircle className="w-8 h-8" style={{ color: '#A2B6B9' }} />
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Podpora & FAQ
            </h1>
          </div>
          <p className="text-gray-300 text-base sm:text-lg">
            Odpovedi na caste otazky
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: '#2c2e33' }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-6 flex items-center justify-between hover:opacity-80 transition-opacity text-left"
              >
                <h3 className="text-lg font-semibold text-white pr-4">
                  {faq.question}
                </h3>
                {openIndex === index ? (
                  <ChevronUp className="w-6 h-6 flex-shrink-0" style={{ color: '#A2B6B9' }} />
                ) : (
                  <ChevronDown className="w-6 h-6 flex-shrink-0" style={{ color: '#A2B6B9' }} />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6">
                  <p className="text-gray-300">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl p-6" style={{ backgroundColor: '#2c2e33' }}>
          <h2 className="text-xl font-bold text-white mb-3">Kontakt</h2>
          <p className="text-gray-300 mb-4">
            Potrebujete dalsi pomoc? Kontaktujte nas.
          </p>
          <p className="text-gray-400">
            Email: podpora@deseyo.cz
          </p>
        </div>
      </div>
    </div>
  );
};
