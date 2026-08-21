const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export type GoPayState =
  | "CREATED"
  | "PAYMENT_METHOD_CHOSEN"
  | "PAID"
  | "AUTHORIZED"
  | "CANCELED"
  | "TIMEOUTED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export interface CreatePaymentRequest {
  amount?: number;
  currency?: string;
  product_name?: string;
  user_id?: string;
  return_url?: string;
  subscription_type?: 'L1' | 'L2';
  discount_code?: string;
  original_amount?: number;
}

export interface CreatePaymentResponse {
  payment_id: number;
  order_number: string;
  payment_url: string;
  state: GoPayState;
}

export async function createGoPayPayment(
  payload: CreatePaymentRequest = {}
): Promise<CreatePaymentResponse> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/gopay-create-payment`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? `HTTP ${response.status}`);
  }

  return response.json();
}

export interface ActivateFreeSubscriptionRequest {
  user_id: string;
  subscription_type: 'L1' | 'L2';
  discount_code: string;
}

export interface ActivateFreeSubscriptionResponse {
  ok: boolean;
  error?: string;
  subscription_type?: string;
}

// For 100%-discount codes — GoPay refuses to create a 0,- card payment, so a
// fully-discounted order skips GoPay entirely and activates directly.
export async function activateFreeSubscription(
  payload: ActivateFreeSubscriptionRequest
): Promise<ActivateFreeSubscriptionResponse> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/activate-free-subscription`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json().catch(() => ({ ok: false, error: "Unknown error" }));
  if (!response.ok || !data.ok) {
    throw new Error(data.error ?? `HTTP ${response.status}`);
  }

  return data;
}

export async function getPaymentStatus(paymentId: string): Promise<GoPayState> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/gopay-get-status?payment_id=${paymentId}`,
    {
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.state as GoPayState;
}
