import { useState } from "react";
import { supabase } from "../supabase";
import { validateJobForm, getToday, getMaxDate } from "../utils/validation";
import { toast } from "react-hot-toast";
import LocationAutocomplete from "../components/LocationAutocomplete";

function EditView({ job, onCancel, onUpdate, isGoogleMapsLoaded }) {
  const [title, setTitle] = useState(job.title);
  const [description, setDescription] = useState(job.description || "");
  const [location, setLocation] = useState(job.location || "");
  const [date, setDate] = useState(job.date || "");
  const [time, setTime] = useState(job.time || "");
  const [budget, setBudget] = useState(job.budget || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isValid, message: validationMessage } = validateJobForm({ title, date, time, budget });
    if (!isValid) {
      toast.error(validationMessage);
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("jobs")
      .update({ title, description, location, date, time, budget: budget ? parseFloat(budget) : null })
      .eq("id", job.id)
      .select().single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      onUpdate(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="edit-job-title" className="block text-sm font-medium text-gray-700">Title</label>
        <input id="edit-job-title" className="mt-1 w-full p-2 border rounded" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="edit-job-description" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea id="edit-job-description" className="mt-1 w-full p-2 border rounded" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div>
        <label htmlFor="job-location" className="block text-sm font-medium text-gray-700">Location</label>
        <LocationAutocomplete onSelectAddress={setLocation} isLoaded={isGoogleMapsLoaded} />
      </div>

      <div>
        <label htmlFor="edit-job-date" className="block text-sm font-medium text-gray-700">Date required</label>
        <input id="edit-job-date" className="mt-1 w-full p-2 border rounded" type="date" value={date} onChange={(e) => setDate(e.target.value)} min={getToday()} max={getMaxDate()} required />
      </div>
      <div>
        <label htmlFor="edit-job-time" className="block text-sm font-medium text-gray-700">Time required</label>
        <input id="edit-job-time" className="mt-1 w-full p-2 border rounded" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="edit-job-budget" className="block text-sm font-medium text-gray-700">Budget (£)</label>
        <input id="edit-job-budget" className="mt-1 w-full p-2 border rounded" type="number" step="0.01" min="0" max="999" value={budget} onChange={(e) => setBudget(e.target.value)} />
      </div>

      <div className="flex justify-end gap-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

export default function JobActionModal({ job, onClose, onUpdate, onDelete, isGoogleMapsLoaded }) {
  const [mode, setMode] = useState('view');
  const handleDelete = () => {
    onDelete(job.id);
  };

  const detailItem = (label, value, isCurrency = false) => (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-gray-900">{value ? (isCurrency ? `£${value}`: value) : <span className="text-gray-400">Not specified</span>}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        
        {mode === 'edit' ? (
          <>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Job</h2>
            <EditView job={job} onCancel={() => setMode('view')} onUpdate={onUpdate} isGoogleMapsLoaded={isGoogleMapsLoaded} />
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Job Details</h2>
            <div className="space-y-4 mb-6">
              {detailItem("Title", job.title)}
              {detailItem("Description", job.description)}
              {detailItem("Location", job.location)}
              {detailItem("Date", new Date(job.date).toLocaleDateString())}
              {detailItem("Time", job.time)}
              {detailItem("Budget", job.budget, true)}
            </div>

            {mode === 'view' && (
              <div className="flex justify-end gap-4">
                <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Close</button>
                <button onClick={() => setMode('confirm-delete')} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                <button onClick={() => setMode('edit')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Edit</button>
              </div>
            )}

            {mode === 'confirm-delete' && (
              <div>
                <p className="text-center font-medium mb-4">Are you sure you want to delete this job?</p>
                <div className="flex justify-end gap-4">
                  <button onClick={() => setMode('view')} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Cancel</button>
                  <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Confirm Delete</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}