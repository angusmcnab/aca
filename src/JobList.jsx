export default function JobList({ jobs, onSelectJob }) {
  if (!jobs || jobs.length === 0) {
    return <p>No jobs posted yet.</p>;
  }

  return (
    <div className="bg-white shadow border rounded-md">
      <h2 className="text-xl font-semibold text-gray-800 p-4 border-b">Current Jobs</h2>
      <ul className="divide-y divide-gray-200">
        {jobs.map(job => (
          <li
            key={job.id}
            onClick={() => onSelectJob(job)}
            className="p-4 hover:bg-gray-50 cursor-pointer"
          >
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="font-semibold text-lg text-blue-700">{job.title}</h3>
                    <p className="text-gray-600">{job.location}</p>
                </div>
                <div className="text-right">
                    <p className="font-medium">{new Date(job.date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-500">{job.time}</p>
                </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}