export interface QuestionnaireAnswers {
  q1_body_state: string;
  q2_recent_state: string;
  q3_capacity: string;
  q4_main_need: string;
  q5_focus_area: string;
  q6_best_time: string;
  q7_start_style: string;
  q8_email_pref: string;
  q9_reason_for_joining?: string;
  q10_platform_frustration?: string;
  q11_success_definition?: string;
}

export interface QuestionnaireResult {
  recommended_plan: 'Restart' | 'L1' | 'L2';
  main_need: string;
  focus_area: string;
  preferred_time: string;
  start_style: string;
  email_preference: string;
  high_capacity_candidate: boolean;
  restart_candidate: boolean;
  face_priority: boolean;
  mindlife_priority: boolean;
  fyzio_priority: boolean;
}

export function evaluateQuestionnaire(answers: QuestionnaireAnswers): QuestionnaireResult {
  let restartScore = 0;
  let l1Score = 0;
  let l2Score = 0;

  // Q1: Tělesný stav
  if (answers.q1_body_state === '1') restartScore += 2;
  else if (answers.q1_body_state === '2') l1Score += 2;
  else if (answers.q1_body_state === '3') l2Score += 2;

  // Q2: Nedávný stav
  if (answers.q2_recent_state === '1') restartScore += 2;
  else if (answers.q2_recent_state === '2') l1Score += 2;
  else if (answers.q2_recent_state === '3') l2Score += 2;

  // Q3: Kapacita
  if (answers.q3_capacity === '1') restartScore += 1;
  else if (answers.q3_capacity === '2') l1Score += 1;
  else if (answers.q3_capacity === '3') l2Score += 1;

  // Q7: Způsob začátku
  if (answers.q7_start_style === '1') restartScore += 2;
  else if (answers.q7_start_style === '2') l1Score += 2;
  else if (answers.q7_start_style === '3') l2Score += 2;

  // Determine recommended plan
  let recommended_plan: 'Restart' | 'L1' | 'L2';

  // Bezpečnější varianta: L2 jen při velmi silném signálu
  if (l2Score >= 6 && restartScore === 0) {
    recommended_plan = 'L2';
  } else if (restartScore >= 2) {
    recommended_plan = 'Restart';
  } else {
    recommended_plan = 'L1';
  }

  // Derived values
  const main_need = answers.q4_main_need;
  const focus_area = answers.q5_focus_area;
  const preferred_time = answers.q6_best_time;
  const start_style = answers.q7_start_style;
  const email_preference = answers.q8_email_pref;

  // Derived tags
  const high_capacity_candidate = l2Score >= 4;
  const restart_candidate = restartScore >= 2;
  const face_priority = answers.q4_main_need === '3' || answers.q5_focus_area === '4' || answers.q5_focus_area === '5';
  const mindlife_priority = answers.q4_main_need === '4';
  const fyzio_priority = answers.q4_main_need === '2' ||
                         ['1', '2', '3', '6'].includes(answers.q5_focus_area);

  return {
    recommended_plan,
    main_need,
    focus_area,
    preferred_time,
    start_style,
    email_preference,
    high_capacity_candidate,
    restart_candidate,
    face_priority,
    mindlife_priority,
    fyzio_priority,
  };
}

