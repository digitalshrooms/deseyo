import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, AlertCircle, CheckCircle } from 'lucide-react';

export function AdminData() {
  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;
      setCourses(coursesData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při načítání dat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Správa dat</h1>
          <p className="text-gray-600">Přehled všech uživatelů a kurzů v Supabase</p>
        </div>

        {error && (
          <div className="flex items-start gap-3 mb-8 p-4 rounded-lg bg-red-50 border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-6 h-6 text-teal-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Uživatelé</h2>
                </div>
                <p className="text-gray-600">Celkem: {users.length} uživatelů</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Jméno</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Plán</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Registrován</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          Žádní uživatelé zatím registrováni
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{user.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-800">
                              {user.subscription_plan}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(user.created_at).toLocaleDateString('cs-CZ')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900">Kurzy</h2>
                <p className="text-gray-600">Celkem: {courses.length} kurzů</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Název</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Kategorie</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Délka (min)</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Premium</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {courses.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          Žádné kurzy zatím
                        </td>
                      </tr>
                    ) : (
                      courses.map((course) => (
                        <tr key={course.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">{course.title}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{course.category}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{course.duration}</td>
                          <td className="px-6 py-4 text-sm">
                            {course.is_premium ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                                <CheckCircle className="w-4 h-4" />
                                Ano
                              </span>
                            ) : (
                              <span className="text-gray-500">Ne</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
