// src/EditJobModal.jsx
import { useState } from "react";
import { supabase } from "./supabase";
// Import all helpers from the validation utility
import { validateJobForm, getToday, getMaxDate } from "./utils/validation";

export default function EditJobModal({ job, onUpdate, onCancel }) {
  const [title, setTitle] = useState(job.title);
  const [description, setDescription] = useState(job.description);
  const [location, setLocation] = useState(job.location || "");
  const [date, setDate] = useState(job.date || "");
  const [time, setTime] = useState(job.time || "");
  const [budget, setBudget] = useState(job.budget || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const { isValid, message: validationMessage } = validateJobForm({ title, date, time, budget });
    if (!isValid) {
      setMessage(validationMessage);
      return;
    }

    setSaving(true);
    const { data, error } = await supabase
      .from("jobs")
      .update({
        title, description, location, date, time,
        budget: budget ? parseFloat(budget) : null,
      })
      .eq("id", job.id)
      .select().single();

    if (error) {
      setMessage(`❌ ${error.message}`);
    } else {
      onUpdate(data);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Edit Job</h2>

        <input className="w-full p-2 border rounded" placeholder="Job Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea className="w-full p-2 border rounded" placeholder="Job Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className="w-full p-2 border rounded" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <input className="w-full p-2 border rounded" type="date" value={date} onChange={(e) => setDate(e.target.value)} min={getToday()} max={getMaxDate()} required />
        <input className="w-full p-2 border rounded" placeholder="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
        <input className="w-full p-2 border rounded" placeholder="Budget (£)" type="number" step="0.01" min="0" max="999" value={budget} onChange={(e) => setBudget(e.target.value)} />

        {message && <p className="text-sm text-center font-medium text-red-600">{message}</p>}

        <div className="flex justify-end gap-4">
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}