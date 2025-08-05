import React from 'react';
import JobStatusBadge from './components/JobStatusBadge';
import TaskSummaryBadge from './components/TaskSummaryBadge';

export default function JobList({ jobs, loading, onSelectJob, currentUserId, userRole }) {
  if (loading) {
    return <p className="text-gray-500">Loading jobs...</p>;
  }

  if (!jobs || jobs.length === 0) {
    const message = userRole === 'customer' ? "You haven't posted any jobs yet." : "No jobs are currently available.";
    return <p className="text-gray-500">{message}</p>;
  }

  return (
    <ul className="space-y-4">
      {jobs.map((job) => (
        <li
          key={job.id}
          onClick={() => onSelectJob(job)}
          className="p-4 bg-white shadow-md rounded-md border cursor-pointer hover:border-blue-500 transition-colors"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{job.location}</p>
              <TaskSummaryBadge job={job} className="mt-2" />
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <p className="text-lg font-semibold text-gray-800">
                {job.budget ? `£${job.budget}` : 'No budget set'}
              </p>
              <div className="mt-2">
                <JobStatusBadge job={job} currentUserId={currentUserId} userRole={userRole} />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}