import { ContentLayout } from '../components/ContentLayout';

export const ObchodniPodminky = () => {
  return (
    <ContentLayout title="Obchodní podmínky platformy">
      <p className="text-[var(--text-muted)] mb-8">pro poskytování členství a digitálního obsahu</p>

      <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-[var(--border)]">
        <h2 className="font-normal text-lg mb-3" style={{ color: 'var(--primary)' }}>
          DESEYO s.r.o.
        </h2>
        <div className="text-[var(--text-muted)] space-y-1 text-sm">
          <p>Školská 660/3, Nové Město, 110 00 Praha 1</p>
          <p>IČO: 244 21 961</p>
          <p>sp. zn. C 440923 vedená u Městského soudu v Praze</p>
          <p className="mt-3 text-[var(--text-muted)] italic">
            Účinné od: 18.04.2026
          </p>
        </div>
      </div>

      <div className="space-y-6">
            {/* ČÁST I */}
            <section className="mb-10">
              <h2 className="text-2xl font-normal mb-6 pb-2 border-b-2" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                ČÁST I — ZÁKLADNÍ USTANOVENÍ
              </h2>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">
                  Článek 1 — Identifikace poskytovatele
                </h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>1.1</strong> Poskytovatelem služeb prostřednictvím platformy DESEYO je:</p>
                <ul className="list-none pl-4 text-[var(--text-muted)] space-y-1 text-sm">
                  <li>Obchodní firma: DESEYO s.r.o.</li>
                  <li>Sídlo: Školská 660/3, Nové Město, 110 00 Praha 1</li>
                  <li>IČO: 244 21 961</li>
                  <li>Zápis: sp. zn. C 440923 vedená u Městského soudu v Praze</li>
                  <li>Kontaktní e-mail: podpora@deseyo.cz</li>
                  <li>Telefon: +420 774 695 769</li>
                  <li>Web: https://vasprojekt.fun/</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">
                  Článek 2 — Úvodní ustanovení a oblast působnosti
                </h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>2.1</strong> Tyto všeobecné obchodní podmínky (dále jen VOP nebo Podmínky) upravují práva a povinnosti mezi společností DESEYO s.r.o. (dále jen Poskytovatel) a fyzickou nebo právnickou osobou, která si prostřednictvím platformy DESEYO objednává členství nebo jinou digitální službu (dále jen Zákazník).</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>2.2</strong> Tyto VOP jsou nedílnou součástí každé smlouvy uzavřené mezi DESEYO a Zákazníkem prostřednictvím prostředků komunikace na dálku (tzv. distančním způsobem) ve smyslu § 1820 a násl. zákona č. 89/2012 Sb., občanského zákoníku (dále jen OZ).</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>2.3</strong> Platforma DESEYO je online členská platforma zaměřená na obsah z oblastí wellbeing, pohyb, jógu, face jógu, online lekce, videoobsah, edukativní a podpůrné materiály a případně další digitální služby z oblasti péče o tělo a duševní rovnováhu.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>2.4</strong> Obsah platformy může být vytvářen interními i externími lektory a odbornými spolupracovníky. Ve vztahu k Zákazníkovi vystupuje jako poskytovatel vždy DESEYO, není-li u konkrétní nabídky výslovně uvedeno jinak.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>2.5</strong> Je-li Zákazníkem spotřebitel ve smyslu § 419 OZ (fyzická osoba jednající mimo rámec své podnikatelské činnosti), použijí se na smluvní vztah veškerá ustanovení těchto VOP včetně ochrany spotřebitele. Je-li Zákazníkem podnikatel, použijí se VOP s výjimkou ustanovení určených výlučně spotřebitelům; na podnikatele se použijí pravidla pro B2B dle článku 18 těchto VOP.</p>
                <p className="text-[var(--text-muted)]"><strong>2.6</strong> Odchylná ujednání sjednaná individuálně mají přednost před těmito VOP.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">
                  Článek 3 — Vymezení základních pojmů
                </h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>3.1</strong> Pro účely těchto VOP se rozumí:</p>
                <ul className="list-none pl-4 text-[var(--text-muted)] space-y-2">
                  <li><strong>a)</strong> Platformou — online prostředí DESEYO dostupné na adrese www.deseyo.cz a dalších navazujících aplikacích nebo rozhraních.</li>
                  <li><strong>b)</strong> Členstvím — placený opakující se přístup k obsahu a funkcím platformy po sjednané období.</li>
                  <li><strong>c)</strong> Měsíčním členstvím — členství sjednané na období jednoho měsíce s automatickým obnovením.</li>
                  <li><strong>d)</strong> Ročním členstvím — členství sjednané na období jednoho roku s automatickým obnovením.</li>
                  <li><strong>e)</strong> Obsahem — videa, lekce, programy, návody, texty, audio obsah, metodické materiály, edukativní a wellbeing obsah a další digitální materiály zpřístupněné v rámci členství.</li>
                  <li><strong>f)</strong> Účtem — uživatelský účet Zákazníka zřízený při registraci nebo po objednávce členství.</li>
                  <li><strong>g)</strong> Prvním aktivačním obdobím — prvních 14 dnů od prvního zpřístupnění členství, po dobu nichž může Zákazník uplatnit garanci vrácení peněz dle čl. 12 VOP.</li>
                  <li><strong>h)</strong> Digitální službou — ve smyslu § 2389a a násl. OZ: služba umožňující vytváření, zpracovávání nebo ukládání dat v digitální podobě nebo přístup k nim.</li>
                  <li><strong>i)</strong> Digitálním obsahem — ve smyslu § 2389a OZ: data vytvořená a dodaná v digitální podobě, zejména lekce, videa, zvukové záznamy nebo texty.</li>
                </ul>
              </div>
            </section>

            {/* ČÁST II */}
            <section className="mb-10">
              <h2 className="text-2xl font-normal mb-6 pb-2 border-b-2" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                ČÁST II — OBJEDNÁVKA A UZAVŘENÍ SMLOUVY
              </h2>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">Článek 4 — Objednávka členství</h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>4.1</strong> Zákazník objednává členství prostřednictvím webového rozhraní platformy. Nabídka členství zobrazená na webu není závazným návrhem na uzavření smlouvy ve smyslu § 1732 odst. 2 OZ, pokud není výslovně uvedeno jinak.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>4.2</strong> Zákazník je povinen před odesláním objednávky zkontrolovat a potvrdit správnost vyplněných údajů.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>4.3</strong> Odesláním objednávky Zákazník potvrzuje, že: se seznámil s těmito VOP a souhlasí s nimi, jde o objednávku zavazující k platbě, byl informován, že členství je placené a automaticky obnovované, a výslovně souhlasí se zahájením poskytování digitální služby před uplynutím lhůty pro odstoupení od smlouvy.</p>
                <p className="text-[var(--text-muted)]"><strong>4.4</strong> Zákazník souhlasí s tím, že objednávka představuje povinnost zaplatit. Tlačítko odesílající objednávku musí být označeno způsobem, který tuto povinnost jednoznačně vyjadřuje — například: Objednávka zavazující k platbě, nebo Zaplatit a aktivovat členství.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">Článek 5 — Uzavření smlouvy</h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>5.1</strong> Smlouva je uzavřena okamžikem, kdy: Zákazník řádně odešle objednávku, dojde k úspěšné úhradě první platby a DESEYO potvrdí přijetí objednávky zasláním potvrzovacího e-mailu.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>5.2</strong> Zákazník obdrží potvrzení o uzavření smlouvy na e-mailovou adresu uvedenou při objednávce. Potvrzení obsahuje: druh a cenu členství, informaci o automatickém obnovování a periodicitě plateb, informaci o způsobu zrušení členství a odkaz nebo přílohu s aktuálním zněním VOP.</p>
                <p className="text-[var(--text-muted)]"><strong>5.3</strong> Smlouva je uzavírána v českém jazyce a je archivována v elektronické podobě.</p>
              </div>
            </section>

            {/* ČÁST III */}
            <section className="mb-10">
              <h2 className="text-2xl font-normal mb-6 pb-2 border-b-2" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                ČÁST III — PŘEDMĚT PLNĚNÍ A DRUHY ČLENSTVÍ
              </h2>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">Článek 6 — Předmět plnění</h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>6.1</strong> Na základě uzavřené smlouvy poskytuje DESEYO Zákazníkovi po dobu trvání členství nevýhradní, nepřenosné, časově omezené právo přístupu k obsahu a funkcím platformy v rozsahu odpovídajícím zvolenému členství.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>6.2</strong> Rozsah členství, jeho cena, frekvence plateb a hlavní charakteristiky obsahu jsou vždy uvedeny na webu platformy v rámci nabídky při objednávce.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>6.3</strong> DESEYO je oprávněna obsah platformy průběžně rozšiřovat, upravovat, aktualizovat nebo obměňovat za předpokladu, že je zachována podstata a hlavní účel sjednaného členství.</p>
                <p className="text-[var(--text-muted)]"><strong>6.4</strong> Součástí členství mohou být rovněž živé online lekce, záznamy, doprovodné materiály nebo podpůrné komunitní funkce, pokud jsou výslovně uvedeny v příslušné nabídce. Dále součástí poskytovaných služeb mohou také být individuální konzultace (fyzioterapie, jóga, koučink a mentoring a případně další oblasti), podrobnosti a možnosti využití těchto služeb budou uvedeny v rámci platformy DESEYO.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">Článek 7 — Měsíční členství</h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>7.1</strong> Měsíční členství trvá od okamžiku prvního zpřístupnění obsahu do konce příslušného měsíčního fakturačního období.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>7.2</strong> Po uplynutí každého měsíčního období se členství automaticky obnovuje na další měsíční období, pokud Zákazník členství před uplynutím probíhajícího období nezruší způsobem uvedeným v čl. 10.</p>
                <p className="text-[var(--text-muted)]"><strong>7.3</strong> Cena měsíčního členství je splatná předem za každé fakturační období a je automaticky strhávána z platební karty Zákazníka či je hrazena jinou platební metodou, kterou platforma umožňuje.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">Článek 8 — Roční členství</h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>8.1</strong> Roční členství trvá od okamžiku prvního zpřístupnění obsahu do konce příslušného ročního fakturačního období.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>8.2</strong> Po uplynutí každého ročního období se členství automaticky obnovuje na další roční období, pokud Zákazník členství před uplynutím probíhajícího ročního období nezruší způsobem uvedeným v čl. 10.</p>
                <p className="text-[var(--text-muted)]"><strong>8.3</strong> DESEYO se zavazuje, že Zákazníka na blížící se automatickou obnovu ročního členství upozorní e-mailem nejméně 30 dnů před datem obnovy, a to včetně informace o ceně nového ročního období a způsobu zrušení. Zákazník bere tuto skutečnost na vědomí a zajistí, aby mu e-maily z platformy DESEYO nebyly doručovány pouze do složky „hromadné" či jiné e-mailové složky, která je mimo jeho aktivní pozornost.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">Článek 9 — Změna typu členství</h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>9.1</strong> Zákazník je oprávněn kdykoli požádat o změnu z měsíčního na roční členství nebo z ročního na měsíční, a to prostřednictvím svého účtu nebo e-mailem na podpora@deseyo.cz.</p>
                <p className="text-[var(--text-muted)]"><strong>9.2</strong> Není-li v konkrétním procesu změny uvedeno jinak, změna se projeví od následujícího fakturačního období po skončení již uhrazeného období.</p>
              </div>
            </section>

            {/* ČÁST IV */}
            <section className="mb-10">
              <h2 className="text-2xl font-normal mb-6 pb-2 border-b-2" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                ČÁST IV — CENA, PLATBY A AUTOMATICKÉ OBNOVOVÁNÍ
              </h2>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">Článek 10 — Cena a platební podmínky</h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>10.1</strong> Cena členství je uvedena na webu platformy. Není-li výslovně uvedeno jinak, jsou ceny uváděny včetně DPH.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>10.2</strong> Cena je splatná předem za každé fakturační období.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>10.3</strong> Platba probíhá online prostřednictvím platební brány nebo jiného platebního způsobu, který DESEYO aktuálně umožňuje.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>10.4</strong> Zákazníkovi je vystaven daňový doklad zaslaný elektronicky na e-mailovou adresu uvedenou při objednávce, v souladu se zákonem č. 235/2004 Sb., o dani z přidané hodnoty.</p>
                <p className="text-[var(--text-muted)]"><strong>10.5</strong> DESEYO je oprávněna cenu členství pro budoucí obnovení upravit. O změně ceny musí být Zákazník informován nejméně 30 dnů před účinností změny e-mailem nebo oznámením v účtu. Pokud Zákazník se změnou nesouhlasí, je oprávněn členství před datem účinnosti změny zrušit.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">Článek 11 — Automatické obnovení a opakované platby</h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>11.1</strong> Zakoupením členství Zákazník výslovně souhlasí s tím, že: členství se po uplynutí každého fakturačního období automaticky obnoví na další stejné období, cena bude automaticky strhávána z jím zvolené platební karty či formou jiné platební metody v příslušných intervalech, a byl o tomto informován před uzavřením smlouvy.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>11.2</strong> Zákazník je povinen zajistit, aby ke dni automatické obnovy byla jeho platební metoda aktivní a měl dostatek platebních prostředků pro zvolenou platební metodu k datu automatické obnovy.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>11.3</strong> V případě neúspěšné opakované platby je DESEYO oprávněna: pokusit se o opětovné stržení platby, zaslat Zákazníkovi výzvu k aktualizaci platebních údajů, dočasně omezit přístup k placenému obsahu do doby uhrazení.</p>
                <p className="text-[var(--text-muted)]"><strong>11.4</strong> Pokud Zákazník neuhradí cenu ani v přiměřené dodatečné lhůtě, je DESEYO oprávněna členství neobnovit nebo smluvní vztah ukončit a požadovat náhradu způsobené škody, příp. žádat úhradu všech splatných pohledávek.</p>
              </div>
            </section>

            {/* ČÁST V */}
            <section className="mb-10">
              <h2 className="text-2xl font-normal mb-6 pb-2 border-b-2" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                ČÁST V — GARANCE, ODSTOUPENÍ A REKLAMACE
              </h2>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">Článek 12 — Garance vrácení peněz do 14 dnů</h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>12.1</strong> DESEYO poskytuje Zákazníkovi dobrovolnou smluvní garanci, podle které může Zákazník do 14 dnů od prvního zpřístupnění členství požádat o vrácení první uhrazené měsíční platby, pokud mu obsah nebo forma platformy nevyhovují.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>12.2</strong> Tato garance se vztahuje výlučně na: první zakoupené měsíční členství u DESEYO, první vstup Zákazníka do platformy, první uhrazenou měsíční platbu.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>12.3</strong> Garance se nevztahuje na: roční členství (pokud není u konkrétní nabídky výslovně uvedeno jinak), opakovaná nebo obnovená měsíční členství, individuálně sjednané služby.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>12.4</strong> Pro uplatnění garance je Zákazník povinen zaslat žádost nejpozději 14. den od zpřístupnění členství na e-mail podpora@deseyo.cz s uvedením jména, e-mailu z objednávky a jednoznačné žádosti o ukončení členství a vrácení platby.</p>
                <p className="text-[var(--text-muted)]"><strong>12.5</strong> Po řádném uplatnění garance DESEYO ukončí členství, zamezí dalším automatickým platbám a vrátí první uhrazenou měsíční platbu zpravidla do 14 dnů od potvrzení žádosti, stejným nebo obdobným způsobem, jakým byla přijata.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">Článek 13 — Odstoupení od smlouvy spotřebitelem</h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>13.1</strong> Je-li Zákazník spotřebitelem, má při uzavření smlouvy na dálku zákonné právo odstoupit od smlouvy bez udání důvodu ve lhůtě 14 dnů od jejího uzavření, dle § 1829, není-li právními předpisy či těmito VOP stanoveno jinak.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>13.2</strong> Zákazník při objednávce výslovně souhlasí se zahájením poskytování a zpřístupněním digitálního obsahu před uplynutím 14denní lhůty od uzavření smlouvy pro odstoupení. Zákazník bere na vědomí a souhlasí, že tímto zaniká jeho zákonné právo odstoupit od smlouvy.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>13.3</strong> Souhlas dle předchozího odstavce musí být ze strany Zákazníka učiněn aktivně — formou výslovného zaškrtnutí příslušného checkboxu při objednávce.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>13.4</strong> Tímto článkem není dotčeno právo Zákazníka využít smluvní garanci dle čl. 12, pokud jsou splněny její podmínky.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">Článek 14 — Zpřístupnění obsahu a okamžik plnění</h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>14.1</strong> DESEYO zpřístupní Zákazníkovi obsah a funkce platformy bez zbytečného odkladu po úspěšném uzavření smlouvy a uhrazení první platby, zpravidla okamžitě.</p>
                <p className="text-[var(--text-muted)]"><strong>14.2</strong> Okamžikem prvního zpřístupnění obsahu začíná poskytování digitální služby ve smyslu § 2389a a násl. OZ.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">Článek 15 — Práva z vad digitálního obsahu a digitální služby</h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>15.1</strong> DESEYO odpovídá za to, že digitální obsah a digitální služby poskytované v rámci členství budou po dobu jejich poskytování odpovídat smlouvě a právním požadavkům dle § 2389b a násl. OZ.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>15.2</strong> Zákazník je oprávněn vytknout vadu bez zbytečného odkladu poté, co ji zjistí, a to e-mailem na podpora@deseyo.cz, nejpozději však do 6 měsíců ode dne poskytnutí služby. V případě poskytnutí digitálního obsahu je Zákazník oprávněn vytknout vadu nejpozději do 24 měsíců ode dne poskytnutí digitálního obsahu. Po marném uplynutí příslušné lhůty právo z vady zaniká.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>15.3</strong> Reklamace musí obsahovat alespoň následující náležitosti: a) identifikaci Zákazníka (jméno, příjmení nebo název) a e-mailovou adresu uvedenou při objednávce; b) popis vady, včetně uvedení, kdy a jakým způsobem se vada projevuje; c) požadovaný způsob vyřízení reklamace. Neobsahuje-li reklamace výše uvedené náležitosti, vyzve DESEYO Zákazníka k jejímu doplnění. Lhůta pro vyřízení reklamace dle čl. 15.5 počíná běžet až dnem doručení úplné reklamace.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>15.4</strong> Je-li reklamace oprávněná, DESEYO vadu odstraní v přiměřené lhůtě bezúplatně a bez podstatných obtíží pro Zákazníka. Není-li odstranění vady možné nebo přiměřené, má Zákazník právo na přiměřenou slevu z ceny nebo na odstoupení od smlouvy dle § 2389d OZ.</p>
                <p className="text-[var(--text-muted)]"><strong>15.5</strong> Reklamace spotřebitele musí být vyřízena bez zbytečného odkladu, nejpozději do 30 dnů od jejího uplatnění, pokud se strany nedohodnou na delší lhůtě.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">Článek 16 — Zrušení členství Zákazníkem</h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>16.1</strong> Zákazník může členství kdykoli zrušit prostřednictvím svého účtu klikem v sekci pro správu členství.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>16.2</strong> Není-li zrušení přes účet z technických důvodů dostupné, může Zákazník požádat o zrušení e-mailem na podpora@deseyo.cz.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>16.3</strong> Zrušení členství znamená, že se členství po uplynutí probíhajícího uhrazeného období již automaticky neobnoví a nebude provedena další opakovaná platba.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>16.4</strong> Zrušení samo o sobě neukončuje uhrazené probíhající období a nezakládá nárok na vrácení poměrné části ceny za toto období, pokud Poskytovatel v rámci smlouvy, tyto VOP nebo zákon nestanoví jinak.</p>
                <p className="text-[var(--text-muted)]"><strong>16.5</strong> Po uplynutí uhrazeného období bude přístup Zákazníka k placenému obsahu a funkcím ukončen nebo omezen.</p>
              </div>
            </section>

            {/* ČÁST VI */}
            <section className="mb-10">
              <h2 className="text-2xl font-normal mb-6 pb-2 border-b-2" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                ČÁST VI — UŽIVATELSKÝ ÚČET, AUTORSKÁ PRÁVA A PRAVIDLA
              </h2>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">Článek 17 — Uživatelský účet a přístupové údaje</h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>17.1</strong> Přístup do platformy je vázán výlučně na uživatelský účet Zákazníka.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>17.2</strong> Zákazník je povinen uvádět pravdivé, úplné a aktuální registrační údaje a chránit přístupové údaje před zneužitím třetími osobami. Zákazník nesmí své přístupové údaje poskytnout ani zpřístupnit jakékoli třetí osobě (viz čl. 20.2 těchto VOP). Porušení této povinnosti se považuje za podstatné porušení smlouvy a zakládá právo DESEYO na okamžité odstoupení od smlouvy, a to bez jakéhokoli nároku zákazníka na náhradu škody, vrácení úhrady či jiné kompenzace.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>17.3</strong> Zákazník odpovídá za veškerou aktivitu uskutečněnou prostřednictvím svého účtu, ledaže prokáže, že ke zneužití došlo bez jeho zavinění a DESEYO o ztrátě nebo zneužití přístupových údajů bez zbytečného odkladu informoval.</p>
                <p className="text-[var(--text-muted)]"><strong>17.4</strong> Zákazník je povinen o jakékoli ztrátě nebo podezření na zneužití přístupových údajů DESEYO neprodleně informovat na podpora@deseyo.cz.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">Článek 18 — Zvláštní pravidla pro podnikatele (B2B)</h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>18.1</strong> Je-li Zákazník podnikatelem objednávajícím členství v rámci své podnikatelské činnosti, nepoužijí se na tento vztah ustanovení VOP a právních předpisů určená výlučně spotřebitelům, zejména: zákonné právo odstoupit od smlouvy ve lhůtě 14 dnů dle § 1829 OZ, zákonné lhůty pro vyřízení reklamací platné pro spotřebitele, právo na mimosoudní řešení sporu u ČOI. Právo Zákazníka – podnikatele na odstoupení od smlouvy je možné jen z důvodů stanovených právními předpisy nebo těmito VOP. Zákazník – podnikatel je oprávněn uplatnit své nároky z titulu odpovědnosti za vady bezodkladně po poskytnutí služby (přístupu k platformě).</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>18.2</strong> Není-li dohodnuto jinak, řídí se práva a povinnosti podnikatele obecnými ustanoveními OZ a těmito VOP v rozsahu, který se na podnikatele vztahuje.</p>
                <p className="text-[var(--text-muted)]"><strong>18.3</strong> DESEYO si vyhrazuje právo poskytnout podnikateli individuální podmínky nad rámec těchto VOP, pokud jsou výslovně sjednány, a to na základě individuální smlouvy či zvláštních podmínek pro zákazníky ze sféry B2B.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">Článek 19 — Autorská práva a pravidla užití obsahu</h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>19.1</strong> Veškerý obsah platformy DESEYO je chráněn autorským právem a dalšími právy duševního vlastnictví ve smyslu zákona č. 121/2000 Sb., autorského zákona a zákona č. 89/2012 Sb., občanského zákoníku.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>19.2</strong> Zákazník nabývá uzavřením smlouvy nevýhradní, nepřenosné, časově omezené právo k osobnímu užívání obsahu po dobu trvání členství.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>19.3</strong> Zákazník není bez předchozího písemného souhlasu DESEYO oprávněn: obsah kopírovat, reprodukovat ani stahovat nad rámec výslovně umožněný platformou, obsah šířit, sdílet, prodávat nebo jinak zpřístupňovat třetím osobám, veřejně obsah prezentovat nebo sdílet přihlašovací údaje, obsah využívat pro komerční účely, výuku nebo podnikatelskou činnost.</p>
                <p className="text-[var(--text-muted)]"><strong>19.4</strong> Porušení tohoto článku se považuje za podstatné porušení smlouvy a zakládá právo DESEYO na okamžité odstoupení od smlouvy s ukončením přístupu bez nároku na vrácení uhrazené ceny a na náhradu škody dle právních předpisů.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">Článek 20 — Nepřípustné užití platformy</h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>20.1</strong> Zákazník je povinen užívat platformu DESEYO výhradně v souladu s těmito obchodními podmínkami, platnými právními předpisy a dobrými mravy. Zákazník nesmí platformu používat způsobem, který by mohl poškodit DESEYO, ostatní uživatele, lektory nebo třetí osoby.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>20.2</strong> Za nepřípustné užití platformy se považuje zejména: a) sdílení přihlašovacích údajů nebo zpřístupnění účtu třetím osobám, a to i bezúplatně; b) umožnění užívání obsahu platformy osobám, které nejsou registrovanými zákazníky; c) obcházení, narušování nebo pokus o narušení technického zabezpečení platformy, včetně ochranných prvků digitálního obsahu (DRM); d) využívání automatizovaných nástrojů, botů, skriptů nebo jiných prostředků k systematickému stahování, vytěžování či kopírování obsahu platformy, a to i po částech; e) pořizování záznamů (obrazových, zvukových či audiovizuálních) z obsahu zpřístupněného na platformě bez předchozího písemného souhlasu DESEYO; f) šíření, nahrávání nebo zpřístupňování obsahu, který je nezákonný, urážlivý, výhružný, pomlouvačný, podvodný nebo jinak v rozporu s dobrými mravy; g) vydávání se za jinou osobu nebo uvedení nepravdivých údajů při registraci či komunikaci s DESEYO; h) využívání platformy k šíření nevyžádaných obchodních sdělení nebo reklamy; i) jakékoli jednání směřující k získání neoprávněného přístupu k účtům jiných zákazníků, administraci platformy nebo interním systémům DESEYO.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>20.3</strong> V případě porušení povinností uvedených v tomto článku je DESEYO oprávněna přijmout dle povahy a závažnosti porušení jedno nebo více z následujících opatření: a) upozornit Zákazníka na porušení a vyzvat jej k nápravě ve stanovené lhůtě; b) dočasně omezit nebo pozastavit přístup Zákazníka k účtu, obsahu nebo vybraným funkcím platformy, a to až do zjednání nápravy; c) trvale zrušit účet Zákazníka a okamžitě ukončit jeho členství v případě závažného, opakovaného nebo úmyslného porušení či odstoupit od smlouvy se Zákazníkem. V případě ukončení členství dle tohoto článku nemá Zákazník nárok na vrácení uhrazené ceny členství ani na jakoukoli jinou kompenzaci.</p>
              </div>
            </section>

            {/* ČÁST VII */}
            <section className="mb-10">
              <h2 className="text-2xl font-normal mb-6 pb-2 border-b-2" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                ČÁST VII — ZDRAVOTNÍ UPOZORNĚNÍ, DOSTUPNOST A ODPOVĚDNOST
              </h2>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">Článek 21 — Zdravotní upozornění a odpovědnost při cvičení</h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>21.1</strong> Obsah platformy DESEYO slouží výhradně k oblasti wellbeing, pohybové a edukativní podpory. Lekce, programy ani jiný obsah nenahrazují individuální lékařskou péči, zdravotní služby, rehabilitaci, fyzioterapii, diagnostiku ani léčbu. Obsah může být podpůrným doplňkem péče o tělo a celkovou pohodu.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>21.2</strong> Zákazník bere na vědomí, že se účastí cvičebních aktivit a lekcí dobrovolně, na vlastní odpovědnost a s ohledem na svůj aktuální zdravotní stav, fyzickou kondici a individuální omezení.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>21.3</strong> Před zahájením užívání platformy nebo konkrétní lekce se doporučuje konzultace s lékařem nebo jiným kvalifikovaným zdravotnickým odborníkem v případě, že Zákazník trpí jakýmikoli zdravotními potížemi, poúrazovými stavy, chronickým onemocněním, je v těhotenství nebo se nachází v jiném stavu, který může ovlivnit bezpečné cvičení.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>21.4</strong> Zákazník je povinen respektovat své fyzické limity, cvičit přiměřeně svým schopnostem a při bolesti, nevolnosti, závratu nebo jiných varovných projevech aktivitu okamžitě přerušit a vyhledat lékařskou pomoc.</p>
                <p className="text-[var(--text-muted)]"><strong>21.5</strong> DESEYO neodpovídá za zdravotní újmu nebo škodu vzniklou tím, že Zákazník: jednal v rozporu s doporučeními uvedenými v lekcích nebo na platformě, zamlčel nebo nerespektoval podstatné zdravotní omezení, pokračoval v aktivitě přes bolest nebo jiné varovné projevy, překročil svoji fyzickou způsobilost nebo užíval obsah způsobem neodpovídajícím jeho zdravotnímu stavu.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">Článek 22 — Dostupnost platformy</h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>22.1</strong> DESEYO vynaloží přiměřené úsilí k zajištění dostupnosti a funkčnosti platformy, avšak negarantuje nepřetržitou dostupnost bez jakýchkoli výpadků.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>22.2</strong> Krátkodobé omezení dostupnosti může nastat z důvodu plánované údržby, aktualizací, technické poruchy, kybernetického útoku, zásahu vyšší moci nebo selhání poskytovatelů třetích služeb.</p>
                <p className="text-[var(--text-muted)]"><strong>22.3</strong> DESEYO neodpovídá za snížení nebo výpadek dostupnosti způsobený: nedostatečným nebo přerušeným internetovým připojením Zákazníka, nevhodným nebo zastaralým zařízením nebo softwarem Zákazníka, zásahem třetí osoby mimo kontrolu DESEYO, okolnostmi vyšší moci.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">Článek 23 — Vyšší moc</h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>23.1</strong> Za okolnosti vyšší moci se považují zejména přírodní katastrofy, požáry, výpadky elektřiny nebo internetu, kybernetické útoky, epidemie, pandemie, vládní opatření, válečné konflikty a jiné události objektivně mimo kontrolu DESEYO.</p>
                <p className="text-[var(--text-muted)]"><strong>23.2</strong> Strana dotčená vyšší mocí není odpovědná za prodlení nebo neplnění povinností způsobené těmito okolnostmi. Povinnosti obou stran se po dobu trvání vyšší moci přiměřeně pozastavují.</p>
              </div>
            </section>

            {/* ČÁST VIII */}
            <section className="mb-10">
              <h2 className="text-2xl font-normal mb-6 pb-2 border-b-2" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                ČÁST VIII — OCHRANA OSOBNÍCH ÚDAJŮ, KOMUNIKACE A ZÁVĚREČNÁ USTANOVENÍ
              </h2>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">Článek 24 — Ochrana osobních údajů</h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>24.1</strong> DESEYO zpracovává osobní údaje Zákazníků v souladu s nařízením Evropského parlamentu a Rady (EU) 2016/679 (GDPR) a zákonem č. 110/2019 Sb., o zpracování osobních údajů.</p>
                <p className="text-[var(--text-muted)]"><strong>24.2</strong> Podrobné informace o zpracování osobních údajů jsou obsaženy v samostatném dokumentu — Zásady zpracování osobních údajů — dostupném na webu platformy.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">Článek 25 — Mimosoudní řešení spotřebitelských sporů</h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>25.1</strong> Je-li Zákazník spotřebitelem, má právo na mimosoudní řešení spotřebitelského sporu vzniklého ze smlouvy uzavřené s DESEYO.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>25.2</strong> Věcně příslušným subjektem pro mimosoudní řešení sporů v oblasti digitálních služeb a online obchodu je Česká obchodní inspekce (ČOI), Ústřední inspektorát – oddělení ADR, se sídlem Gorazdova 1969/24, 120 00 Praha 2. Kontaktní údaje: e-mail: adr@coi.gov.cz, web: coi.gov.cz/informace-o-adr/</p>
                <p className="text-[var(--text-muted)]"><strong>25.3</strong> Zákazník může rovněž využít platformu pro online řešení sporů dostupnou na adrese: https://consumer-redress.ec.europa.eu/index_cs</p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">Článek 26 — Komunikace</h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>26.1</strong> Veškerá komunikace mezi DESEYO a Zákazníkem probíhá primárně elektronicky.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>26.2</strong> Kontaktní údaje DESEYO: kontakt podpora@deseyo.cz, telefon +420 774 695 769, poštovní adresa Školská 660/3, Nové Město, 110 00 Praha 1.</p>
                <p className="text-[var(--text-muted)]"><strong>26.3</strong> Zákazník je povinen udržovat aktuální kontaktní údaje a sledovat e-mailovou adresu, kterou uvedl při objednávce, neboť na ni budou zasílána veškerá důležitá oznámení.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">Článek 27 — Změny obchodních podmínek</h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>27.1</strong> DESEYO je oprávněna tyto VOP v přiměřeném rozsahu měnit nebo doplňovat, zejména v důsledku změn právních předpisů, technického řešení platformy nebo obchodního modelu.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>27.2</strong> O podstatné změně VOP bude Zákazník informován nejméně 30 dnů před nabytím účinnosti změny prostřednictvím e-mailu nebo oznámení v uživatelském účtu.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>27.3</strong> Pokud Zákazník se změnou nesouhlasí, je oprávněn členství před nabytím účinnosti změny zrušit. Pokračování v užívání platformy po nabytí účinnosti změny se považuje za souhlas se změněnými VOP.</p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-normal mb-3 text-[var(--text)]">Článek 28 — Závěrečná ustanovení</h3>
                <p className="text-[var(--text-muted)] mb-2"><strong>28.1</strong> Tyto VOP se řídí právním řádem České republiky. Případné spory budou řešeny věcně a místně příslušnými soudy České republiky.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>28.2</strong> Je-li nebo stane-li se některé ustanovení těchto VOP neplatným nebo neúčinným, nemá to vliv na platnost a účinnost ostatních ustanovení.</p>
                <p className="text-[var(--text-muted)] mb-2"><strong>28.3</strong> Zákazník není oprávněn postoupit svá práva a povinnosti ze smlouvy s DESEYO třetí osobě bez předchozího písemného souhlasu DESEYO.</p>
                <p className="text-[var(--text-muted)]"><strong>28.4</strong> Tyto VOP nabývají účinnosti dne 18.04.2026.</p>
              </div>
            </section>

            {/* PŘÍLOHA */}
            <section className="mb-10">
              <h2 className="text-2xl font-normal mb-6 pb-2 border-b-2" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                PŘÍLOHA č. 1 — Vzorový formulář pro odstoupení od smlouvy
              </h2>

              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="text-[var(--text-muted)] space-y-4 text-sm">
                  <div>
                    <p className="font-normal mb-2">Adresát:</p>
                    <p>DESEYO s.r.o., Školská 660/3, Nové Město, 110 00 Praha 1</p>
                    <p>E-mail: <a href="mailto:podpora@deseyo.cz" className="text-teal-700 hover:text-teal-900">podpora@deseyo.cz</a></p>
                  </div>

                  <p className="mt-6">Oznamuji, že tímto odstupuji od smlouvy o poskytnutí digitální služby / členství.</p>

                  <div className="space-y-2 border-t border-gray-300 pt-4">
                    <p>Popis služby / typ členství: ........................................</p>
                    <p>Datum objednání / uzavření smlouvy: ........................................</p>
                    <p>Jméno a příjmení spotřebitele: ........................................</p>
                    <p>Adresa spotřebitele: ........................................</p>
                    <p>E-mail použitý při objednávce: ........................................</p>
                    <p>Datum: ........................................</p>
                  </div>

                  <div className="border-t border-gray-300 pt-4 mt-6">
                    <p className="text-[var(--text-muted)] text-xs italic">Pracovní verze — ke kontrole právníkem</p>
                    <p className="text-[var(--text-muted)] text-xs">Strana</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 p-6 rounded-lg mt-6 text-[var(--text-muted)] text-sm">
                <p className="font-normal mb-3">DESEYO s.r.o. | Obchodní podmínky platformy</p>

                <div className="border-l-4 border-gray-400 pl-4 italic">
                  <p>Podpis spotřebitele (pouze papírová forma): ........................................</p>
                  <p className="mt-3">Formulář zašlete e-mailem na adresu podpora@deseyo.cz nebo použijte DESEYO portál bez zbytečného odkazu.</p>
                </div>
              </div>
            </section>

      </div>
    </ContentLayout>
  );
};
