import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, MessageSquare } from 'lucide-react';

interface Activity {
  id: string;
  author_id: string;
  activity_type: 'lesson_completed' | 'forum_post';
  lesson_title?: string;
  category?: string;
  created_at: string;
}

interface User {
  id: string;
  name: string;
}

export const ActivityFeed = () => {
  const [activities, setActivities] = useState<(Activity & { user?: User })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    const { data: activitiesData } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (activitiesData) {
      const userIds = [...new Set(activitiesData.map(a => a.author_id))];
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name')
        .in('id', userIds);

      const activitiesWithUsers = activitiesData.map(activity => ({
        ...activity,
        user: usersData?.find(u => u.id === activity.author_id)
      }));

      setActivities(activitiesWithUsers);
    }
    setLoading(false);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'právě teď';
    if (diffMins < 60) return `před ${diffMins} min`;
    if (diffHours < 24) return `před ${diffHours} h`;
    return `před ${diffDays} dny`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Poslední aktivita</h3>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Poslední aktivita</h3>
        <p className="text-gray-500 text-center py-8">Zatím žádné aktivity</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Poslední aktivita</h3>
      <div className="space-y-4">
        {activities.map(activity => (
          <div key={activity.id} className="flex gap-3 items-start">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              activity.activity_type === 'lesson_completed'
                ? 'bg-teal-100'
                : 'bg-blue-100'
            }`}>
              {activity.activity_type === 'lesson_completed' ? (
                <CheckCircle className="w-5 h-5 text-teal-600" />
              ) : (
                <MessageSquare className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                {activity.activity_type === 'lesson_completed' ? (
                  <>
                    <span className="font-medium">{activity.user?.name || 'Uživatel'}</span>
                    {' '}právě dokončil lekci{' '}
                    <span className="font-medium">{activity.lesson_title}</span>
                  </>
                ) : (
                  <>
                    <span className="font-medium">{activity.user?.name || 'Uživatel'}</span>
                    {' '}přidal nový příspěvek v sekci{' '}
                    <span className="font-medium">{activity.category}</span>
                  </>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {getTimeAgo(activity.created_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
