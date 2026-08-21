/*
  # Seed weekly rotating texts and seasonal messages

  1. Content
     - 52 filozofickych / afirmacnich textu (1 rok pokryti)
     - 4 sezonni zpravy (jaro, leto, podzim, zima)

  2. Tone compliance (Sekce 0A)
     - Pozitivni smerovani
     - Zadne hodnoceni vykonu
     - Zemite afirmace (Pierre Franckh)
     - Motivace z realneho pokroku
     - Zadny tlak, zadna vina
*/

INSERT INTO weekly_texts (text_content, author, category, order_index) VALUES
('Tvoje telo si kazdou lekci pamatuje.', '', 'affirmation', 1),
('Pokrok neni primka. Je to navrat k sobe, znovu a znovu.', '', 'affirmation', 2),
('Pohyb je jazyk, kterym telo dekuje za pozornost.', '', 'philosophy', 3),
('Drobne kroky, opakovane, tvori nej vetsi zmenu.', 'James Clear', 'philosophy', 4),
('Klid neni nepritomnost pohybu. Je to pritomnost vedomi.', '', 'philosophy', 5),
('Tvoje dnesni lekce je zakladem pro to, jak se budes citit zitra.', '', 'affirmation', 6),
('Telo a obličej patri jednomu celku. Kdyz se staras o jedno, dotykas se druheho.', '', 'philosophy', 7),
('Dech je prvni lekcia kazdeho dne.', '', 'affirmation', 8),
('To, co delas pravidelne, te formuje. Ne to, co delas obcas.', 'Aristoteles', 'philosophy', 9),
('Nebyt dokonala je svoboda. Byt vedoma je sila.', '', 'affirmation', 10),
('Tichyho hlasu tela je treba naslouchat — ne ho prehluset.', '', 'philosophy', 11),
('Kazdy den je prilezitost zacit znovu, presne tam, kde jsi.', '', 'affirmation', 12),
('Vytrvalost neni rychlost. Je to smer.', '', 'philosophy', 13),
('Nejkrasnejsi promena je ta, ktera se deje v tichu.', '', 'philosophy', 14),
('Tvoje hodnota neni v tom, co dnes udelas. Je v tom, ze jsi.', '', 'affirmation', 15),
('Jemnost k sobe je nejvyssi forma sily.', '', 'philosophy', 16),
('Odpocinek je cast prace, ne jeji opak.', '', 'affirmation', 17),
('Tvuj plan neni zavod. Je to rytmus.', '', 'affirmation', 18),
('Co delas, tim se stavas.', 'Heraklitos', 'philosophy', 19),
('Sdilet se sebou cas je forma sebelasky.', '', 'affirmation', 20),
('Pohyb uvolnuje to, co slova nezvladnou.', '', 'philosophy', 21),
('Neni treba cekat na spravny moment. Stacci zacit.', '', 'affirmation', 22),
('Kazda drobna pozornost k telu je akt dobre vule.', '', 'philosophy', 23),
('Pokrok je tiche, nenapadne svetlo. Nekdy ho vidis az po mesicich.', '', 'philosophy', 24),
('Tvoje konzistence je tvuj skutecny majetek.', '', 'affirmation', 25),
('Zmena nechce revoluci. Chce ritual.', '', 'philosophy', 26),
('Nikdy nejsi pozdy, kdyz se vracis k sobe.', '', 'affirmation', 27),
('Male kroky, brane vazne, predbehnou velke plany brane lhostejne.', '', 'philosophy', 28),
('Lec, ktery telu dnes dovolis, se zitra vrati jako svoboda.', '', 'affirmation', 29),
('Sila neni v tom, co zvednes. Je v tom, co si dovolis citit.', '', 'philosophy', 30),
('Tvoje dechove vlny jsou mapou tvych moznosti.', '', 'affirmation', 31),
('Spokojenost s malym otviraci dvere k velkemu.', 'Lao-c', 'philosophy', 32),
('Nemusis byt dokonala. Staci byt opravdova.', '', 'affirmation', 33),
('Kazdy navrat k cviceni je dukaz, ze se nevzdavas.', '', 'affirmation', 34),
('Telo nezapomina laskavost. Obracuje ji do zdravi.', '', 'philosophy', 35),
('Kdyz zacinas znovu, nezacinas od nuly. Zacinas s tim, co ses naucila.', '', 'affirmation', 36),
('Kazda lekce je konverzace tela se sebou samym.', '', 'philosophy', 37),
('Nech mysl odpocinout na tom, co delas. Tam nejde o cil.', '', 'affirmation', 38),
('Zdravi neni cil. Je to zpusob, jakym zijes.', '', 'philosophy', 39),
('Tvoje cesta neni mene hodnotna proto, ze je pomalejsi.', '', 'affirmation', 40),
('Pravidelnost je nejvyssi forma pocty, kterou muzes svemu telu dat.', '', 'philosophy', 41),
('To, co ctis v tele, stavas se.', '', 'affirmation', 42),
('Vytrvalost v malem je tajemstvim velkeho.', 'Konfucius', 'philosophy', 43),
('Dnes nemusis vse. Dnes musis jenom jedno.', '', 'affirmation', 44),
('Obklop se tim, co te vede zpet k sobe.', '', 'philosophy', 45),
('Tiche ritualy tvori hlasne zivoty.', '', 'philosophy', 46),
('Tvoje praxe je tvoje modlitba.', '', 'affirmation', 47),
('Telo neni stroj. Je to zahrada. Zahradnik vi, kdy polit a kdy cekat.', '', 'philosophy', 48),
('Dech v dech, lekce za lekci, den za dnem — tak se buduje vnitrni domov.', '', 'philosophy', 49),
('Nikdo te nenauci cist signaly tveho tela lepe nez ty sama.', '', 'affirmation', 50),
('Nenauc se cviceni. Nauc se sebe pri cviceni.', '', 'philosophy', 51),
('Dnesni lekce neni oznamkovana. Jen prozita.', '', 'affirmation', 52)
ON CONFLICT DO NOTHING;

INSERT INTO seasonal_messages (season, message, display_start_month) VALUES
('spring', 'Nova sezona, stejny zaklad. Tvuj plan pokracuje.', 3),
('summer', 'Leto meni rytmus. Tvuj plan se prizpusobi — nebo ho pozastav.', 6),
('autumn', 'Podzim je dobry cas vratit se do rytmu. Jsi tady.', 9),
('winter', 'Prosinec je narocny. Staci malo — dulezite je neprestat uplne.', 12)
ON CONFLICT DO NOTHING;
