const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export type WithdrawalType =
  | "LEGAL_WITHDRAWAL"
  | "OUT_OF_LEGAL_RIGHT"
  | "OUT_OF_PERIOD"
  | "EDGE_CASE";

export interface WithdrawalSubmitPayload {
  jmeno_prijmeni: string;
  email_z_objednavky: string;
  email_pro_potvrzeni?: string;
  cislo_objednavky?: string;
  duvod_odstoupeni?: string;
  user_id?: string;
}

export interface WithdrawalSubmitResult {
  id: string;
  preview_token: string;
  type: WithdrawalType;
  content_snapshot: Record<string, unknown>;
}

export interface WithdrawalConfirmResult {
  id: string;
  type: WithdrawalType;
  status: string;
  email_sent: boolean;
}

async function callEdgeFunction<T>(
  name: string,
  body: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

export async function submitWithdrawal(
  payload: WithdrawalSubmitPayload
): Promise<WithdrawalSubmitResult> {
  return callEdgeFunction<WithdrawalSubmitResult>("withdrawal-submit", payload);
}

export async function confirmWithdrawal(
  previewToken: string
): Promise<WithdrawalConfirmResult> {
  return callEdgeFunction<WithdrawalConfirmResult>("withdrawal-confirm", {
    preview_token: previewToken,
  });
}

export const WITHDRAWAL_TYPE_INFO: Record<
  WithdrawalType,
  { title: string; description: string; refund: boolean; cancelRenewal: boolean }
> = {
  LEGAL_WITHDRAWAL: {
    title: "Zákonné právo na odstoupení",
    description:
      "Jste v zákonné 14denní lhůtě a nebyl udělen souhlas s okamžitým plněním. Máte nárok na vrácení celé platby.",
    refund: true,
    cancelRenewal: true,
  },
  OUT_OF_LEGAL_RIGHT: {
    title: "Zákonná lhůta – nárok na refund nevznikl",
    description:
      "Udělil/a jste souhlas s okamžitým přístupem k obsahu. Zákonné právo na refund nevzniklo. Přístup k obsahu zůstane aktivní do konce zaplaceného období a automatické obnovení bude zrušeno.",
    refund: false,
    cancelRenewal: true,
  },
  OUT_OF_PERIOD: {
    title: "Zákonná lhůta vypršela",
    description:
      "14denní zákonná lhůta pro odstoupení již uplynula. Nabídneme zrušení automatického obnovení předplatného.",
    refund: false,
    cancelRenewal: true,
  },
  EDGE_CASE: {
    title: "Nestandardní případ – manuální posouzení",
    description:
      "Váš případ bude předán k manuálnímu zpracování. Ozveme se do 3 pracovních dnů.",
    refund: false,
    cancelRenewal: false,
  },
};
