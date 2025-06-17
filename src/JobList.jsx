import SkeletonJobCard from './components/SkeletonJobCard';

export default function JobList({ jobs, loading, onSelectJob }) {
  // This helper variable will hold the correct content based on the state.
  let content;

  if (loading) {
    content = (
      <ul className="divide-y divide-gray-200">
        {[...Array(5)].map((_, i) => (
          <li key={i}><SkeletonJobCard /></li>
        ))}
      </ul>
    );
  } else if (jobs.length === 0) {
    content = <p className="p-4 text-gray-500">No jobs have been posted yet.</p>;
  } else {
    content = (
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
    );
  }

  // The main component structure is now always the same.
  // We just render the `content` variable inside it.
  return (
    <div className="bg-white shadow border rounded-md">
      <h2 className="text-xl font-semibold text-gray-800 p-4 border-b">Current Jobs</h2>
      {content}
    </div>
  );
}