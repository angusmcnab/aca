
import { useState } from 'react';
import './index.css';

const mockJobs = [
  { id: 1, customer: 'Alice', location: 'Perth', date: '2024-06-01', time: '10:00', status: 'Unassigned' },
  { id: 2, customer: 'Bob', location: 'Stirling', date: '2024-06-02', time: '14:00', status: 'Assigned', cleaner: 'Sarah' }
];

function App() {
  const [jobs] = useState(mockJobs);

  return (
    <div className="p-6 font-sans">
      <h1 className="text-3xl font-bold mb-4">ACA v2 – Job Requests</h1>
      <ul className="space-y-4">
        {jobs.map(job => (
          <li key={job.id} className="p-4 bg-white rounded shadow">
            <div className="text-xl font-semibold">{job.customer}</div>
            <div className="text-gray-600">{job.location} • {job.date} at {job.time}</div>
            <div className="mt-2">
              Status: <span className={\`font-semibold \${job.status === 'Unassigned' ? 'text-red-600' : 'text-green-600'}\`}>{job.status}</span>
              {job.cleaner && <span> → {job.cleaner}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
