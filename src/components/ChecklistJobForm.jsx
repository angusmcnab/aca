import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../supabase';
import LocationAutocomplete from "./LocationAutocomplete";
import { getToday, getMaxDate, validateJobForm } from '../utils/validation';

export default function ChecklistJobForm({ user, onPostJob, isGoogleMapsLoaded }) {
  // State for the main job details - all fields are now back
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);

  // State for the individual task being added
  const [currentCategory, setCurrentCategory] = useState('');
  const [currentTask, setCurrentTask] = useState('');
  
  // State to hold the list of tasks for this job
  const [tasks, setTasks] = useState([]);

  const handleAddTask = () => {
    if (!currentTask.trim()) return;
    const newTask = {
      id: Date.now(),
      category: currentCategory.trim() || 'General',
      task_description: currentTask.trim(),
    };
    setTasks([...tasks, newTask]);
    // FIX 1: Clear both the task and category inputs
    setCurrentTask('');
    setCurrentCategory('');
  };

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Use our validation utility again
    const { isValid, message } = validateJobForm({ title, date, time, budget });
    if (!isValid) {
        toast.error(message);
        return;
    }
    if (tasks.length === 0) {
        toast.error('Please add at least one task to the checklist.');
        return;
    }

    setLoading(true);

    // FIX 2: The insert statement now includes all job details
    const { data: newJob, error: jobError } = await supabase
      .from('jobs')
      .insert({
        title: title.trim(),
        client_id: user.id,
        location,
        date,
        time,
        budget: budget ? parseFloat(budget) : null,
      })
      .select()
      .single();

    if (jobError) {
      toast.error(jobError.message);
      setLoading(false);
      return;
    }

    const tasksToInsert = tasks.map(task => ({
      job_id: newJob.id,
      category: task.category,
      task_description: task.task_description,
    }));

    const { error: tasksError } = await supabase
        .from('job_tasks')
        .insert(tasksToInsert);

    if (tasksError) {
        toast.error(`Job was created, but tasks failed to save: ${tasksError.message}`);
        setLoading(false);
        return;
    }

    toast.success('Job posted successfully!');
    onPostJob(newJob);

    // Reset the entire form
    setTitle('');
    setLocation('');
    setDate('');
    setTime('');
    setBudget('');
    setTasks([]);
    setCurrentCategory('');
    setCurrentTask('');
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-md rounded-md border">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Post a New Job</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="job-title" className="block text-sm font-medium text-gray-700">Job Title</label>
          <input id="job-title" className="mt-1 w-full p-2 border rounded" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Weekly Apartment Clean" required />
        </div>
        
        <div>
          <label htmlFor="job-location" className="block text-sm font-medium text-gray-700">Location</label>
          <LocationAutocomplete onSelectAddress={setLocation} isLoaded={isGoogleMapsLoaded} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label htmlFor="job-date" className="block text-sm font-medium text-gray-700">Date</label>
                <input id="job-date" className="mt-1 w-full p-2 border rounded" type="date" value={date} onChange={e => setDate(e.target.value)} min={getToday()} max={getMaxDate()} required />
            </div>
            <div>
                <label htmlFor="job-time" className="block text-sm font-medium text-gray-700">Time</label>
                <input id="job-time" className="mt-1 w-full p-2 border rounded" type="time" value={time} onChange={e => setTime(e.target.value)} required />
            </div>
            <div>
                <label htmlFor="job-budget" className="block text-sm font-medium text-gray-700">Budget (£)</label>
                <input id="job-budget" className="mt-1 w-full p-2 border rounded" type="number" step="0.01" min="0" max="999" value={budget} onChange={e => setBudget(e.target.value)} />
            </div>
        </div>

        <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Checklist of Tasks</h3>
            <div className="p-4 bg-gray-50 rounded-md space-y-3">
                <div className="flex items-end gap-2">
                    {/* FIX 3: Adjusted widths for a better layout */}
                    <div className="w-1/3">
                        <label htmlFor="category" className="block text-xs font-medium text-gray-600">Room / Category</label>
                        <input id="category" className="mt-1 w-full p-2 border rounded" value={currentCategory} onChange={e => setCurrentCategory(e.target.value)} placeholder="e.g., Kitchen" />
                    </div>
                    <div className="w-2/3">
                        <label htmlFor="task-description" className="block text-xs font-medium text-gray-600">Task</label>
                        <input id="task-description" className="mt-1 w-full p-2 border rounded" value={currentTask} onChange={e => setCurrentTask(e.target.value)} placeholder="e.g., Mop the floor" />
                    </div>
                    <button type="button" onClick={handleAddTask} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 font-semibold">Add</button>
                </div>
            </div>
            <ul className="mt-4 space-y-2">
                {tasks.map(task => (
                    <li key={task.id} className="flex justify-between items-center p-2 bg-white border rounded-md">
                        <div>
                            <span className="font-semibold text-gray-700">{task.category}:</span>
                            <span className="ml-2 text-gray-600">{task.task_description}</span>
                        </div>
                        <button type="button" onClick={() => handleDeleteTask(task.id)} className="text-red-500 hover:text-red-700 text-sm font-semibold">Remove</button>
                    </li>
                ))}
                {tasks.length === 0 && <p className="text-sm text-gray-500 text-center">No tasks added yet.</p>}
            </ul>
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 font-semibold" disabled={loading}>
          {loading ? 'Posting...' : 'Post Job'}
        </button>
      </form>
    </div>
  );
}