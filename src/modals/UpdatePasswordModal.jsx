import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function UpdatePasswordModal({ onUpdatePassword }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // The onUpdatePassword function will be passed down from App.jsx
    // and will contain the Supabase logic.
    const error = await onUpdatePassword(password);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated successfully!');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Update Your Password</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="new-password">
              New Password
            </label>
            <input
              id="new-password"
              className="w-full p-2 border rounded mt-1"
              type="password"
              placeholder="Enter your new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 font-semibold disabled:opacity-75"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save New Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}