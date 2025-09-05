import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from './supabase';

export default function ProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_public_profile', { p_user_id: id });
      if (!cancelled) {
        if (error) {
          console.error('Profile fetch error', error);
          setProfile(null);
        } else {
          setProfile(data?.[0] || null);
        }
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  const displayName =
    profile?.company_name || profile?.full_name || 'Service Provider';

  // Build public avatar URL if you store "userId/filename.ext" in avatar_url
  const avatarUrl = profile?.avatar_url
    ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl
    : null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{loading ? 'Loading…' : displayName}</h1>
          <Link to="/" className="text-blue-600 hover:underline">Back to Dashboard</Link>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl">👤</div>
              )}
            </div>
            <div>
              <p className="text-lg font-semibold">{displayName}</p>
              {/* Future: ratings, location, badges */}
            </div>
          </div>

          {/* Future sections:
             - About / Bio
             - Recent jobs completed
             - Average rating
          */}
          {!loading && !profile && (
            <p className="mt-6 text-gray-600">This profile could not be found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
