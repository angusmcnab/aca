// src/EditJobModal.jsx
import { useState } from "react";
import { supabase } from "./supabase";

export default function EditJobModal({ job, onUpdate, onCancel }) {
  const [title, setTitle] = useState(job.title);
  const [description, setDescription] = useState(job.description);
  const [location, setLocation] = useState(job.location || "");
  const [date, setDate] = useState(job.date || "");
  const [time, setTime] = useState(job.time || "");
  const [budget, setBudget] = useState(job.budget || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // --- Date restriction logic ---
  const getToday = () => new Date().toISOString().split("T")[0];
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 60);
    return maxDate.toISOString().split("T")[0];
  };

  // --- NEW: Robust validation function ---
  const validateForm = () => {
    const todayStr = getToday();
    const maxStr = getMaxDate();
    
    if (!title.trim()) {
      setMessage("❌ Job title is required.");
      return false;
    }
    if (!date) {
      setMessage("❌ Job date is required.");
      return false;
    }
    if (!time) {
      setMessage("❌ Job time is required.");
      return false;
    }
    if (date < todayStr) {
      setMessage("❌ Job date cannot be in the past.");
      return false;
    }
    if (date > maxStr) {
      setMessage("❌ Job date cannot be more than 60 days from now.");
      return false;
    }
    if (budget) {
      const numericBudget = parseFloat(budget);
      if (isNaN(numericBudget)) {
        setMessage("❌ Budget must be a valid number.");
        return false;
      }
      if (numericBudget < 0) {
        setMessage("❌ Budget cannot be negative.");
        return false;
      }
      if (numericBudget > 999) {
        setMessage("❌ Budget cannot exceed £999.");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!validateForm()) {
      return; // Stop if validation fails
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