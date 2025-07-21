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

  // Auth handler
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setShowUpdatePassword(true);
      setSession(session);
      if (event === 'SIGNED_OUT') setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Initial fetch + realtime listener
  useEffect(() => {
    if (!session) return;

    const fetchInitialData = async () => {
      setLoading(true);
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (profileError) toast.error('Error fetching user profile.');
      else setProfile(profileData);

      const { data: jobsData, error: jobsError } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
      if (jobsError) toast.error('Could not fetch jobs.');
      else setJobs(jobsData);
      setLoading(false);
    };

    fetchInitialData();

    // Set up Realtime listener
    const jobsChannel = supabase
      .channel('realtime:jobs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, (payload) => {
        setJobs((prevJobs) => {
          if (payload.eventType === 'DELETE') {
            return prevJobs.filter((j) => j.id !== payload.old.id);
          }
          const exists = prevJobs.some((j) => j.id === payload.new.id);
          return exists
            ? prevJobs.map((j) => (j.id === payload.new.id ? payload.new : j))
            : [payload.new, ...prevJobs];
        });

        // Keep modal in sync if open
        setSelectedJob((current) => (current?.id === payload.new?.id ? payload.new : current));
      })
      .subscribe();

    return () => supabase.removeChannel(jobsChannel);
  }, [session]);

  const handleNewJob = (newJob) => {
    setJobs((prevJobs) => [newJob, ...prevJobs]);
  };

  const handleDeleteJob = async (jobId) => {
    const { error } = await supabase.from("jobs").delete().eq("id", jobId);
    if (error) {
      toast.error(`Failed to delete job: ${error.message}`);
    } else {
      toast.success("Job deleted!");
      setSelectedJob(null);
    }
  };

  const handleUpdateJob = (updatedJob) => {
    setJobs((prevJobs) => prevJobs.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
    setSelectedJob(null);
  };

  const handleChecklistUpdate = (updatedJob) => {
    setJobs((prevJobs) => prevJobs.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
    setSelectedJob(updatedJob);
  };

  const renderDashboard = () => {
    if (!profile) return <div className="text-center p-4">Loading user profile...</div>;
    if (profile.role === 'customer') {
      return <ClientDashboard user={session.user} jobs={jobs} loading={loading} onSelectJob={setSelectedJob} onNewJob={handleNewJob} currentUserId={session.user.id} userRole={profile.role} />;
    } else if (profile.role === 'service_provider') {
      return <CleanerDashboard jobs={jobs} loading={loading} onSelectJob={setSelectedJob} currentUserId={session.user.id} userRole={profile.role} />;
    } else {
      return <div className="text-center p-4">Unknown user role. Please contact support.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-center" reverseOrder={false} />
      <Header session={session} onLogout={async () => { await supabase.auth.signOut(); setSession(null); setProfile(null); }} />
      <main className="max-w-4xl mx-auto py-6">{!session ? <Auth /> : renderDashboard()}</main>

      {selectedJob && profile && (
        <JobActionModal
          job={selectedJob}
          currentUserId={session.user.id}
          userRole={profile.role}
          onClose={() => setSelectedJob(null)}
          onUpdate={handleUpdateJob}
          onChecklistUpdate={handleChecklistUpdate}
          onDelete={handleDeleteJob}
        />
      )}

      {showUpdatePassword && <UpdatePasswordModal onUpdatePassword={() => setShowUpdatePassword(false)} />}
    </div>
  );
}
