import { ContentLayout } from '../components/ContentLayout';

export const TermsOfUse = () => {
  return (
    <ContentLayout title="Podmínky užívání">
      <div>
            <p className="text-[var(--text-muted)] mb-6">
              Poslední aktualizace: 13. října 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-normal text-[var(--text)] mb-4">
                1. Přijetí podmínek
              </h2>
              <p className="text-[var(--text-muted)] leading-relaxed mb-4">
                Používáním platformy Deseyo souhlasíte s těmito podmínkami užívání.
                Pokud s nimi nesouhlasíte, nepoužívejte prosím naše služby.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-normal text-[var(--text)] mb-4">
                2. Popis služeb
              </h2>
              <p className="text-[var(--text-muted)] leading-relaxed mb-4">
                Deseyo poskytuje online platformu pro meditaci, jógu a osobní rozvoj.
                Nabízíme různé úrovně předplatného s přístupem k videolekcím, komunitě a dalším funkcím.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-normal text-[var(--text)] mb-4">
                3. Registrace účtu
              </h2>
              <ul className="list-disc pl-6 text-[var(--text-muted)] space-y-2">
                <li>Musíte poskytnout přesné a aktuální informace</li>
                <li>Jste odpovědní za zachování bezpečnosti vašeho účtu</li>
                <li>Musíte být starší 18 let nebo mít souhlas zákonného zástupce</li>
                <li>Jeden účet může používat pouze jedna osoba</li>
                <li>Nesmíte sdílet své přihlašovací údaje s jinými osobami</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-normal text-[var(--text)] mb-4">
                4. Předplatné a platby
              </h2>
              <p className="text-[var(--text-muted)] leading-relaxed mb-4">
                <strong>Typy předplatného:</strong>
              </p>
              <ul className="list-disc pl-6 text-[var(--text-muted)] space-y-2 mb-4">
                <li><strong>Basic:</strong> Omezený přístup k vybraným kategoriím</li>
                <li><strong>Premium:</strong> Plný přístup ke všem kurzům</li>
                <li><strong>Legend:</strong> Veškerý obsah včetně bonusových lekcí</li>
              </ul>
              <p className="text-[var(--text-muted)] leading-relaxed mb-4">
                Předplatné se automaticky obnovuje, dokud jej nezrušíte. Zrušení lze provést
                kdykoliv v nastavení účtu. Vrácení peněz je možné do 14 dnů od nákupu.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-normal text-[var(--text)] mb-4">
                5. Chování v komunitě
              </h2>
              <p className="text-[var(--text-muted)] leading-relaxed mb-4">
                V komunitě je zakázáno:
              </p>
              <ul className="list-disc pl-6 text-[var(--text-muted)] space-y-2">
                <li>Obtěžování, urážení nebo zastrašování ostatních uživatelů</li>
                <li>Sdílení nevhodného, nenávistného nebo násilného obsahu</li>
                <li>Spamování nebo neoprávněná reklama</li>
                <li>Vydávání se za jinou osobu</li>
                <li>Sdílení osobních údajů ostatních bez souhlasu</li>
                <li>Jakékoli ilegální aktivity</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-normal text-[var(--text)] mb-4">
                6. Duševní vlastnictví
              </h2>
              <p className="text-[var(--text-muted)] leading-relaxed mb-4">
                Veškerý obsah na platformě (videa, texty, obrázky) je chráněn autorskými právy.
                Je zakázáno:
              </p>
              <ul className="list-disc pl-6 text-[var(--text-muted)] space-y-2">
                <li>Kopírování, stahování nebo redistribuce našeho obsahu</li>
                <li>Používání obsahu pro komerční účely bez našeho souhlasu</li>
                <li>Odstraňování vodoznaků nebo autorských značek</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-normal text-[var(--text)] mb-4">
                7. Omezení odpovědnosti
              </h2>
              <p className="text-[var(--text-muted)] leading-relaxed mb-4">
                Deseyo poskytuje obsah pouze pro informační a vzdělávací účely. Nejsme odpovědní za:
              </p>
              <ul className="list-disc pl-6 text-[var(--text-muted)] space-y-2">
                <li>Zdravotní problémy vzniklé při praktikování cvičení</li>
                <li>Ztrátu dat nebo technické problémy</li>
                <li>Obsah vytvořený ostatními uživateli v komunitě</li>
                <li>Nedostupnost služby z důvodu technických problémů nebo údržby</li>
              </ul>
              <p className="text-[var(--text-muted)] leading-relaxed mt-4">
                Před začátkem jakéhokoli cvičení konzultujte své zdravotní problémy s lékařem.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-normal text-[var(--text)] mb-4">
                8. Ukončení účtu
              </h2>
              <p className="text-[var(--text-muted)] leading-relaxed mb-4">
                Vyhrazujeme si právo pozastavit nebo ukončit váš účet při porušení těchto podmínek,
                zejména při nevhodném chování, nelegálních aktivitách nebo zneužití služby.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-normal text-[var(--text)] mb-4">
                9. Změny podmínek
              </h2>
              <p className="text-[var(--text-muted)] leading-relaxed mb-4">
                Vyhrazujeme si právo tyto podmínky kdykoliv upravit. O významných změnách
                vás budeme informovat emailem nebo oznámením na platformě.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-normal text-[var(--text)] mb-4">
                10. Kontakt
              </h2>
              <p className="text-[var(--text-muted)] leading-relaxed mb-4">
                Pro dotazy týkající se těchto podmínek nás kontaktujte na: podpora@deseyo.cz
              </p>
            </section>
      </div>
    </ContentLayout>
  );
};
