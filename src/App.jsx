import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Auth from './Auth';
import JobForm from './JobForm';
import JobList from './JobList';
import JobActionModal from './modals/JobActionModal';
import { Toaster, toast } from 'react-hot-toast';
import { useJsApiLoader } from '@react-google-maps/api';

const libraries = ['places'];

function Header({ session, onLogout }) {
  return (
    <header className="bg-white shadow">
      <div className="max-w-4xl mx-auto py-4 px-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">CleanerApp MkV</h1>
        {session && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session.user.email}</span>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const { isLoaded: isGoogleMapsLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_Maps_API_KEY,
    libraries,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching jobs:', error);
        toast.error('Could not fetch jobs.');
      } else {
        setJobs(data);
      }
      setLoading(false); 
    };
    fetchJobs();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };
  
  const handleNewJob = (newJob) => {
    setJobs(prevJobs => [newJob, ...prevJobs]);
  };
  
  const handleUpdateJob = (updatedJob) => {
    setJobs(prevJobs => prevJobs.map(job => (job.id === updatedJob.id ? updatedJob : job)));
    setSelectedJob(null);
    toast.success('Job updated successfully!');
  };

  const handleDeleteJob = async (jobId) => {
    const { error } = await supabase.from('jobs').delete().eq('id', jobId);
    if (error) {
      toast.error(error.message);
    } else {
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      setSelectedJob(null);
      toast.success('Job deleted successfully!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-center" reverseOrder={false} />
      <Header session={session} onLogout={handleLogout} />

      <main className="max-w-4xl mx-auto py-6">
        {!session ? (
          <Auth />
        ) : (
          <div className="space-y-8">
            <JobForm user={session.user} onNewJob={handleNewJob} isGoogleMapsLoaded={isGoogleMapsLoaded} />
            <JobList jobs={jobs} loading={loading} onSelectJob={setSelectedJob} />
          </div>
        )}
      </main>

      {selectedJob && (
        <JobActionModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onUpdate={handleUpdateJob}
          onDelete={handleDeleteJob}
          isGoogleMapsLoaded={isGoogleMapsLoaded}
        />
      )}
    </div>
  );
}