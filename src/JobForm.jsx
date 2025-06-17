import { useState } from "react";
import { supabase } from "./supabase";
import { validateJobForm, getToday, getMaxDate } from "./utils/validation";

export default function JobForm({ user, onNewJob }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const { isValid, message: validationMessage } = validateJobForm({ title, date, time, budget });
    if (!isValid) {
      setMessage(validationMessage);
      return;
    }

    if (!user) {
      setMessage("❌ Not authenticated.");
      return;
    }

    const { data: newJob, error } = await supabase
      .from("jobs")
      .insert({
        client_id: user.id,
        title, description, location, date, time,
        budget: budget ? parseFloat(budget) : null,
      })
      .select().single();

    if (error) {
      setMessage(`✅ Job posted successfully.`);
      onNewJob(newJob);
      setTitle(""); setDescription(""); setLocation("");
      setDate(""); setTime(""); setBudget("");
    } else if (error) {
      setMessage(`❌ ${error.message}`);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-md rounded-md border">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Post a New Job</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* --- Using Labels instead of Placeholders --- */}

        <div>
          <label htmlFor="job-title" className="block text-sm font-medium text-gray-700">Title</label>
          <input id="job-title" className="mt-1 w-full p-2 border rounded" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>

        <div>
          <label htmlFor="job-description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea id="job-description" className="mt-1 w-full p-2 border rounded" value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        <div>
          <label htmlFor="job-location" className="block text-sm font-medium text-gray-700">Location</label>
          <input id="job-location" className="mt-1 w-full p-2 border rounded" value={location} onChange={e => setLocation(e.target.value)} />
        </div>
        
        <div>
          <label htmlFor="job-date" className="block text-sm font-medium text-gray-700">Date required</label>
          <input id="job-date" className="mt-1 w-full p-2 border rounded" type="date" value={date} onChange={e => setDate(e.target.value)} min={getToday()} max={getMaxDate()} required />
        </div>

        <div>
          <label htmlFor="job-time" className="block text-sm font-medium text-gray-700">Time required</label>
          <input id="job-time" className="mt-1 w-full p-2 border rounded" type="time" value={time} onChange={e => setTime(e.target.value)} required />
        </div>

        <div>
          <label htmlFor="job-budget" className="block text-sm font-medium text-gray-700">Budget (£)</label>
          <input id="job-budget" className="mt-1 w-full p-2 border rounded" type="number" step="0.01" min="0" max="999" value={budget} onChange={e => setBudget(e.target.value)} />
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-semibold">Post Job</button>
        
        {message && <p className="text-sm text-center font-medium text-red-600">{message}</p>}
      </form>
    </div>
  );
}