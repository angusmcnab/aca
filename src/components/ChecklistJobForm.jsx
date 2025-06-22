import { useState } from 'react';
import { toast } from 'react-hot-toast';

// We can add the Google Location Autocomplete back here later
// import LocationAutocomplete from "./LocationAutocomplete";

// Make sure 'export default' is here
export default function ChecklistJobForm({ user, onPostJob, isGoogleMapsLoaded }) {
  // State for the main job details
  const [title, setTitle] = useState('');
  // const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [budget, setBudget] = useState('');

  // State for the individual task being added
  const [currentCategory, setCurrentCategory] = useState('');
  const [currentTask, setCurrentTask] = useState('');
  
  // State to hold the list of tasks for this job
  const [tasks, setTasks] = useState([]);

  const handleAddTask = () => {
    if (!currentTask.trim()) return; // Don't add empty tasks
    const newTask = {
      id: Date.now(), // Use timestamp for a temporary unique key
      category: currentCategory.trim() || 'General', // Default category if empty
      task_description: currentTask.trim(),
    };
    setTasks([...tasks, newTask]);
    // Clear the inputs for the next task
    setCurrentTask('');
  };

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const jobData = {
      title,
      // location,
      date,
      time,
      budget: budget ? parseFloat(budget) : null,
      client_id: user.id, // We need to include the user's ID
      tasks, // The array of task objects
    };
    console.log("Submitting Job Data:", jobData);
    // In the next step, we will replace the console.log with the logic
    // to save this data to our 'jobs' and 'job_tasks' tables.
    toast.success("Job submitted to console! (Not saved yet)");
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-md rounded-md border">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Post a New Job</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="job-title" className="block text-sm font-medium text-gray-700">Job Title</label>
          <input id="job-title" className="mt-1 w-full p-2 border rounded" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Weekly Apartment Clean" required />
        </div>
        
        {/* We will re-add Location Autocomplete later */}
        {/*
        <div>
          <label htmlFor="job-location" className="block text-sm font-medium text-gray-700">Location</label>
          <LocationAutocomplete onSelectAddress={setLocation} isLoaded={isGoogleMapsLoaded} />
        </div>
        */}

        <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Checklist of Tasks</h3>
            <div className="p-4 bg-gray-50 rounded-md space-y-3">
                <div className="flex items-end gap-2">
                    <div className="flex-1">
                        <label htmlFor="category" className="block text-xs font-medium text-gray-600">Room / Category</label>
                        <input id="category" className="mt-1 w-full p-2 border rounded" value={currentCategory} onChange={e => setCurrentCategory(e.target.value)} placeholder="e.g., Kitchen" />
                    </div>
                    <div className="flex-grow-[2]">
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

        {/* We will add date, time, and budget back in a later step */}

        <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 font-semibold">Post Job</button>
      </form>
    </div>
  );
}