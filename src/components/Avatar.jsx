import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export default function Avatar({ url, onUpload }) {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Effect to get the public URL of the avatar when the component loads
  useEffect(() => {
    if (url) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(url);
      setAvatarUrl(data.publicUrl);
    }
  }, [url]);

  async function uploadAvatar(event) {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      // Use the user's ID for the filename to ensure it's unique and easy to find
      const { data: { user } } = await supabase.auth.getUser();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      // When upload is successful, call the onUpload function with the new file path
      onUpload(filePath);
    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="w-24 h-24">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover border border-gray-300"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-200 border border-gray-300" />
        )}
      </div>
      <div>
        <label htmlFor="single" className="cursor-pointer px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm">
          {uploading ? 'Uploading…' : 'Upload Photo'}
        </label>
        <input
          className="hidden"
          type="file"
          id="single"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
        />
        <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 10MB.</p>
      </div>
    </div>
  );
}