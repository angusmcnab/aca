// src/components/TaskChecklist.jsx

import { useState } from 'react';
import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';

export default function TaskChecklist({ jobId, userId, tasks, refreshTasks, userRole, providerId }) {
  const [loadingId, setLoadingId] = useState(null);

  // This variable determines if the buttons should be active
  const canMarkTasks = (userRole === 'service_provider' && userId === providerId);

  const handleToggle = async (task) => {
    setLoadingId(task.id);
    const isNowDone = !task.is_done;
    
    const { error } = await supabase
      .from('job_tasks')
      .update({
        is_done: isNowDone,
        completed_at: isNowDone ? new Date().toISOString() : null,
        completed_by: isNowDone ? userId : null,
      })
      .eq('id', task.id);

    if (error) {
      toast.error('Update failed. Please try again.');
    } else {
      toast.success(isNowDone ? 'Task completed!' : 'Task marked as not done.');
      
      const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, is_done: isNowDone } : t);
      const allTasksDone = updatedTasks.every(t => t.is_done);

      if (allTasksDone) {
        await supabase
          .from('jobs')
          .update({ status: 'completed', job_completed_at: new Date().toISOString() })
          .eq('id', jobId);
        toast.success('Job complete! All tasks are done.');
      }

      if (refreshTasks) {
        refreshTasks();
      }
    }
    setLoadingId(null);
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-md"><p className="text-sm text-gray-500">No tasks have been added for this job yet.</p></div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800">Checklist of Tasks</h3>
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li key={task.id} className="flex justify-between items-center border p-3 rounded-lg shadow-sm bg-white">
            <div className="flex-grow">
              <p className="font-bold text-gray-800">{task.category}</p>
              <p className="text-gray-600">{task.task_description}</p>
              {task.is_done && (
                <p className="mt-1 text-xs text-green-600 font-medium">Done at {new Date(task.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              )}
            </div>
            
            {/* The button is now disabled based on the new canMarkTasks variable */}
            <button
              className={`ml-4 px-4 py-2 rounded font-semibold text-sm transition-colors duration-200 ${
                task.is_done 
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } ${!canMarkTasks && 'opacity-50 cursor-not-allowed'}`}
              disabled={loadingId === task.id || !canMarkTasks}
              onClick={() => handleToggle(task)}
              title={!canMarkTasks ? "Only the assigned Service Provider can update tasks." : ""}
            >
              {loadingId === task.id ? '...' : task.is_done ? 'Undo' : 'Mark Done'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}