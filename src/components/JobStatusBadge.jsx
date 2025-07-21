import React from 'react';

const JobStatusBadge = ({ job, currentUserId, userRole }) => {
  // Customer View Logic
  if (userRole === 'customer') {
    if (job.status === 'completed') {
      return <span className="text-xs font-bold uppercase px-2 py-1 bg-gray-300 text-gray-800 rounded-full">Complete</span>;
    }
    if (job.provider_id) {
      return <span className="text-xs font-bold uppercase px-2 py-1 bg-green-200 text-green-800 rounded-full">Accepted</span>;
    }
    return <span className="text-xs font-bold uppercase px-2 py-1 bg-blue-200 text-blue-800 rounded-full">Listed</span>;
  }

  // Service Provider View Logic
  if (userRole === 'service_provider') {
    if (job.status === 'completed') {
      return (
        <span className="text-xs font-bold uppercase px-2 py-1 bg-gray-300 text-gray-800 rounded-full">
          Completed
        </span>
      );
    }
    if (job.provider_id === currentUserId) {
      return (
        <span className="text-xs font-bold uppercase px-2 py-1 bg-green-200 text-green-800 rounded-full">
          You Accepted
        </span>
      );
    }
    if (job.provider_id) {
      return (
        <span className="text-xs font-bold uppercase px-2 py-1 bg-red-200 text-red-800 rounded-full">
          Taken
        </span>
      );
    }
    return (
      <span className="text-xs font-bold uppercase px-2 py-1 bg-blue-200 text-blue-800 rounded-full">
        Open
      </span>
    );
  }

  return null; // Return nothing if the role is neither
};

export default JobStatusBadge;