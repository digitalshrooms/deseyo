import { useState, useEffect } from 'react';
import { Radio, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

const TEAL = '#049FB3';
const BORDER = 'var(--border-strong)';

interface LiveEvent {
  id: string;
  title: string;
  event_type: 'live_session' | 'recording';
  scheduled_at: string | null;
  recorded_at: string | null;
}

type Filter = 'vše' | 'nadcházející' | 'záznamy';

const filters: { id: Filter; label: string }[] = [
  { id: 'vše', label: 'Vše' },
  { id: 'nadcházející', label: 'Nadcházející' },
  { id: 'záznamy', label: 'Záznamy' },
];

export const LiveEvents = () => {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<Filter>('vše');

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    const { data } = await supabase
      .from('live_events')
      .select('id, title, event_type, scheduled_at, recorded_at')
      .order('scheduled_at', { ascending: true });
    if (data) setEvents(data as LiveEvent[]);
    setLoading(false);
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

  const upcoming = events.filter(e => e.event_type === 'live_session');
  const recordings = events.filter(e => e.event_type === 'recording');
  const filtered =
    selectedFilter === 'vše' ? events
    : selectedFilter === 'nadcházející' ? upcoming
    : recordings;

  const heading =
    selectedFilter === 'vše' ? 'Vše'
    : selectedFilter === 'nadcházející' ? 'Nadcházející'
    : 'Záznamy';

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'transparent' }}>
      <div className="mx-auto px-4 pt-6 md:pt-10 pb-12" style={{ maxWidth: 820 }}>

        <div className="flex items-center gap-3 mb-8 md:mb-10">
          <Radio className="w-6 h-6 flex-shrink-0" style={{ color: TEAL }} strokeWidth={1.5} />
          <h1
            className="font-bold leading-none"
            style={{ fontSize: 'clamp(28px, 6vw, 40px)', color: TEAL }}
          >
            Živá setkání
          </h1>
        </div>

        <p className="text-sm font-normal mb-3" style={{ color: 'var(--text)' }}>
          Připoj se k živým lekcím a komunitě. Tady vznikají společné momenty.
        </p>
        <div className="flex items-start gap-2 mb-8">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
          <p className="text-xs italic leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Záznamy minulých setkání najdeš také v knihovně.
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-center text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
            Filtrovat
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filters.map((f) => {
              const isSelected = selectedFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  className="px-4 py-2.5 rounded-full text-sm font-medium transition-all active:scale-[0.97]"
                  style={{
                    backgroundColor: isSelected ? TEAL : 'transparent',
                    color: isSelected ? '#FFFFFF' : TEAL,
                    border: `1.5px solid ${isSelected ? TEAL : BORDER}`,
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-center text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
            {heading}
          </h2>

          {loading ? (
            <ul className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
              {[1, 2, 3].map(i => (
                <li key={i} className="py-5 animate-pulse">
                  <div className="h-4 w-2/3 rounded" style={{ backgroundColor: 'var(--bg-elevated)' }} />
                </li>
              ))}
            </ul>
          ) : filtered.length > 0 ? (
            <ul className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
              {filtered.map((event, idx) => (
                <li
                  key={event.id}
                  className="py-5 flex items-baseline gap-4 transition-all active:scale-[0.99] hover:opacity-80"
                >
                  <span
                    className="text-sm font-semibold flex-shrink-0 tabular-nums"
                    style={{ color: TEAL }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text)' }}>
                      {event.title}
                    </p>
                    {event.scheduled_at && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(event.scheduled_at)}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Momentálně nejsou naplánovaná žádná setkání</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
