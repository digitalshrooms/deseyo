import { useEffect, useState } from 'react';
import { supabase, User } from '../lib/supabase';
import { Target, X } from 'lucide-react';

interface Props {
  user: User;
}

const AREA_LABELS: Record<string, string> = {
  AREA_FULL_BODY: 'cele telo',
  AREA_NECK_SHOULDER: 'krk a ramena',
  AREA_CHEST_UPPER: 'hrudnik',
  AREA_SPINE: 'patel',
  AREA_CORE: 'stred tela',
  AREA_HIP: 'kycle',
};

const ZONE_LABELS: Record<string, string> = {
  ZONE_UPPER: 'celo a oci',
  ZONE_MIDDLE: 'tvare a rty',
  ZONE_LOWER: 'celist, krk a dekolt',
};

export const PriorityConfirmationBanner = ({ user }: Props) => {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const priority = user.primary_priority_tag ?? 'BODY';
  const dayIndex = user.onboarding_day_index ?? 1;
  const triggerDay = priority === 'BODY' ? 3 : 4;
  const messageKey = `priority_confirm_${priority.toLowerCase()}`;

  useEffect(() => {
    if (dayIndex !== triggerDay) return;

    (async () => {
      const { data } = await supabase
        .from('user_seen_messages')
        .select('message_key')
        .eq('user_id', user.id)
        .eq('message_key', messageKey)
        .maybeSingle();
      setShow(!data);
    })();
  }, [user.id, dayIndex, triggerDay, messageKey]);

  if (!show || dismissed) return null;

  const areaLabel =
    priority === 'BODY'
      ? AREA_LABELS[user.body_area_tag ?? 'AREA_FULL_BODY']
      : user.face_zone_tag
      ? ZONE_LABELS[user.face_zone_tag]
      : 'oblicej';

  const handleDismiss = async () => {
    setDismissed(true);
    await supabase.from('user_seen_messages').upsert(
      { user_id: user.id, message_key: messageKey, seen_at: new Date().toISOString() },
      { onConflict: 'user_id,message_key' }
    );
  };

  return (
    <div className="mb-6 rounded-xl p-4 border border-teal-500/30 flex items-start gap-3" style={{ backgroundColor: 'rgba(162, 182, 185, 0.08)' }}>
      <Target className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#A2B6B9' }} />
      <p className="flex-1 text-sm text-gray-200 leading-relaxed">
        Protoze sis vybrala <strong>{areaLabel}</strong>, zaradili jsme ti lekce pro tuto oblast — pravidelne,
        prolozene{' '}
        {priority === 'BODY' ? 'celotelovym cvicenim' : 'celoobličejovymi lekcemi'}.
      </p>
      <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-200">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
