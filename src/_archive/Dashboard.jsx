// src/Dashboard.jsx
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import JobForm from "./JobForm";
import JobList from "./JobList";

export default function Dashboard({ session }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = session.user;

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) setJobs(data);
    setLoading(false);
  };

  useEffect(() => {
    if (user?.id) fetchJobs();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const addJobToList = (newJob) => {
    setJobs((prevJobs) => [newJob, ...prevJobs]);
  };

  const removeJobFromList = (deletedJobId) => {
    setJobs((prevJobs) => prevJobs.filter((job) => job.id !== deletedJobId));
  };

  const updateJobInList = (updatedJob) => {
    setJobs((prevJobs) =>
      prevJobs.map((j) => (j.id === updatedJob.id ? updatedJob : j))
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">CleanerApp Dashboard</h1>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600">Signed in as: {user.email}</p>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-2 px-4 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="py-8">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="mt-8">
            <JobForm user={user} onNewJob={addJobToList} />
          </div>

          <div className="mt-12">
            <h2 className="text-lg font-semibold text-gray-800">My Posted Jobs</h2>
            <div className="mt-4">
              {loading ? (
                <p className="text-gray-500">Loading jobs...</p>
              ) : (
                <JobList
                  jobs={jobs}
                  onDeleteJob={removeJobFromList}
                  onEditJob={updateJobInList}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
