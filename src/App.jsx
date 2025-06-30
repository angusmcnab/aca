import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Auth from './Auth';
import JobForm from './JobForm';
import JobList from './JobList';
import JobActionModal from './modals/JobActionModal';
import UpdatePasswordModal from './modals/UpdatePasswordModal';
import { Toaster, toast } from 'react-hot-toast';

function Header({ session, onLogout }) {
  return (
    <header className="bg-white shadow">
      <div className="max-w-4xl mx-auto py-4 px-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">CleanerApp MkV</h1>
        {session && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session.user.email}</span>
            <button onClick={onLogout} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold">Logout</button>
          </div>
        )}
      </div>
    </header>
  );
}

function ClientDashboard({ user, jobs, loading, onSelectJob, onNewJob, currentUserId, userRole }) {
  return (
    <div className="space-y-8">
      <JobForm user={user} onNewJob={onNewJob} />
      <JobList jobs={jobs} loading={loading} onSelectJob={onSelectJob} currentUserId={currentUserId} userRole={userRole} />
    </div>
  );
}

function CleanerDashboard({ jobs, loading, onSelectJob, currentUserId, userRole }) {
  return (
    <div className="bg-white shadow border rounded-md p-6">
      <h2 className="text-2xl font-bold text-gray-800">Available Jobs</h2>
      <p className="mt-2 text-gray-600">This is where a cleaner will see a list of jobs to accept.</p>
      <JobList jobs={jobs} loading={loading} onSelectJob={onSelectJob} currentUserId={currentUserId} userRole={userRole} />
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setShowUpdatePassword(true);
      setSession(session);
      if (event === 'SIGNED_OUT') setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      const fetchProfile = async () => {
        const { data, error } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (error) {
          toast.error('Error fetching user profile.');
        } else {
          setProfile(data);
        }
      };
      fetchProfile();

      const fetchJobs = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
        if (error) {
          toast.error('Could not fetch jobs.');
        } else {
          setJobs(data);
        }
        setLoading(false);
      };
      fetchJobs();
    }
  }, [session]);

  const handleUpdatePassword = async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) setShowUpdatePassword(false);
    return error;
  };

const handleLogout = async () => {
  await supabase.auth.signOut();
  // Explicitly clear all local state to force a re-render to the login page
  setSession(null);
  setProfile(null);
  setJobs([]);
  setSelectedJob(null);
};

  const handleNewJob = (newJob) => {
    // FIX #1: Use the correct variable name 'prevJobs'
    setJobs(prevJobs => [newJob, ...prevJobs]);
  };

  const handleUpdateJob = (updatedJob) => {
    // FIX #1: Use the correct variable name 'prevJobs'
    setJobs(prevJobs => prevJobs.map(job => job.id === updatedJob.id ? updatedJob : job));
    if (selectedJob?.id === updatedJob.id) {
      setSelectedJob(updatedJob);
    }
  };

  const handleDeleteJob = async (jobId) => {
    const { error } = await supabase.from("jobs").delete().eq("id", jobId);
    if (error) {
      toast.error(`Failed to delete job: ${error.message}`);
    } else {
      toast.success("Job deleted!");
      setJobs(jobs.filter(job => job.id !== jobId));
      setSelectedJob(null);
    }
  };

  const renderDashboard = () => {
    if (!profile) return <div className="text-center p-4">Loading user profile...</div>;

    // Correctly checks for 'customer' and 'service_provider'
    if (profile.role === 'customer') {
      return (
        <ClientDashboard
          user={session.user}
          jobs={jobs}
          loading={loading}
          onSelectJob={setSelectedJob}
          onNewJob={handleNewJob}
          currentUserId={session.user.id}
          userRole={profile.role}
        />
      );
    } else if (profile.role === 'service_provider') {
      return (
        <CleanerDashboard
          jobs={jobs}
          loading={loading}
          onSelectJob={setSelectedJob}
          currentUserId={session.user.id}
          userRole={profile.role}
        />
      );
    } else {
      return <div className="text-center p-4">Unknown user role. Please contact support.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-center" reverseOrder={false} />
      <Header session={session} onLogout={handleLogout} />
      <main className="max-w-4xl mx-auto py-6">
        {!session ? <Auth /> : renderDashboard()}
      </main>

      {/* FIX #2: Added '&& profile' check to prevent crash before profile loads */}
      {selectedJob && profile && (
        <JobActionModal
          job={selectedJob}
          currentUserId={session?.user?.id}
          userRole={profile?.role}
          onClose={() => setSelectedJob(null)}
          onUpdate={handleUpdateJob}
          onDelete={handleDeleteJob}
        />
      )}

      {showUpdatePassword && (
        <UpdatePasswordModal onUpdatePassword={handleUpdatePassword} />
      )}
    </div>
  );
}