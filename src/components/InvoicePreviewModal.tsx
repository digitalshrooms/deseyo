import { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import type { Invoice } from '../services/invoiceService';

const SELLER = {
  name: 'Deseyo',
  address: 'Praha, Česká republika',
  email: 'podpora@deseyo.cz',
  website: 'www.deseyo.cz',
};

interface Props {
  invoice: Invoice;
  onClose: () => void;
}

export function InvoicePreviewModal({ invoice, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML ?? '';
    const win = window.open('', '_blank', 'width=800,height=1100');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8" />
      <title>Faktura ${invoice.invoice_number}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; color: #111; background: #fff; padding: 40px 48px; font-size: 13px; line-height: 1.5; }
        .invoice-root { max-width: 680px; margin: 0 auto; }
        ${INVOICE_CSS}
      </style>
    </head><body><div class="invoice-root">${content}</div></body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const issuedDate = new Date(invoice.issued_at).toLocaleDateString('cs-CZ', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const dueDateStr = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';
  const priceFormatted = (invoice.amount / 100).toLocaleString('cs-CZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }) + '\u00a0' + invoice.currency;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl bg-white">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-white flex-shrink-0">
          <span className="text-sm font-semibold text-gray-800">
            Faktura {invoice.invoice_number}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Tisk / PDF
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable invoice preview */}
        <div className="overflow-y-auto flex-1 bg-gray-50 p-6">
          <div
            ref={printRef}
            className="bg-white rounded-xl shadow-sm mx-auto"
            style={{ maxWidth: 640, padding: '40px 48px', fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#111', lineHeight: 1.6 }}
          >
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, color: '#111', marginBottom: 4 }}>
                FAKTURA
              </div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                č. {invoice.invoice_number}
              </div>
            </div>

            {/* Seller / Buyer */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32, paddingBottom: 28, borderBottom: '1px solid #f0f0f0' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, color: '#9ca3af', marginBottom: 8 }}>
                  Dodavatel
                </div>
                <div style={{ fontWeight: 600, color: '#111', marginBottom: 2 }}>{SELLER.name}</div>
                <div style={{ color: '#6b7280' }}>{SELLER.address}</div>
                <div style={{ color: '#6b7280' }}>{SELLER.email}</div>
                <div style={{ color: '#6b7280' }}>{SELLER.website}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, color: '#9ca3af', marginBottom: 8 }}>
                  Odběratel
                </div>
                {invoice.buyer_name && (
                  <div style={{ fontWeight: 600, color: '#111', marginBottom: 2 }}>{invoice.buyer_name}</div>
                )}
                {invoice.buyer_email && (
                  <div style={{ color: '#6b7280' }}>{invoice.buyer_email}</div>
                )}
                {!invoice.buyer_name && !invoice.buyer_email && (
                  <div style={{ color: '#9ca3af' }}>—</div>
                )}
              </div>
            </div>

            {/* Meta */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Datum vystavení', value: issuedDate },
                { label: 'Datum splatnosti', value: dueDateStr },
                { label: 'Variabilní symbol', value: invoice.payment_id ? String(invoice.payment_id) : '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontWeight: 600, color: '#111', fontSize: 13 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Items table */}
            <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #f0f0f0', marginBottom: 28 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: '#374151', fontSize: 12 }}>Popis</th>
                    <th style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 600, color: '#374151', fontSize: 12, width: 80 }}>Množ.</th>
                    <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 600, color: '#374151', fontSize: 12, width: 120 }}>Cena</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '14px 16px', color: '#111', borderTop: '1px solid #f0f0f0' }}>{invoice.product_name}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', color: '#6b7280', borderTop: '1px solid #f0f0f0' }}>1</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#111', borderTop: '1px solid #f0f0f0' }}>{priceFormatted}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 36 }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 24px', textAlign: 'right', minWidth: 200 }}>
                <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, marginBottom: 4 }}>Celkem k úhradě</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#065f46' }}>{priceFormatted}</div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, fontSize: 11, color: '#9ca3af' }}>
              <div>Faktura byla vystavena elektronicky a je platná bez podpisu.</div>
              <div>Vystaveno systémem {SELLER.name} · {SELLER.website}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// CSS passed into the print window
const INVOICE_CSS = `
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 10px 16px; }
  thead tr { background: #f9fafb; }
  th { font-size: 12px; font-weight: 600; color: #374151; text-align: left; }
  td { font-size: 13px; color: #111; border-top: 1px solid #f0f0f0; }
  td.center { text-align: center; }
  td.right { text-align: right; }
`;
