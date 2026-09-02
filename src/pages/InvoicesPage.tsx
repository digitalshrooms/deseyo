import { useState, useEffect } from 'react';
import { FileText, Eye, Loader2 } from 'lucide-react';
import { fetchUserInvoices, type Invoice } from '../services/invoiceService';
import { InvoicePreviewModal } from '../components/InvoicePreviewModal';
import { SubPageHeader } from '../components/profile/ProfileShared';

export const InvoicesPage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  useEffect(() => { loadInvoices(); }, []);

  const loadInvoices = async () => {
    setInvoicesLoading(true);
    try {
      const data = await fetchUserInvoices();
      setInvoices(data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setInvoicesLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-16">
        <SubPageHeader title="Faktury" />

        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
          <div className="p-5 space-y-5">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Stáhněte si své faktury v PDF</p>

            {invoicesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--primary)' }} />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <FileText className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--text-subtle)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Zatím nemáte žádné faktury</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>Faktury se zobrazí po zaplacení členství</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between gap-4 p-4 rounded-xl transition-all"
                    style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--primary-soft)' }}>
                        <FileText className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-normal truncate" style={{ color: 'var(--text)' }}>{inv.invoice_number}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          {inv.product_name} · {(inv.amount / 100).toLocaleString('cs-CZ')} {inv.currency}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                          {new Date(inv.issued_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPreviewInvoice(inv)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-normal transition-all hover:opacity-80 flex-shrink-0"
                      style={{ backgroundColor: 'var(--primary-soft)', color: 'var(--primary-dark)', border: '1px solid var(--border)' }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Náhled
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {previewInvoice && (
        <InvoicePreviewModal invoice={previewInvoice} onClose={() => setPreviewInvoice(null)} />
      )}
    </div>
  );
};
