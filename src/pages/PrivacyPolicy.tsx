import { ContentLayout } from '../components/ContentLayout';

export const PrivacyPolicy = () => {
  return (
    <ContentLayout title="Zásady ochrany osobních údajů">
      <div>
            <p className="text-[var(--text-muted)] mb-6">
              Poslední aktualizace: 13. října 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-normal text-[var(--text)] mb-4">
                1. Úvod
              </h2>
              <p className="text-[var(--text-muted)] leading-relaxed mb-4">
                Vítejte na platformě Deseyo. Respektujeme vaše soukromí a zavazujeme se chránit vaše osobní údaje.
                Tyto zásady popisují, jak shromažďujeme, používáme a chráníme vaše informace.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-normal text-[var(--text)] mb-4">
                2. Jaké údaje shromažďujeme
              </h2>
              <ul className="list-disc pl-6 text-[var(--text-muted)] space-y-2">
                <li>Jméno a emailová adresa při registraci</li>
                <li>Informace o vašem předplatném a platbách</li>
                <li>Pokrok v kurzech a dokončené lekce</li>
                <li>Příspěvky a komentáře v komunitě</li>
                <li>Technické údaje o vašem zařízení a prohlížeči</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-normal text-[var(--text)] mb-4">
                3. Jak používáme vaše údaje
              </h2>
              <ul className="list-disc pl-6 text-[var(--text-muted)] space-y-2">
                <li>K poskytování a zlepšování našich služeb</li>
                <li>K personalizaci vašeho zážitku</li>
                <li>K zasílání důležitých oznámení o službách</li>
                <li>K vyřizování plateb a správě předplatného</li>
                <li>K ochraně proti podvodům a zneužití</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-normal text-[var(--text)] mb-4">
                4. Sdílení údajů
              </h2>
              <p className="text-[var(--text-muted)] leading-relaxed mb-4">
                Vaše osobní údaje neprodáváme třetím stranám. Můžeme je sdílet pouze s:
              </p>
              <ul className="list-disc pl-6 text-[var(--text-muted)] space-y-2">
                <li>Poskytovateli platebních služeb pro zpracování plateb</li>
                <li>Technickými poskytovateli pro provoz platformy</li>
                <li>Orgány činnými v trestním řízení, pokud to vyžaduje zákon</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-normal text-[var(--text)] mb-4">
                5. Vaše práva
              </h2>
              <p className="text-[var(--text-muted)] leading-relaxed mb-4">
                Máte právo:
              </p>
              <ul className="list-disc pl-6 text-[var(--text-muted)] space-y-2">
                <li>Přistupovat k vašim osobním údajům</li>
                <li>Opravit nesprávné údaje</li>
                <li>Požádat o vymazání vašich údajů</li>
                <li>Omezit zpracování vašich údajů</li>
                <li>Přenést vaše údaje k jinému poskytovateli</li>
                <li>Odvolat souhlas se zpracováním</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-normal text-[var(--text)] mb-4">
                6. Cookies
              </h2>
              <p className="text-[var(--text-muted)] leading-relaxed mb-4">
                Používáme cookies k zajištění správné funkčnosti platformy, k personalizaci obsahu
                a k analýze návštěvnosti. Většinu cookies můžete odmítnout v nastavení svého prohlížeče.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-normal text-[var(--text)] mb-4">
                7. Zabezpečení
              </h2>
              <p className="text-[var(--text-muted)] leading-relaxed mb-4">
                Používáme moderní technologie k ochraně vašich údajů, včetně šifrování,
                zabezpečených serverů a pravidelných bezpečnostních auditů.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-normal text-[var(--text)] mb-4">
                8. Kontakt
              </h2>
              <p className="text-[var(--text-muted)] leading-relaxed mb-4">
                Máte-li jakékoli otázky týkající se těchto zásad nebo zpracování vašich údajů,
                kontaktujte nás na: podpora@deseyo.cz
              </p>
            </section>
      </div>
    </ContentLayout>
  );
};
