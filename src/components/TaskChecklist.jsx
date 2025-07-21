import React from 'react';

export default function TaskChecklist({ tasks, userId, userRole, providerId, onToggleTask, loadingTaskId }) {
  const canMarkTasks = (userRole === 'service_provider' && userId === providerId);

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-md"><p className="text-sm text-gray-500">No tasks have been added for this job yet.</p></div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800">Checklist of Tasks</h3>
      <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {tasks.map((task) => (
          <li key={task.id} className="flex justify-between items-center border p-3 rounded-lg shadow-sm bg-white">
            <div className="flex-grow">
              <p className={`font-bold text-gray-800 ${task.is_done ? 'line-through text-gray-500' : ''}`}>{task.category}</p>
              <p className={`text-gray-600 ${task.is_done ? 'line-through text-gray-500' : ''}`}>{task.task_description}</p>
              {task.is_done && task.completed_at && (
                <p className="mt-1 text-xs text-green-600 font-medium">Done at {new Date(task.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              )}
            </div>
            
            <button
              className={`ml-4 px-4 py-2 rounded font-semibold text-sm transition-colors duration-200 whitespace-nowrap ${
                task.is_done 
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } ${!canMarkTasks ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loadingTaskId === task.id || !canMarkTasks}
              onClick={() => onToggleTask(task)}
              title={!canMarkTasks ? "Only the assigned Service Provider can update tasks." : ""}
            >
              {loadingTaskId === task.id ? '...' : task.is_done ? 'Undo' : 'Mark Done'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
