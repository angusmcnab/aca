import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { toast } from 'react-hot-toast';
import Avatar from './components/Avatar';

export default function Account({ session, onBack }) {
  const [loading, setLoading] = useState(true);
  const [full_name, setFullName] = useState('');
  const [company_name, setCompanyName] = useState('');
  const [avatar_url, setAvatarUrl] = useState('');
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function getProfile() {
      setLoading(true);
      const { user } = session;

      const { data, error } = await supabase
        .from('profiles')
        .select(`full_name, company_name, avatar_url, role`)
        .eq('id', user.id)
        .single();

      if (error) {
        toast.error('Error loading profile data.');
        console.warn(error);
      } else if (data) {
        setFullName(data.full_name || '');
        setCompanyName(data.company_name || '');
        setAvatarUrl(data.avatar_url || '');
        setProfile(data);
      }
      setLoading(false);
    }
    getProfile();
  }, [session]);

  async function updateProfile() {
    setLoading(true);
    const { user } = session;

    const updates = {
      id: user.id,
      full_name,
      company_name,
      avatar_url,
      updated_at: new Date(),
    };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Profile updated successfully!');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-xl mx-auto p-8 bg-white shadow-lg rounded-lg border">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Your Profile</h2>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm"
        >
          &larr; Back to Dashboard
        </button>
      </div>
      
      <div className="space-y-6">
        <Avatar
          url={avatar_url}
          onUpload={(newUrl) => {
            setAvatarUrl(newUrl);
            const currentUpdates = {
              id: session.user.id,
              full_name,
              company_name,
              avatar_url: newUrl,
              updated_at: new Date(),
            };
            supabase.from('profiles').update(currentUpdates).eq('id', session.user.id).then(({error}) => {
                if (error) toast.error("Failed to save avatar.");
                else toast.success("Avatar updated!");
            });
          }}
        />
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input id="email" type="text" value={session.user.email} disabled 
            className="mt-1 w-full p-2 border rounded bg-gray-100 text-gray-500"
          />
        </div>
        
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            id="fullName"
            type="text"
            value={full_name}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full p-2 border rounded"
            placeholder="e.g., Jane Doe"
          />
        </div>
        
        {profile?.role === 'service_provider' && (
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name</label>
            <input
              id="companyName"
              type="text"
              value={company_name}
              onChange={(e) => setCompanyName(e.target.value)}
              className="mt-1 w-full p-2 border rounded"
              placeholder="e.g., Jane's Cleaning Co."
            />
            <p className="mt-1 text-xs text-gray-500">This will be shown to customers. Leave blank to use your full name.</p>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <button
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-75"
            onClick={updateProfile}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Update Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}