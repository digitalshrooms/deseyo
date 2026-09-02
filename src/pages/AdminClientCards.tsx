import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout, SectionCard, Badge } from '../components/AdminLayout';
import { Search, ChevronLeft, Mail, Phone, User, Calendar, ArrowLeft, FileText, Eye } from 'lucide-react';
import { fetchInvoicesByUser, type Invoice } from '../services/invoiceService';
import { InvoicePreviewModal } from '../components/InvoicePreviewModal';

interface ClientUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  username: string;
  subscription_plan: string;
  onboarding_day_index: number;
  created_at: string;
}

interface OnboardingResponse {
  id: string;
  day_number: number;
  question_text: string;
  selected_option: string | null;
  skipped: boolean;
  responded_at: string;
}

const TEAL = '#198379';

export function AdminClientCards() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientUser[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientUser | null>(null);
  const [onboardingResponses, setOnboardingResponses] = useState<OnboardingResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) {
      navigate('/admin/login');
      return;
    }
    loadClients();
  }, [navigate]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );
      const list: ClientUser[] = res.ok ? await res.json() : [];
      const normalized = Array.isArray(list) ? list : [];
      setClients(normalized);
      setFilteredClients(normalized);
    } catch {
      setClients([]);
      setFilteredClients([]);
    } finally {
      setLoading(false);
    }
  };

  const filterClients = (search: string) => {
    setSearchTerm(search);
    if (!search) {
      setFilteredClients(clients);
      return;
    }
    const s = search.toLowerCase();
    setFilteredClients(
      clients.filter(c =>
        c.first_name?.toLowerCase().includes(s) ||
        c.last_name?.toLowerCase().includes(s) ||
        c.email?.toLowerCase().includes(s)
      )
    );
  };

  const fetchOnboardingResponses = useCallback(async (userId: string) => {
    setLoadingResponses(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-onboarding-responses?userId=${userId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );
      if (!res.ok) {
        setOnboardingResponses([]);
        return;
      }
      const data = await res.json();
      setOnboardingResponses(Array.isArray(data) ? data : []);
    } catch {
      setOnboardingResponses([]);
    } finally {
      setLoadingResponses(false);
    }
  }, []);

  const fetchInvoices = useCallback(async (userId: string) => {
    setLoadingInvoices(true);
    try {
      const data = await fetchInvoicesByUser(userId);
      setInvoices(data);
    } catch {
      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  }, []);

  const openClientDetail = (client: ClientUser) => {
    setSelectedClient(client);
    fetchOnboardingResponses(client.id);
    fetchInvoices(client.id);
  };

  const fullName = (c: ClientUser) =>
    [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email?.split('@')[0] || '—';

  const formatDate = (iso: string) =>
    iso ? new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  const formatDateTime = (iso: string) =>
    iso
      ? new Date(iso).toLocaleDateString('cs-CZ', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  // ── Detail card view ──
  if (selectedClient) {
    const d1Response = onboardingResponses.find(r => r.day_number === 1);
    const sortedResponses = [...onboardingResponses].sort((a, b) => a.day_number - b.day_number);

    return (
      <AdminLayout title="Klientská karta" subtitle={fullName(selectedClient)}>
        <button
          onClick={() => setSelectedClient(null)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zpět na seznam klientů
        </button>

        {/* ── Card header: basic info ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
          <div className="px-6 py-5 border-b border-gray-50" style={{ background: 'linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%)' }}>
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                style={{ backgroundColor: TEAL }}
              >
                {(selectedClient.first_name?.[0] || selectedClient.email?.[0] || '?').toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-gray-900">{fullName(selectedClient)}</h2>
                <p className="text-sm text-gray-500">
                  Registrován {formatDate(selectedClient.created_at)}
                  {selectedClient.subscription_plan && ` · ${selectedClient.subscription_plan}`}
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-gray-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Jméno</p>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedClient.first_name || '—'} {selectedClient.last_name || ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-gray-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">E-mail</p>
                <p className="text-sm font-medium text-gray-900 truncate">{selectedClient.email || '—'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4 text-gray-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Telefon</p>
                <p className="text-sm font-medium text-gray-900 truncate">{selectedClient.phone || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Onboarding section ── */}
        <ClientCardSection
          title="Odpovědi z onboardingu"
          icon={<FileText className="w-4 h-4" />}
        >
          {loadingResponses ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sortedResponses.length === 0 ? (
            <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
              <Calendar className="w-4 h-4" />
              Zatím bez odpovědi
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {sortedResponses.map((response) => (
                <OnboardingResponseItem key={response.id} response={response} formatDateTime={formatDateTime} />
              ))}
            </ul>
          )}
        </ClientCardSection>

        {/* Invoices */}
        <ClientCardSection title="Faktury" icon={<FileText className="w-4 h-4" />}>
          {loadingInvoices ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
              <FileText className="w-4 h-4" />
              Zatím bez faktur
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {invoices.map((inv) => (
                <li key={inv.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">{inv.invoice_number}</span>
                      {inv.subscription_type && (
                        <Badge variant="info">{inv.subscription_type}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {inv.product_name} · {(inv.amount / 100).toLocaleString('cs-CZ')} {inv.currency}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Vystaveno {new Date(inv.issued_at).toLocaleDateString('cs-CZ')}
                    </p>
                  </div>
                  <button
                    onClick={() => setPreviewInvoice(inv)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors flex-shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Náhled
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ClientCardSection>
        {previewInvoice && (
          <InvoicePreviewModal invoice={previewInvoice} onClose={() => setPreviewInvoice(null)} />
        )}
      </AdminLayout>
    );
  }

  // ── Client list view ──
  return (
    <AdminLayout title="Klientské karty" subtitle={`Celkem ${filteredClients.length} klientů`}>
      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Hledat jméno, příjmení nebo email..."
            value={searchTerm}
            onChange={(e) => filterClients(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Načítám klienty...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-sm text-gray-400">Žádní klienti nenalezeni</p>
        </div>
      ) : (
        <SectionCard>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Jméno</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Příjmení</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Plán</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => openClientDetail(client)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: TEAL }}
                        >
                          {(client.first_name?.[0] || client.email?.[0] || '?').toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{client.first_name || '—'}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-gray-600">{client.last_name || '—'}</td>
                    <td className="py-3 text-sm text-gray-500 max-w-[200px] truncate">{client.email || '—'}</td>
                    <td className="py-3">
                      {client.subscription_plan ? (
                        <Badge variant={client.subscription_plan === 'Legend' ? 'success' : 'info'}>
                          {client.subscription_plan}
                        </Badge>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filteredClients.map((client) => (
              <button
                key={client.id}
                onClick={() => openClientDetail(client)}
                className="w-full text-left border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: TEAL }}
                  >
                    {(client.first_name?.[0] || client.email?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{fullName(client)}</p>
                    <p className="text-xs text-gray-400 truncate">{client.email}</p>
                  </div>
                </div>
                {client.subscription_plan && (
                  <Badge variant={client.subscription_plan === 'Legend' ? 'success' : 'info'}>
                    {client.subscription_plan}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </SectionCard>
      )}
    </AdminLayout>
  );
}

// ── Reusable section wrapper for the client card ──
function ClientCardSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
        {icon && <span className="text-teal-600">{icon}</span>}
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}

// ── Single onboarding response item (list item, not table row) ──
function OnboardingResponseItem({
  response,
  formatDateTime,
}: {
  response: OnboardingResponse;
  formatDateTime: (iso: string) => string;
}) {
  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: TEAL }}
          >
            D{response.day_number}
          </span>
          {response.skipped && (
            <Badge variant="warning">Přeskočeno</Badge>
          )}
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {formatDateTime(response.responded_at)}
        </span>
      </div>
      <p className="text-sm font-medium text-gray-700 mb-1.5">{response.question_text}</p>
      <p className="text-sm text-gray-900 bg-gray-50 rounded-lg px-3 py-2">
        {response.selected_option || '—'}
      </p>
    </li>
  );
}
