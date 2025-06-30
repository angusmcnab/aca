// src/JobList.jsx

import React from 'react';

const JobStatusBadge = ({ job, currentUserId, userRole }) => {
    // Don't show a status for the customer
    if (userRole !== 'service_provider') {
        return null;
    }

    if (job.provider_id) {
        if (job.provider_id === currentUserId) {
            return <span className="text-xs font-bold uppercase px-2 py-1 bg-green-200 text-green-800 rounded-full">You Accepted</span>;
        } else {
            return <span className="text-xs font-bold uppercase px-2 py-1 bg-red-200 text-red-800 rounded-full">Taken</span>;
        }
    } else {
        return <span className="text-xs font-bold uppercase px-2 py-1 bg-blue-200 text-blue-800 rounded-full">Open</span>;
    }
};

export default function JobList({ jobs, loading, onSelectJob, currentUserId, userRole }) {
  if (loading) {
    return <p className="text-gray-500">Loading jobs...</p>;
  }

  if (!jobs || jobs.length === 0) {
    return <p className="text-gray-500">No jobs posted yet.</p>;
  }

  return (
    <ul className="space-y-4">
      {jobs.map(job => (
        <li key={job.id} onClick={() => onSelectJob(job)} className="p-4 bg-white shadow-md rounded-md border cursor-pointer hover:border-blue-500 transition-colors">
          <div className="flex justify-between items-center">
            <div>
                <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                <p className="text-sm text-gray-600">{job.location}</p>
            </div>
            <div className="text-right">
                <p className="text-lg font-semibold text-gray-800">{job.budget ? `£${job.budget}` : 'No budget set'}</p>
                {/* Render the new status badge */}
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