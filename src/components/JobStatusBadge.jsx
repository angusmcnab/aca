import React from 'react';

const JobStatusBadge = ({ job, currentUserId, userRole }) => {
  const Badge = ({ tone = 'neutral', children }) => {
    const tones = {
      neutral: 'bg-blue-200 text-blue-800',
      info: 'bg-indigo-200 text-indigo-800',
      warn: 'bg-yellow-200 text-yellow-800',
      success: 'bg-green-200 text-green-800',
      danger: 'bg-red-200 text-red-800',
      muted: 'bg-gray-300 text-gray-800',
    };
    return (
      <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${tones[tone] || tones.neutral}`}>
        {children}
      </span>
    );
  };

  const { provider_id, status, interest_count = 0, interest_limit = 0, my_interest = false } = job || {};

  // ----- Customer view -----
  if (userRole === 'customer') {
    if (status === 'completed') return <Badge tone="muted">Completed</Badge>;
    if (provider_id) return <Badge tone="success">Accepted</Badge>;

    const readyToAssign = interest_limit > 0 && interest_count >= interest_limit;
    if (readyToAssign) return <Badge tone="warn">Ready to assign</Badge>;
    if (interest_count > 0) return <Badge tone="info">Interest received</Badge>;
    return <Badge tone="neutral">Listed</Badge>;
  }

  // ----- Service provider view -----
  if (userRole === 'service_provider') {
    if (status === 'completed') return <Badge tone="muted">Completed</Badge>;
    if (provider_id === currentUserId) return <Badge tone="success">You accepted</Badge>;
    if (provider_id && provider_id !== currentUserId) return <Badge tone="danger">Taken</Badge>;

    if (my_interest) return <Badge tone="info">You're interested</Badge>;
    return <Badge tone="neutral">Open</Badge>;
  }

  return null;
};

export default JobStatusBadge;