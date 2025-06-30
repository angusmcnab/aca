// src/modals/JobActionModal.jsx

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import { toast } from "react-hot-toast";
import { getToday, getMaxDate, validateJobForm } from "../utils/validation";
import LocationAutocomplete from "../components/LocationAutocomplete";
import TaskChecklist from "../components/TaskChecklist";

// No changes are needed in EditView itself. The protection is now applied before entering this view.
function EditView({ job, initialTasks, onCancel, onUpdate, onClose }) {
  const [title, setTitle] = useState(job.title);
  const [location, setLocation] = useState(job.location || '');
  const [date, setDate] = useState(job.date || '');
  const [time, setTime] = useState(job.time || '');
  const [budget, setBudget] = useState(job.budget ?? '');
  const [saving, setSaving] = useState(false);
  const [tasks, setTasks] = useState(initialTasks || []);
  const [currentCategory, setCurrentCategory] = useState('');
  const [currentTask, setCurrentTask] = useState('');
  const [message, setMessage] = useState('');

  const handleAddTask = () => {
    if (!currentTask.trim()) return;
    const newTask = { id: `temp-${Date.now()}`, category: currentCategory.trim() || 'General', task_description: currentTask.trim(), is_done: false };
    setTasks([...tasks, newTask]);
    setCurrentTask('');
    setCurrentCategory('');
  };

  const handleDeleteTask = (id) => setTasks(tasks.filter(task => task.id !== id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const validation = validateJobForm({ title, date, time, budget });
    if (!validation.isValid) {
      setMessage(validation.message);
      return;
    }
    setSaving(true);
    const tasksToSave = tasks.map(({ category, task_description }) => ({ category, task_description }));
    const { error } = await supabase.rpc('update_job_with_tasks', { p_job_id: job.id, p_title: title, p_location: location, p_date: date, p_time: time, p_budget: parseFloat(budget), p_tasks: tasksToSave });
    
    setSaving(false);
    if (error) {
      toast.error(`Failed to save changes: ${error.message}`);
    } else {
      toast.success("Job updated successfully!");
      const updatedJob = { ...job, title, location, date, time, budget: parseFloat(budget) };
      onUpdate(updatedJob);
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label htmlFor="edit-job-title" className="block text-sm font-medium text-gray-700">Job Title</label><input id="edit-job-title" className="mt-1 w-full p-2 border rounded" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
      <div><label htmlFor="job-location" className="block text-sm font-medium text-gray-700">Location</label><LocationAutocomplete initialValue={location} onSelectAddress={setLocation} /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label htmlFor="edit-job-date" className="block text-sm font-medium text-gray-700">Date</label><input id="edit-job-date" className="mt-1 w-full p-2 border rounded" type="date" value={date} onChange={e => setDate(e.target.value)} min={getToday()} max={getMaxDate()} required /></div><div><label htmlFor="edit-job-time" className="block text-sm font-medium text-gray-700">Time</label><input id="edit-job-time" className="mt-1 w-full p-2 border rounded" type="time" value={time} onChange={e => setTime(e.target.value)} required /></div></div>
      <div><label htmlFor="edit-job-budget" className="block text-sm font-medium text-gray-700">Budget (£)</label><input id="edit-job-budget" className="mt-1 w-full p-2 border rounded" type="number" step="0.01" min="0" max="999" value={budget} onChange={e => setBudget(e.target.value)} required /></div>
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Checklist of Tasks</h3>
        <div className="p-4 bg-gray-50 rounded-md space-y-3"><div className="flex items-end gap-2"><div className="w-1/3"><label htmlFor="edit-category" className="block text-xs font-medium text-gray-600">Room / Category</label><input id="edit-category" className="mt-1 w-full p-2 border rounded" value={currentCategory} onChange={e => setCurrentCategory(e.target.value)} placeholder="e.g., Kitchen" /></div><div className="w-2/3"><label htmlFor="edit-task-description" className="block text-xs font-medium text-gray-600">Task</label><input id="edit-task-description" className="mt-1 w-full p-2 border rounded" value={currentTask} onChange={e => setCurrentTask(e.target.value)} placeholder="e.g., Mop the floor" /></div><button type="button" onClick={handleAddTask} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 font-semibold">Add</button></div></div>
        <ul className="mt-4 space-y-2 max-h-48 overflow-y-auto">{tasks.map(task => (<li key={task.id} className={`flex justify-between items-center p-2 border rounded-md ${task.is_done ? 'bg-gray-100' : 'bg-white'}`}><div><span className={`font-semibold ${task.is_done ? 'text-gray-500 line-through' : 'text-gray-700'}`}>{task.category}:</span><span className={`ml-2 ${task.is_done ? 'text-gray-500 line-through' : 'text-gray-600'}`}>{task.task_description}</span></div><button type="button" onClick={() => handleDeleteTask(task.id)} className="text-red-500 hover:text-red-700 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed" disabled={task.is_done} title={task.is_done ? "Completed tasks cannot be removed." : "Remove Task"}>Remove</button></li>))}{tasks.length === 0 && <p className="text-sm text-gray-500 text-center">No tasks for this job.</p>}</ul>
      </div>
      {message && <p className="text-sm text-center font-medium text-red-600">{message}</p>}
      <div className="flex justify-end gap-4 border-t pt-4"><button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Cancel</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button></div>
    </form>
  );
}

export default function JobActionModal({ job, onClose, onUpdate, onDelete, currentUserId, userRole }) {
  const [mode, setMode] = useState('view');
  const [tasks, setTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const isOwner = currentUserId === job.client_id;
  
  // These variables determine if editing should be allowed.
  const isJobCompleted = job.status === 'completed';
  const hasCompletedTasks = tasks.some(task => task.is_done);
  const canEdit = isOwner && !isJobCompleted && !hasCompletedTasks;

  const fetchTasks = useCallback(async () => {
    if (!job.id) return;
    setIsLoadingTasks(true);
    const { data, error } = await supabase.from('job_tasks').select('*').eq('job_id', job.id).order('created_at');
    if (error) { toast.error("Could not fetch job tasks.") } else { setTasks(data) }
    setIsLoadingTasks(false);
  }, [job.id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, job.provider_id]);

  const handleAcceptJob = async () => {
    setIsAccepting(true);
    const { data, error } = await supabase.from('jobs').update({ provider_id: currentUserId, status: 'in_progress' }).eq('id', job.id).is('provider_id', null).select().single();
    if (error || !data) {
      toast.error("Failed to accept job. It may have already been taken.");
    } else {
      toast.success("Job accepted!");
      onUpdate(data);
    }
    setIsAccepting(false);
  };

  const handleDelete = () => onDelete(job.id);

  const detailItem = (label, value, isCurrency = false) => (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-gray-900">{value ? (isCurrency ? `£${value}` : value) : <span className="text-gray-400">Not specified</span>}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {mode === 'edit' && canEdit ? (
          <><h2 className="text-xl font-bold text-gray-800 mb-4">Edit Job</h2><EditView job={job} initialTasks={tasks} onCancel={() => setMode('view')} onUpdate={onUpdate} onClose={onClose} /></>
        ) : (
          <>
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Job Details</h2>
              {isJobCompleted && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Completed</span>}
            </div>
            <div className="space-y-4 mb-6">
              {detailItem("Title", job.title)}
              <div>
                {isLoadingTasks ? (<p>Loading tasks...</p>) : (<TaskChecklist jobId={job.id} userId={currentUserId} tasks={tasks} refreshTasks={fetchTasks} userRole={userRole} providerId={job.provider_id} onUpdateJob={onUpdate} />)}
              </div>
              {detailItem("Location", job.location)}
              {detailItem("Date", job.date ? new Date(job.date).toLocaleDateString() : null)}
              {detailItem("Time", job.time)}
              {detailItem("Budget", job.budget, true)}
            </div>
            <div className="flex justify-end gap-4 border-t pt-4">
              <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Close</button>
              {isOwner && mode === 'view' && (
                <>
                  {/* --- FIX: The `disabled` logic now protects against any completed tasks --- */}
                  <button onClick={() => setMode('confirm-delete')} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isJobCompleted || hasCompletedTasks} title={hasCompletedTasks ? "Cannot delete a job with completed tasks." : ""}>Delete</button>
                  <button onClick={() => setMode('edit')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!canEdit} title={!canEdit ? "Cannot edit a job that is completed or has tasks in progress." : ""}>Edit</button>
                </>
              )}
              {userRole === 'service_provider' && !isOwner && !job.provider_id && (
                <button onClick={handleAcceptJob} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold" disabled={isAccepting}>{isAccepting ? 'Accepting...' : 'Accept Job'}</button>
              )}
            </div>
            {mode === 'confirm-delete' && isOwner && (
              <div className="mt-4"><p className="text-center font-medium mb-4">Are you sure you want to delete this job?</p><div className="flex justify-end gap-4"><button onClick={() => setMode('view')} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Cancel</button><button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Confirm Delete</button></div></div>
            )}
          </>
        )}
      </div>
    </div>
  );
}