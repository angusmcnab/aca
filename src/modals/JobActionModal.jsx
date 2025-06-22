import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { toast } from "react-hot-toast";
import { getToday, getMaxDate } from "../utils/validation";
import LocationAutocomplete from "../components/LocationAutocomplete";

function EditView({ job, initialTasks, onCancel, onUpdate }) {
  const [title, setTitle] = useState(job.title);
  const [location, setLocation] = useState(job.location || '');
  const [date, setDate] = useState(job.date || '');
  const [time, setTime] = useState(job.time || '');
  const [budget, setBudget] = useState(job.budget || '');
  const [saving, setSaving] = useState(false);
  const [tasks, setTasks] = useState(initialTasks || []);
  const [currentCategory, setCurrentCategory] = useState('');
  const [currentTask, setCurrentTask] = useState('');

  const handleAddTask = () => {
    if (!currentTask.trim()) return;
    const newTask = {
      id: `temp-${Date.now()}`,
      category: currentCategory.trim() || 'General',
      task_description: currentTask.trim(),
    };
    setTasks([...tasks, newTask]);
    setCurrentTask('');
    setCurrentCategory('');
  };

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const tasksToSave = tasks.map(({ category, task_description }) => ({ category, task_description }));
    const { error } = await supabase.rpc('update_job_with_tasks', {
        p_job_id: job.id, p_title: title, p_location: location,
        p_date: date, p_time: time, p_budget: budget, p_tasks: tasksToSave
    });
    setSaving(false);
    if (error) {
        toast.error(`Failed to save changes: ${error.message}`);
    } else {
        toast.success("Job updated successfully!");
        const updatedJob = { ...job, title, location, date, time, budget };
        onUpdate(updatedJob);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="edit-job-title" className="block text-sm font-medium text-gray-700">Job Title</label>
        <input id="edit-job-title" className="mt-1 w-full p-2 border rounded" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="job-location" className="block text-sm font-medium text-gray-700">Location</label>
        <LocationAutocomplete initialValue={location} onSelectAddress={setLocation} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
              <label htmlFor="edit-job-date" className="block text-sm font-medium text-gray-700">Date</label>
              <input id="edit-job-date" className="mt-1 w-full p-2 border rounded" type="date" value={date} onChange={e => setDate(e.target.value)} min={getToday()} max={getMaxDate()} required />
          </div>
          <div>
              <label htmlFor="edit-job-time" className="block text-sm font-medium text-gray-700">Time</label>
              <input id="edit-job-time" className="mt-1 w-full p-2 border rounded" type="time" value={time} onChange={e => setTime(e.target.value)} required />
          </div>
      </div>
      <div>
        <label htmlFor="edit-job-budget" className="block text-sm font-medium text-gray-700">Budget (£)</label>
        <input id="edit-job-budget" className="mt-1 w-full p-2 border rounded" type="number" step="0.01" min="0" max="999" value={budget} onChange={e => setBudget(e.target.value)} />
      </div>
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Checklist of Tasks</h3>
        <div className="p-4 bg-gray-50 rounded-md space-y-3">
          <div className="flex items-end gap-2">
            <div className="w-1/3">
              <label htmlFor="edit-category" className="block text-xs font-medium text-gray-600">Room / Category</label>
              <input id="edit-category" className="mt-1 w-full p-2 border rounded" value={currentCategory} onChange={e => setCurrentCategory(e.target.value)} placeholder="e.g., Kitchen" />
            </div>
            <div className="w-2/3">
              <label htmlFor="edit-task-description" className="block text-xs font-medium text-gray-600">Task</label>
              <input id="edit-task-description" className="mt-1 w-full p-2 border rounded" value={currentTask} onChange={e => setCurrentTask(e.target.value)} placeholder="e.g., Mop the floor" />
            </div>
            <button type="button" onClick={handleAddTask} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 font-semibold">Add</button>
          </div>
        </div>
        <ul className="mt-4 space-y-2 max-h-48 overflow-y-auto">
          {tasks.map(task => (
            <li key={task.id} className="flex justify-between items-center p-2 bg-white border rounded-md">
              <div>
                <span className="font-semibold text-gray-700">{task.category}:</span>
                <span className="ml-2 text-gray-600">{task.task_description}</span>
              </div>
              <button type="button" onClick={() => handleDeleteTask(task.id)} className="text-red-500 hover:text-red-700 text-sm font-semibold">Remove</button>
            </li>
          ))}
          {tasks.length === 0 && <p className="text-sm text-gray-500 text-center">No tasks for this job.</p>}
        </ul>
      </div>
      <div className="flex justify-end gap-4 border-t pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

export default function JobActionModal({ job, onClose, onUpdate, onDelete, currentUserId }) {
  const [mode, setMode] = useState('view');
  const [tasks, setTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const isOwner = currentUserId === job.client_id;

  useEffect(() => {
    if (!job.id) return;
    const fetchTasks = async () => {
        setIsLoadingTasks(true);
        const { data, error } = await supabase.from('job_tasks').select('*').eq('job_id', job.id).order('created_at');
        if (error) {
            toast.error("Could not fetch job tasks.");
        } else {
            setTasks(data);
        }
        setIsLoadingTasks(false);
    };
    fetchTasks();
  }, [job.id]);

  const handleDelete = () => {
    onDelete(job.id);
  };

  const detailItem = (label, value, isCurrency = false) => (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-gray-900">{value ? (isCurrency ? `£${value}` : value) : <span className="text-gray-400">Not specified</span>}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        
        {mode === 'edit' && isOwner ? (
          <>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Job</h2>
            <EditView job={job} initialTasks={tasks} onCancel={() => setMode('view')} onUpdate={onUpdate} />
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Job Details</h2>
            <div className="space-y-4 mb-6">
                {detailItem("Title", job.title)}
                <div>
                    <p className="text-sm font-medium text-gray-500">Task Checklist</p>
                    <div className="mt-2 border rounded-md">
                        {isLoadingTasks ? (
                            <p className="p-4 text-sm text-gray-500">Loading tasks...</p>
                        ) : tasks.length > 0 ? (
                            <ul className="divide-y divide-gray-200 max-h-48 overflow-y-auto">
                                {tasks.map(task => (
                                    <li key={task.id} className="p-3">
                                        <span className="font-semibold text-gray-700">{task.category}:</span>
                                        <span className="ml-2 text-gray-600">{task.task_description}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="p-4 text-sm text-gray-500">No specific tasks were added for this job.</p>
                        )}
                    </div>
                </div>
                {detailItem("Location", job.location)}
                {detailItem("Date", job.date ? new Date(job.date).toLocaleDateString() : null)}
                {detailItem("Time", job.time)}
                {detailItem("Budget", job.budget, true)}
            </div>
            {/* The block for view-mode buttons and the confirm-delete UI goes here */}
            {mode === 'view' && 
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Close</button>
                    {isOwner && (
                    <>
                        <button onClick={() => setMode('confirm-delete')} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                        <button onClick={() => setMode('edit')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Edit</button>
                    </>
                    )}
                </div>
            }
            {mode === 'confirm-delete' && isOwner && (
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