export const QUESTIONNAIRE_QUESTIONS = [
  {
    id: 'q1_body_state',
    question: 'Když se podíváš na poslední dny, jak na tom teď tvoje tělo opravdu je?',
    required: true,
    options: [
      { value: '1', label: 'Potřebuju začít jemně a vrátit se do rytmu.' },
      { value: '2', label: 'Cítím, že zvládnu pravidelný základ.' },
      { value: '3', label: 'Mám chuť jít o kus dál.' },
    ],
  },
  {
    id: 'q2_recent_state',
    question: 'Jak vypadaly tvoje poslední týdny z pohledu pohybu a energie?',
    required: true,
    options: [
      { value: '1', label: 'Spíš jsem necvičila a jedu nadoraz.' },
      { value: '2', label: 'Něco dělám, ale nepravidelně.' },
      { value: '3', label: 'Cvičím docela pravidelně a chci se posunout.' },
    ],
  },
  {
    id: 'q3_capacity',
    question: 'Kolik prostoru pro sebe teď reálně máš?',
    required: true,
    options: [
      { value: '1', label: 'Reálně dám spíš 3 dny týdně.' },
      { value: '2', label: 'Většinou zvládnu 4 dny týdně.' },
      { value: '3', label: 'Když budu chtít, dám i 4–5 dní týdně.' },
    ],
  },
  {
    id: 'q4_main_need',
    question: 'Co je teď pro tebe nejdůležitější?',
    required: true,
    options: [
      { value: '1', label: 'Potřebuju se znovu dostat do rytmu a pravidelně se hýbat.' },
      { value: '2', label: 'Chci, aby se mi ulevilo v těle a cítila jsem se líp v běžném dni.' },
      { value: '3', label: 'Chci se víc zaměřit na obličej a jeho výraz.' },
      { value: '4', label: 'Potřebuju zklidnit hlavu a lépe zvládat stres.' },
      { value: '5', label: 'Hledám jasný systém, který budu schopná udržet.' },
    ],
  },
  {
    id: 'q5_focus_area',
    question: 'Kde teď nejčastěji cítíš, že by tvoje tělo nebo obličej potřebovaly víc péče?',
    required: true,
    options: [
      { value: '1', label: 'Záda / bedra' },
      { value: '2', label: 'Krk / šíje / ramena' },
      { value: '3', label: 'Kyčle / pánev' },
      { value: '4', label: 'Oči / čelo / výraz' },
      { value: '5', label: 'Čelist / dolní část obličeje' },
      { value: '6', label: 'Celková únava a napětí' },
      { value: '7', label: 'Nic konkrétního, chci hlavně celkový rytmus' },
    ],
  },
  {
    id: 'q6_best_time',
    question: 'Kdy se ti nejspíš bude dařit cvičit?',
    required: true,
    options: [
      { value: '1', label: 'Ráno' },
      { value: '2', label: 'Po práci' },
      { value: '3', label: 'Večer' },
      { value: '4', label: 'Každý den je to jiné' },
    ],
  },
  {
    id: 'q7_start_style',
    question: 'Jak bys chtěl/a začít, aby to pro tebe bylo opravdu udržitelné?',
    required: true,
    options: [
      { value: '1', label: 'Potřebuju začít jednoduše a bez tlaku.' },
      { value: '2', label: 'Chci mít jasně daný plán a držet se ho.' },
      { value: '3', label: 'Chci víc vedení, větší tah a posun.' },
    ],
  },
  {
    id: 'q8_email_pref',
    question: 'Chceš od nás dostávat e-maily s připomínkami a novinkami?',
    required: true,
    options: [
      { value: '1', label: 'Ano, klidně mi připomeňte, co je nového a co mi může pomoct.' },
      { value: '2', label: 'Jen občas, když je něco opravdu důležitého.' },
      { value: '3', label: 'Ne, e-maily teď nechci.' },
    ],
  },
];

export const OPTIONAL_QUESTIONS = [
  {
    id: 'q9_reason_for_joining',
    question: 'Co tě přivedlo právě sem?',
    required: false,
    options: [
      { value: '1', label: 'Potřebuju se konečně dostat do pravidelnosti.' },
      { value: '2', label: 'Řeším tělo a chci, aby se mi v něm žilo líp.' },
      { value: '3', label: 'Řeším obličej a chci se mu víc věnovat.' },
      { value: '4', label: 'Řeším stres, hlavu a celkovou únavu.' },
      { value: '5', label: 'Hledám funkční systém pro běžný život.' },
    ],
  },
  {
    id: 'q10_platform_frustration',
    question: 'Co tě na podobných platformách nejvíc štve?',
    required: false,
    options: [
      { value: '1', label: 'Je tam moc obsahu a nevím, co si pustit.' },
      { value: '2', label: 'Chybí mi lidskost a jasné vedení.' },
      { value: '3', label: 'Je to moc obecné a nic mi nesedne přesně.' },
      { value: '4', label: 'Je to na mě moc náročné.' },
      { value: '5', label: 'Nevydržím u toho dlouho.' },
      { value: '6', label: 'Je to celé moc komplikované.' },
    ],
  },
  {
    id: 'q11_success_definition',
    question: 'Co by pro tebe znamenalo, že ti tohle členství opravdu funguje?',
    required: false,
    options: [
      { value: '1', label: 'Budu se hýbat pravidelněji.' },
      { value: '2', label: 'Budu se cítit líp v těle.' },
      { value: '3', label: 'Uvidím změnu v obličeji.' },
      { value: '4', label: 'Budu klidnější a stabilnější.' },
      { value: '5', label: 'Konečně budu mít systém, který zvládnu udržet.' },
    ],
  },
];
