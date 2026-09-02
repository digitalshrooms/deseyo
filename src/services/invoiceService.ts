import { supabase } from '../lib/supabase';

export interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string;
  payment_id: number | null;
  amount: number;
  currency: string;
  product_name: string;
  subscription_type: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  created_at: string;
  issued_at: string;
  due_date: string | null;
}

export async function fetchUserInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Invoice[];
}

export async function fetchInvoicesByUser(userId: string): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Invoice[];
}

export async function createInvoiceRecord(params: {
  userId: string;
  paymentId?: string | null;
  amount: number;
  productName: string;
  subscriptionType?: string | null;
  buyerName?: string | null;
  buyerEmail?: string | null;
}): Promise<Invoice | null> {
  const year = new Date().getFullYear();

  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${year}-01-01T00:00:00Z`)
    .lte('created_at', `${year}-12-31T23:59:59Z`);

  const seq = (count ?? 0) + 1;
  const invoiceNumber = `${year}-${String(seq).padStart(4, '0')}`;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      user_id: params.userId,
      invoice_number: invoiceNumber,
      payment_id: params.paymentId ? Number(params.paymentId) : null,
      amount: params.amount,
      currency: 'CZK',
      product_name: params.productName,
      subscription_type: params.subscriptionType ?? null,
      buyer_name: params.buyerName ?? null,
      buyer_email: params.buyerEmail ?? null,
      due_date: dueDate.toISOString().split('T')[0],
    })
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('[invoiceService] insert error:', error.message);
    return null;
  }

  return data as Invoice;
}
