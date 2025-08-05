import React from 'react';

export default function TaskSummaryBadge({ job, className = '' }) {
  if (!job || !job.job_tasks) {
    return null;
  }

  const totalTasks = job.job_tasks.length;
  const completedTasks = job.job_tasks.filter(task => task.is_done).length;

  // Don't render the badge if there are no tasks
  if (totalTasks === 0) {
    return null;
  }

  const isComplete = totalTasks > 0 && completedTasks === totalTasks;

  const badgeColor = isComplete
    ? 'bg-green-100 text-green-800'
    : 'bg-gray-100 text-gray-700';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor} ${className}`}>
      <span role="img" aria-label="Tasks" className="mr-1">🧹</span>
      {completedTasks} / {totalTasks} Tasks
    </span>
  );
}